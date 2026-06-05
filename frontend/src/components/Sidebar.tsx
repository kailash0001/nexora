"use client";

import React, { useState } from "react";
import { useNexoraStore } from "../store/useNexoraStore";
import NexoraLogo from "./NexoraLogo";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  FolderOpen,
  Search,
  Bot,
  BarChart3,
  Network,
  Settings,
  Plus,
  ChevronDown,
  Server,
  Zap,
  LogOut,
  FolderOpen as DocIcon
} from "lucide-react";

export default function Sidebar() {
  const {
    currentTab,
    setCurrentTab,
    workspaces,
    activeWorkspaceId,
    setActiveWorkspaceId,
    wikiPages,
    activeWikiPageId,
    setActiveWikiPageId,
    addWikiPage,
    currentUser,
    logout,
    useBackend,
    setUseBackend
  } = useNexoraStore();

  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  // Filter wiki pages that belong to the active workspace
  const workspacePages = wikiPages.filter((p) => p.workspaceId === activeWorkspaceId);

  const handleCreatePage = (e: React.MouseEvent) => {
    e.stopPropagation();
    const title = prompt("Enter new page title:");
    if (title) {
      addWikiPage(title);
      setCurrentTab("wiki");
    }
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "wiki", label: "Wiki Workspace", icon: BookOpen },
    { id: "documents", label: "Document Library", icon: DocIcon },
    { id: "search", label: "Semantic Search", icon: Search },
    { id: "assistant", label: "AI Assistant", icon: Bot },
    { id: "graph", label: "Knowledge Graph", icon: Network },
    { id: "analytics", label: "Insights & Analytics", icon: BarChart3 },
    { id: "admin", label: "Admin Console", icon: Settings },
  ] as const;

  return (
    <div className="w-64 h-screen bg-[#050505] border-r border-white/5 flex flex-col z-30 select-none glass-texture relative shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-white/5 flex items-center justify-between">
        <div 
          className="flex items-center gap-2.5 cursor-pointer group" 
          onClick={() => setCurrentTab("dashboard")}
        >
          <NexoraLogo className="w-8 h-8 group-hover:scale-105 transition-transform" />
          <div>
            <span className="font-extrabold text-sm tracking-wider text-white">NEXORA</span>
            <span className="text-[9px] block text-slate-400 font-semibold tracking-widest mt-[-2px]">WORKSPACE</span>
          </div>
        </div>
      </div>

      {/* Workspace Selector */}
      <div className="px-4 py-3 relative">
        <button
          onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-left"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-lg">{activeWorkspace.icon}</span>
            <div>
              <span className="text-sm font-semibold text-white block leading-tight">{activeWorkspace.name}</span>
              <span className="text-[10px] text-zinc-500 block">{activeWorkspace.membersCount} collaborators</span>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-zinc-400" />
        </button>

        {showWorkspaceMenu && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-16 left-4 right-4 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl p-2 z-50 backdrop-blur-xl"
          >
            <span className="text-[9px] text-zinc-500 font-bold px-2 py-1.5 block uppercase tracking-wider">
              Workspaces
            </span>
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => {
                  setActiveWorkspaceId(ws.id);
                  setShowWorkspaceMenu(false);
                }}
                className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-left transition-all ${
                  ws.id === activeWorkspaceId 
                    ? "bg-white/10 text-white font-medium" 
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="text-lg">{ws.icon}</span>
                <span className="text-sm">{ws.name}</span>
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Navigation tabs */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group text-left relative ${
                isActive
                  ? "bg-white/5 border border-white/10 text-white font-medium"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-transform group-hover:scale-105 ${isActive ? "text-blue-400" : "text-zinc-400 group-hover:text-white"}`} />
                <span className="text-xs font-medium">{item.label}</span>
              </div>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              )}
            </button>
          );
        })}

        {/* Wiki nested pages sub-list */}
        {currentTab === "wiki" && (
          <div className="mt-4 pt-4 border-t border-white/5 pl-3">
            <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 pr-2">
              <span>Wiki Documents</span>
              <button onClick={handleCreatePage} title="Create page" className="hover:text-blue-400 p-0.5 rounded transition">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {workspacePages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => setActiveWikiPageId(page.id)}
                  className={`w-full text-left truncate text-xs px-2.5 py-1.5 rounded-lg block transition-all ${
                    page.id === activeWikiPageId
                      ? "text-blue-400 font-semibold bg-white/5 border border-white/5"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  📝 {page.title}
                </button>
              ))}
              {workspacePages.length === 0 && (
                <span className="text-[10px] text-zinc-500 italic block px-2.5">No pages found. Click + to create.</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mode Switcher */}
      <div className="p-4 border-t border-white/5 bg-black/10">
        <div className="flex items-center justify-between bg-white/5 rounded-xl p-1 border border-white/5">
          <button
            onClick={() => setUseBackend(false)}
            className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition ${
              !useBackend 
                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" 
                : "text-zinc-500 hover:text-white"
            }`}
          >
            <Zap className="w-3 h-3" />
            MOCK
          </button>
          <button
            onClick={() => setUseBackend(true)}
            className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition ${
              useBackend 
                ? "bg-white/10 text-white border border-white/20" 
                : "text-zinc-500 hover:text-white"
            }`}
          >
            <Server className="w-3 h-3" />
            LOCAL API
          </button>
        </div>
      </div>

      {/* Logged in User Profile */}
      {currentUser && (
        <div className="p-4 border-t border-white/5 flex items-center justify-between bg-[#080808]/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-500 flex items-center justify-center text-xs font-bold text-white uppercase shadow-md border border-white/10">
              {currentUser.avatar}
            </div>
            <div className="max-w-[120px]">
              <span className="text-xs font-semibold text-white block truncate leading-tight">{currentUser.name}</span>
              <span className="text-[10px] text-zinc-500 block truncate leading-none mt-0.5">{currentUser.role}</span>
            </div>
          </div>
          <button onClick={logout} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-white/5 transition">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
