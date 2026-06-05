"use client";

import React, { useState, useEffect } from "react";
import { useNexoraStore, WikiPage } from "../store/useNexoraStore";
import { Network, FileText, LayoutGrid, Search } from "lucide-react";

interface Node {
  id: string;
  label: string;
  type: "workspace" | "page";
  x: number;
  y: number;
  fx?: number;
  fy?: number;
}

interface Link {
  source: string;
  target: string;
}

export default function InteractiveNetwork() {
  const { workspaces, wikiPages, setActiveWikiPageId, setCurrentTab } = useNexoraStore();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Initialize network nodes from real workspaces and wiki pages
  useEffect(() => {
    const tempNodes: Node[] = [];
    const tempLinks: Link[] = [];

    // Map Workspaces
    workspaces.forEach((ws, idx) => {
      const angle = (idx / workspaces.length) * Math.PI * 2;
      const radius = 180;
      tempNodes.push({
        id: ws.id,
        label: `${ws.icon} ${ws.name}`,
        type: "workspace",
        x: 400 + Math.cos(angle) * radius,
        y: 300 + Math.sin(angle) * radius,
      });
    });

    // Map Pages
    wikiPages.forEach((page, idx) => {
      // Position around its workspace
      const parentWs = tempNodes.find((n) => n.id === page.workspaceId);
      if (parentWs) {
        const angle = (idx / wikiPages.length) * Math.PI * 2 + Math.random();
        const dist = 90;
        const pageId = page.id;
        tempNodes.push({
          id: pageId,
          label: page.title,
          type: "page",
          x: parentWs.x + Math.cos(angle) * dist,
          y: parentWs.y + Math.sin(angle) * dist,
        });

        // Link page to workspace
        tempLinks.push({
          source: page.workspaceId,
          target: pageId,
        });

        // Link child page to parent page
        if (page.parentId) {
          tempLinks.push({
            source: page.parentId,
            target: pageId,
          });
        }
      }
    });

    setNodes(tempNodes);
    setLinks(tempLinks);
  }, [workspaces, wikiPages]);

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    // Avoid pan triggering if node is clicked
    if ((e.target as SVGElement).tagName !== "svg") return;
    setDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  const handleNodeClick = (node: Node) => {
    setSelectedNode(node);
    if (node.type === "page") {
      setActiveWikiPageId(node.id);
      // Wait a moment so the user sees the node click before navigation
      setTimeout(() => {
        setCurrentTab("wiki");
      }, 300);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Top Header Panel */}
      <div className="flex justify-between items-center mb-4 border-b border-borderGlass pb-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Network className="text-accent w-5 h-5 animate-pulse" />
            Interactive Knowledge Graph
          </h2>
          <p className="text-xs text-muted">
            Visualize relationships between wiki documents and project workspaces. Double click or tap nodes to navigate.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
            className="px-3 py-1 bg-white/5 border border-borderGlass hover:bg-white/10 rounded text-xs transition"
          >
            Zoom Out
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="px-3 py-1 bg-white/5 border border-borderGlass hover:bg-white/10 rounded text-xs transition"
          >
            Reset View
          </button>
          <button
            onClick={() => setZoom(Math.min(2, zoom + 0.1))}
            className="px-3 py-1 bg-white/5 border border-borderGlass hover:bg-white/10 rounded text-xs transition"
          >
            Zoom In
          </button>
        </div>
      </div>

      {/* Main SVG Layout */}
      <div className="flex-1 bg-black/30 border border-borderGlass rounded-2xl relative overflow-hidden select-none">
        <svg
          className="w-full h-full cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Defs for gradients */}
          <defs>
            <radialGradient id="node-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="cyan-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Group containing all graph links and nodes with Zoom/Pan */}
          <g transform={`translate(${400 + pan.x}, ${300 + pan.y}) scale(${zoom}) translate(-400, -300)`}>
            {/* Draw Links */}
            {links.map((link, idx) => {
              const sourceNode = nodes.find((n) => n.id === link.source);
              const targetNode = nodes.find((n) => n.id === link.target);
              if (!sourceNode || !targetNode) return null;

              return (
                <line
                  key={`link-${idx}`}
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke="rgba(255, 255, 255, 0.15)"
                  strokeWidth="1.5"
                  className="node-link"
                />
              );
            })}

            {/* Draw Nodes */}
            {nodes.map((node) => {
              const isWorkspace = node.type === "workspace";
              const isSelected = selectedNode?.id === node.id;

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-pointer group"
                  onClick={() => handleNodeClick(node)}
                >
                  {/* Outer Glow Halo */}
                  <circle
                    r={isWorkspace ? 35 : 24}
                    fill={isWorkspace ? "url(#node-glow)" : "url(#cyan-glow)"}
                    className="transition-all duration-300 opacity-80 group-hover:scale-125"
                  />

                  {/* Base Circle */}
                  <circle
                    r={isWorkspace ? 18 : 10}
                    className={`transition-all duration-300 ${
                      isSelected
                        ? "stroke-white fill-primary stroke-2"
                        : isWorkspace
                        ? "fill-[#7C3AED]/20 stroke-[#7C3AED] hover:fill-[#7C3AED]/40"
                        : "fill-[#06B6D4]/20 stroke-[#06B6D4] hover:fill-[#06B6D4]/40"
                    } stroke-2`}
                  />

                  {/* Icon Representation */}
                  {isWorkspace ? (
                    <circle r="4" fill="white" className="pointer-events-none" />
                  ) : (
                    <circle r="2" fill="white" className="pointer-events-none" />
                  )}

                  {/* Node Name Text */}
                  <text
                    y={isWorkspace ? 34 : 22}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="10"
                    fontWeight="500"
                    className="font-sans drop-shadow-md select-none pointer-events-none group-hover:fill-accent group-hover:font-semibold transition-all"
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Selected Node Sidebar Overlay */}
        {selectedNode && (
          <div className="absolute bottom-4 right-4 glass-panel p-4 max-w-xs border-white/10 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              {selectedNode.type === "workspace" ? (
                <LayoutGrid className="w-4 h-4 text-primary" />
              ) : (
                <FileText className="w-4 h-4 text-accent" />
              )}
              <h3 className="font-bold text-sm text-white truncate">{selectedNode.label}</h3>
            </div>
            <p className="text-xs text-muted">
              {selectedNode.type === "workspace"
                ? "Workspace container holding resources, project guidelines, and team knowledge categories."
                : "Active wiki document page. Click details to open this document in the rich-text reader."}
            </p>
            {selectedNode.type === "page" && (
              <button
                onClick={() => handleNodeClick(selectedNode)}
                className="mt-2 w-full py-1.5 bg-primary/20 hover:bg-primary/40 text-white rounded-lg border border-primary/40 text-xs transition"
              >
                Open Document Details
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
