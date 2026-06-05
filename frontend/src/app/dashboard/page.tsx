"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useNexoraStore, WikiPage, DocumentFile, Message } from "../../store/useNexoraStore";
import Sidebar from "../../components/Sidebar";
import GlassCard from "../../components/GlassCard";
import InteractiveNetwork from "../../components/InteractiveNetwork";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Search,
  BookOpen,
  FolderOpen,
  Bot,
  Network,
  BarChart3,
  Settings,
  Plus,
  Send,
  Trash2,
  FileText,
  Upload,
  UserCheck,
  AlertTriangle,
  History,
  MessageSquare,
  Sparkles,
  Zap,
  Users,
  ArrowUpRight,
  Database,
  ArrowRight
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const store = useNexoraStore();

  const [notificationOpen, setNotificationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ page: WikiPage; score: number; snippet: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [wikiEditTitle, setWikiEditTitle] = useState("");
  const [wikiEditContent, setWikiEditContent] = useState("");
  const [wikiCommentText, setWikiCommentText] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Authenticate Session Check
  useEffect(() => {
    if (!store.currentUser) {
      router.push("/auth");
    }
  }, [store.currentUser, router]);

  // Sync edit title and content when wiki page changes
  const activeWikiPage = store.wikiPages.find((p) => p.id === store.activeWikiPageId);
  useEffect(() => {
    if (activeWikiPage) {
      setWikiEditTitle(activeWikiPage.title);
      setWikiEditContent(activeWikiPage.content);
    }
  }, [store.activeWikiPageId, activeWikiPage]);

  if (!store.currentUser) return null;

  // Wiki Handlers
  const handleSaveWiki = () => {
    if (!activeWikiPage) return;
    store.updateWikiPage(activeWikiPage.id, {
      title: wikiEditTitle,
      content: wikiEditContent,
    });
    store.addNotification("Wiki Saved", `Saved changes to "${wikiEditTitle}" (v${activeWikiPage.version + 1}).`, "success");
  };

  const handleApplyTemplate = (templateName: string) => {
    let content = "";
    if (templateName === "SOP") {
      content = `# Standard Operating Procedure (SOP)

## Purpose
Document the step-by-step process to achieve a recurring workflow task.

## Scope
Applicable to all engineering team members.

## Procedure
1. Step 1: Initialize local environment.
2. Step 2: Validate branch hooks.
3. Step 3: Launch staging review pipelines.`;
    } else if (templateName === "Meeting") {
      content = `# Meeting Notes: [Title]

**Date:** ${new Date().toLocaleDateString()}
**Attendees:** ${store.currentUser.name}, Sarah Chen

## Agenda
- Product release schedule review
- Local semantic search enhancements

## Action Items
- [ ] Complete sqlite fallback schema
- [ ] Refine Framer motion layouts`;
    }

    setWikiEditContent(content);
  };

  const handleAddWikiComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wikiCommentText.trim() || !activeWikiPage) return;
    store.addComment(activeWikiPage.id, wikiCommentText);
    setWikiCommentText("");
  };

  // Upload Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null) return null;
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setUploadProgress(null);
            store.addDocument({
              name: file.name,
              type: file.name.split(".").pop()?.toUpperCase() || "PDF",
              size: (file.size / (1024 * 1024)).toFixed(1) + " MB",
              tags: ["Uploaded", "Ingested"],
            });
          }, 300);
          return 100;
        }
        return prev + 30;
      });
    }, 200);
  };

  // Semantic Search Handlers
  const triggerSemanticSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    if (store.useBackend) {
      try {
        const res = await fetch(`http://localhost:8000/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          const mapped = data.map((item: any) => ({
            page: {
              id: item.id || "p1",
              title: item.title || "Match",
              content: item.content || "",
              updatedAt: new Date().toISOString(),
              updatedBy: "System",
              workspaceId: store.activeWorkspaceId,
            },
            score: Math.round(item.score * 100),
            snippet: item.snippet || "",
          }));
          setSearchResults(mapped);
          return;
        }
      } catch (err) {
        console.warn("Backend API not reachable. Falling back to local simulation.");
      }
    }

    // Local Search Simulation
    const terms = query.toLowerCase().split(" ");
    const matches = store.wikiPages
      .map((p) => {
        let score = 0;
        terms.forEach((term) => {
          if (p.title.toLowerCase().includes(term)) score += 40;
          if (p.content.toLowerCase().includes(term)) score += 20;
          p.tags.forEach((t) => {
            if (t.toLowerCase().includes(term)) score += 15;
          });
        });

        if (score > 100) score = 100;
        if (score === 0) return null;

        const contentLines = p.content.split("\n");
        const matchingLine = contentLines.find(line => line.toLowerCase().includes(terms[0])) || contentLines[0] || "";

        return {
          page: p,
          score: Math.min(98, score + Math.floor(Math.random() * 15)),
          snippet: matchingLine,
        };
      })
      .filter((m): m is { page: WikiPage; score: number; snippet: string } => m !== null)
      .sort((a, b) => b.score - a.score);

    setSearchResults(matches);
  };

  // Chat Assistant Handlers
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    store.addMessage({ role: "user", content: userText });
    setChatInput("");
    setChatLoading(true);

    if (store.useBackend) {
      try {
        const res = await fetch("http://localhost:8000/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userText }),
        });
        if (res.ok) {
          const data = await res.json();
          store.addMessage({
            role: "assistant",
            content: data.response,
            sources: data.sources || [],
          });
          setChatLoading(false);
          return;
        }
      } catch (err) {
        console.warn("FastAPI chat server offline. Falling back to simulator.");
      }
    }

    // Simulated RAG pipeline responses
    setTimeout(() => {
      let aiResponse = "";
      let sources: string[] = [];
      const queryLower = userText.toLowerCase();

      if (queryLower.includes("architecture") || queryLower.includes("component")) {
        aiResponse = "Based on our *Nexora Core Architecture* documentation, the architecture consists of a Next.js 15 client frontend executing Zustand for UI state management. The backend is built using FastAPI (Python) routing heavy embedding computations locally through HuggingFace (`sentence-transformers`). Data vectors can fallback to local SQLite matrices or utilize production PostgreSQL with `pgvector` indexing.";
        sources = ["Nexora Core Architecture"];
      } else if (queryLower.includes("install") || queryLower.includes("run") || queryLower.includes("setup")) {
        aiResponse = "To launch the platform locally: \n1. Install and compile frontend assets by navigating to `/frontend` and running `npm run dev`.\n2. Start the FastAPI micro-services inside `/backend` with `pip install -r requirements.txt` and `python main.py`.";
        sources = ["Local Development Playbook"];
      } else if (queryLower.includes("color") || queryLower.includes("design") || queryLower.includes("theme")) {
        aiResponse = "Our design layout features frosted glass panels (`background: rgba(12, 12, 12, 0.5)`), blur coefficients of `24px`, and borders styled at `4% opacity`. Colors leverage Silver-to-Gray gradients over deepest obsidian black canvases (`#050505`).";
        sources = ["Nexora Design System v1"];
      } else {
        aiResponse = "I scanned the active workspaces and local files. While there is no explicit SOP document relating to that specific query, I recommend checking our global Engineering guidelines or creating a new wiki template to record standard operating procedures.";
        sources = ["System Knowledge Base"];
      }

      store.addMessage({
        role: "assistant",
        content: aiResponse,
        sources,
      });
      setChatLoading(false);
      store.addNotification("AI Assistant Replied", "AI retrieved context matching your request.", "ai");
    }, 1200);
  };

  const handleConvertMessageToSOP = (content: string) => {
    const title = prompt("Enter SOP Wiki Title:", "Generated SOP Wiki");
    if (title) {
      store.addWikiPage(title, undefined, `# ${title}\n\n${content}`);
      store.setCurrentTab("wiki");
    }
  };

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-[#050505] text-[#ededed]">
      {/* Sidebar Component */}
      <Sidebar />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Subtle background glow flare */}
        <div className="absolute top-0 right-1/4 w-[350px] h-[350px] rounded-full radial-glow opacity-5 blur-[80px] pointer-events-none" />

        {/* Workspace Topbar Header */}
        <header className="h-16 border-b border-white/5 px-8 flex items-center justify-between z-20 bg-[#050505]/75 backdrop-blur-lg shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-300 capitalize tracking-wider">
              {store.currentTab} Workspace
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[9px] text-[#555] font-semibold tracking-widest uppercase">
              {store.useBackend ? "Local FastAPI Online" : "Simulated Offline"}
            </span>
          </div>

          <div className="flex items-center gap-5">
            {/* Quick Search trigger */}
            <div
              onClick={() => store.setCurrentTab("search")}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition text-muted hover:text-white"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[9px] font-medium text-[#888888]">Search semantic docs...</span>
            </div>

            {/* Presence Indicators */}
            <div className="flex -space-x-2 items-center">
              {store.collaborators.map((user, idx) => (
                <div
                  key={idx}
                  title={`${user.name} (${user.status})`}
                  className="w-7 h-7 rounded-full bg-gradient-to-tr from-neutral-700 to-neutral-500 border border-[#050505] flex items-center justify-center text-[10px] font-bold text-white relative shadow-sm cursor-help"
                >
                  {user.avatar}
                  <div className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-[#050505] ${user.color}`} />
                </div>
              ))}
              <span className="text-[10px] text-muted pl-3 font-semibold">{store.collaborators.length} active</span>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 rounded-lg relative transition"
              >
                <Bell className="w-3.5 h-3.5 text-slate-300" />
                {store.notifications.some((n) => !n.read) && (
                  <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                )}
              </button>

              <AnimatePresence>
                {notificationOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute right-0 top-11 w-80 bg-[#0c0c0c] border border-white/10 rounded-xl shadow-2xl p-2.5 z-50 backdrop-blur-xl glass-texture"
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-white/10 mb-2 px-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#888888]">Alerts & Logs</span>
                      <button
                        onClick={() => store.markNotificationsAsRead()}
                        className="text-[9px] text-[#888888] hover:text-white font-bold"
                      >
                        Mark read
                      </button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {store.notifications.map((notify) => (
                        <div
                          key={notify.id}
                          className={`p-2 rounded-lg text-xs transition border ${
                            notify.read ? "border-transparent bg-white/0" : "border-white/5 bg-white/5"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-semibold text-white block">{notify.title}</span>
                            <span className="text-[9px] text-zinc-500">{notify.time}</span>
                          </div>
                          <span className="text-zinc-400 block text-[10px] mt-1 leading-normal">
                            {notify.description}
                          </span>
                        </div>
                      ))}
                      {store.notifications.length === 0 && (
                        <span className="text-xs text-zinc-500 block text-center py-4 italic">No alerts.</span>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Tab Canvas Area */}
        <div className="flex-1 overflow-y-auto p-8 z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={store.currentTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="w-full min-h-full"
            >
          
          {/* TAB 1: Dashboard */}
          {store.currentTab === "dashboard" && (
            <div className="space-y-8 max-w-5xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">
                    Welcome back, <span className="gradient-text-primary">{store.currentUser.name}</span>
                  </h1>
                  <p className="text-xs text-[#888888] mt-1">Here is a summary of Nexora's active knowledge index.</p>
                </div>
                <button
                  onClick={() => store.setCurrentTab("assistant")}
                  className="px-4 py-2 bg-white text-black hover:bg-neutral-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-[0_4px_12px_rgba(255,255,255,0.05)] w-max transition"
                >
                  <Bot className="w-4 h-4" />
                  Ask AI second brain
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <GlassCard className="p-4 border-white/5">
                  <span className="text-[9px] font-bold text-[#888888] uppercase tracking-wider block">Indexed Wikis</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-xl font-semibold text-white">{store.wikiPages.length}</span>
                    <BookOpen className="w-3.5 h-3.5 text-neutral-400" />
                  </div>
                </GlassCard>
                <GlassCard className="p-4 border-white/5">
                  <span className="text-[9px] font-bold text-[#888888] uppercase tracking-wider block">Ingested Documents</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-xl font-semibold text-white">{store.documents.length}</span>
                    <FolderOpen className="w-3.5 h-3.5 text-neutral-400" />
                  </div>
                </GlassCard>
                <GlassCard className="p-4 border-white/5">
                  <span className="text-[9px] font-bold text-[#888888] uppercase tracking-wider block">Collaborators</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-xl font-semibold text-white">{store.collaborators.length}</span>
                    <Users className="w-3.5 h-3.5 text-neutral-400" />
                  </div>
                </GlassCard>
                <GlassCard className="p-4 border-white/5">
                  <span className="text-[9px] font-bold text-[#888888] uppercase tracking-wider block">Semantic Queries</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-xl font-semibold text-white">148</span>
                    <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                  </div>
                </GlassCard>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* AI Insights panel */}
                <GlassCard className="p-6 border-white/5 md:col-span-2">
                  <h3 className="font-semibold text-sm mb-4 flex items-center gap-2 text-blue-400">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    AI Workspace Insights
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/10 text-xs">
                      <span className="font-semibold text-white block">💡 Topic Gap Identified</span>
                      <span className="text-[#888888] block mt-1 leading-normal">
                        We detected 8 team queries searching for **"AWS Bucket Credentials"** which returned zero wiki matches. Recommend generating a setup guide.
                      </span>
                      <button
                        onClick={() => {
                          const title = "AWS S3 Setup Guide";
                          store.addWikiPage(title, undefined, `# AWS S3 Setup Guide\n\nEnter S3 credential configuration steps...`);
                          store.setCurrentTab("wiki");
                        }}
                        className="mt-3.5 px-3 py-1.5 bg-[#0C0C0C]/50 hover:bg-white/5 rounded-lg font-medium text-[9px] border border-white/10 flex items-center gap-1 transition-all"
                      >
                        Create Wiki SOP Page
                        <ArrowUpRight className="w-3 h-3 text-blue-400" />
                      </button>
                    </div>

                    <div className="p-4 rounded-lg bg-[#0C0C0C]/50 border border-white/5 text-xs">
                      <span className="font-semibold text-white block">📊 High Engagement Wiki</span>
                      <span className="text-[#888888] block mt-1 leading-normal">
                        **"Nexora Core Architecture"** has been edited 4 times this week by Sarah Chen. It currently serves as our most popular documentation node.
                      </span>
                    </div>
                  </div>
                </GlassCard>

                {/* Recent activity log */}
                <GlassCard className="p-6 border-white/5 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-sm mb-4 flex items-center gap-2 text-slate-300">
                      <History className="w-3.5 h-3.5 text-slate-400" />
                      Recent Logs
                    </h3>
                    <div className="space-y-4">
                      {store.notifications.slice(0, 3).map((item) => (
                        <div key={item.id} className="text-xs border-b border-white/5 pb-2 last:border-0 last:pb-0">
                          <span className="font-medium text-white block">{item.title}</span>
                          <span className="text-[#888888] text-[9px] block mt-0.5 leading-tight">{item.description}</span>
                          <span className="text-[#555] text-[9px] block mt-1">{item.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => setNotificationOpen(true)}
                    className="mt-4 w-full py-2 bg-[#0C0C0C]/50 hover:bg-white/5 rounded-lg text-center text-xs font-medium border border-white/10 transition-all block"
                  >
                    View All Logs
                  </button>
                </GlassCard>
              </div>

              {/* Popular Docs list */}
              <GlassCard className="p-6 border-white/5">
                <h3 className="font-semibold text-sm mb-4 flex items-center gap-2 text-slate-300">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Popular Documents & Spec sheets
                </h3>
                <div className="space-y-2">
                  {store.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 bg-[#0C0C0C]/40 hover:bg-white/5 rounded-lg border border-white/5 flex justify-between items-center text-xs transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                        <div>
                          <span className="font-semibold text-white block leading-tight">{doc.name}</span>
                          <span className="text-[#888888] text-[9px] mt-0.5 block">
                            Size: {doc.size} | Uploaded by {doc.uploadedBy} on {doc.uploadedAt}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        {doc.tags.map((tag, idx) => (
                          <span key={idx} className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[8px] text-[#888888]">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          )}

          {/* TAB 2: Wiki Workspace */}
          {store.currentTab === "wiki" && (
            <div className="h-full flex gap-6 max-w-6xl mx-auto">
              {activeWikiPage ? (
                <>
                  {/* Left Side: Wiki Rich Editor */}
                  <div className="flex-1 flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div>
                        <input
                          type="text"
                          value={wikiEditTitle}
                          onChange={(e) => setWikiEditTitle(e.target.value)}
                          className="bg-transparent border-0 font-semibold text-xl text-white outline-none focus:ring-0 w-full"
                          placeholder="Untitled Wiki Page"
                        />
                        <p className="text-[9px] text-[#888888] mt-1 leading-none">
                          Author: <strong className="text-slate-300">{activeWikiPage.updatedBy}</strong> | Version {activeWikiPage.version}
                        </p>
                      </div>

                      {/* Header controls */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApplyTemplate("SOP")}
                          className="px-2.5 py-1.5 bg-[#0C0C0C]/50 border border-white/10 hover:bg-white/5 rounded-lg text-[9px] font-medium transition-all"
                        >
                          + SOP Template
                        </button>
                        <button
                          onClick={() => handleApplyTemplate("Meeting")}
                          className="px-2.5 py-1.5 bg-[#0C0C0C]/50 border border-white/10 hover:bg-white/5 rounded-lg text-[9px] font-medium transition-all"
                        >
                          + Meeting Template
                        </button>
                        <button
                          onClick={handleSaveWiki}
                          className="px-4 py-1.5 bg-white text-black hover:bg-neutral-200 rounded-lg text-[10px] font-semibold transition-all"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>

                    {/* Editor Textarea */}
                    <div className="flex-1 min-h-[400px] flex flex-col bg-[#0C0C0C]/40 border border-white/5 rounded-xl overflow-hidden">
                      <div className="bg-white/5 border-b border-white/5 px-4 py-2 flex items-center justify-between">
                        <span className="text-[9px] font-bold text-[#888888] uppercase tracking-wider">Markdown Editor Workspace</span>
                        <div className="flex gap-1.5 text-[9px] text-[#555]">
                          <span># header</span>
                          <span>|</span>
                          <span>**bold**</span>
                        </div>
                      </div>
                      <textarea
                        value={wikiEditContent}
                        onChange={(e) => setWikiEditContent(e.target.value)}
                        className="flex-1 w-full bg-transparent p-6 outline-none text-xs text-slate-200 font-mono resize-none leading-relaxed"
                        placeholder="Write something in markdown..."
                      />
                    </div>
                  </div>

                  {/* Right Side: Version history, Comments */}
                  <div className="w-80 flex flex-col gap-6 shrink-0">
                    {/* Wiki metadata tags */}
                    <GlassCard className="p-4 border-white/5">
                      <span className="text-[9px] font-bold text-[#888888] uppercase tracking-wider block mb-2">Metadata Tags</span>
                      <div className="flex flex-wrap gap-1.5">
                        {activeWikiPage.tags.map((tag, idx) => (
                          <span key={idx} className="bg-blue-500/5 border border-blue-500/10 px-2.5 py-0.5 rounded text-[9px] text-blue-400">
                            {tag}
                          </span>
                        ))}
                        <button
                          onClick={() => {
                            const newTag = prompt("Enter tag name:");
                            if (newTag) {
                              store.updateWikiPage(activeWikiPage.id, {
                                tags: [...activeWikiPage.tags, newTag],
                              });
                            }
                          }}
                          className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[9px] text-[#888888] hover:text-white transition-all"
                        >
                          + Add
                        </button>
                      </div>
                    </GlassCard>

                    {/* Version History Log */}
                    <GlassCard className="p-4 border-white/5">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#888888] mb-3 flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5 text-slate-400" />
                        Page History
                      </h4>
                      <div className="space-y-3.5 max-h-36 overflow-y-auto pr-1">
                        {[...Array(activeWikiPage.version)].map((_, idx) => {
                          const v = activeWikiPage.version - idx;
                          return (
                            <div key={v} className="flex justify-between items-center text-xs pb-2 border-b border-white/5 last:border-0 last:pb-0">
                              <div>
                                <span className="font-semibold text-white">Version {v}</span>
                                <span className="text-[#888888] text-[9px] block">Edited by {activeWikiPage.updatedBy}</span>
                              </div>
                              <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-muted">Active</span>
                            </div>
                          );
                        })}
                      </div>
                    </GlassCard>

                    {/* Comments Board */}
                    <GlassCard className="p-4 border-white/5 flex-1 flex flex-col justify-between overflow-hidden">
                      <div className="overflow-hidden flex flex-col flex-1">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#888888] mb-3 flex items-center gap-1.5 shrink-0">
                          <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                          Discussion Comments
                        </h4>
                        <div className="space-y-3 overflow-y-auto pr-1 flex-1 mb-4">
                          {activeWikiPage.comments.map((comment) => (
                            <div key={comment.id} className="text-xs bg-white/5 p-2.5 rounded-xl border border-white/5">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-neutral-700 to-neutral-500 flex items-center justify-center text-[9px] font-bold text-white uppercase">
                                    {comment.avatar}
                                  </div>
                                  <span className="font-semibold text-white">{comment.user}</span>
                                </div>
                                <span className="text-[9px] text-[#555]">{comment.timestamp}</span>
                              </div>
                              <p className="text-slate-300 mt-1.5 leading-normal">{comment.text}</p>
                            </div>
                          ))}
                          {activeWikiPage.comments.length === 0 && (
                            <span className="text-[10px] text-[#555] italic block text-center py-4">No comments yet.</span>
                          )}
                        </div>
                      </div>

                      {/* Comment Input */}
                      <form onSubmit={handleAddWikiComment} className="flex gap-2 shrink-0">
                        <input
                          type="text"
                          value={wikiCommentText}
                          onChange={(e) => setWikiCommentText(e.target.value)}
                          placeholder="Write comment..."
                          className="flex-1 bg-[#050505] border border-white/5 rounded-lg py-2 px-3 text-xs outline-none text-white focus:border-blue-500"
                        />
                        <button
                          type="submit"
                          className="p-2 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 rounded-lg text-blue-400 transition-all"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    </GlassCard>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center w-full text-center py-24 animate-float">
                  <BookOpen className="w-12 h-12 text-[#555] mb-4" />
                  <h3 className="font-bold text-base text-white">No Wiki Page Selected</h3>
                  <p className="text-xs text-[#888888] max-w-xs mt-1">Select a wiki document from the sidebar navigation tree or create a new page.</p>
                  <button
                    onClick={() => {
                      const title = prompt("Enter page title:");
                      if (title) store.addWikiPage(title);
                    }}
                    className="mt-4 px-4 py-2 bg-white text-black hover:bg-neutral-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Create New Wiki Page
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Document Library */}
          {store.currentTab === "documents" && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div>
                  <h1 className="text-xl font-semibold tracking-tight">Document Library</h1>
                  <p className="text-xs text-[#888888] mt-1">Ingest PDF/DOCX records into the semantic search database.</p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.docx,.pptx,.txt"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-white text-black hover:bg-neutral-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    Upload File
                  </button>
                </div>
              </div>

              {/* Uploading progress bar */}
              {uploadProgress !== null && (
                <GlassCard className="p-4 border-blue-500/20 bg-blue-500/5">
                  <div className="flex justify-between items-center text-[11px] mb-2">
                    <span className="font-semibold text-white">Ingesting document...</span>
                    <span className="text-blue-400 font-bold">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-[#050505] rounded-full h-1 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </GlassCard>
              )}

              {/* Ingest List */}
              <GlassCard className="p-6 border-white/5">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 pb-2 text-[#555] font-bold tracking-wider uppercase text-[9px]">
                        <th className="py-2.5">File Name</th>
                        <th className="py-2.5">Size</th>
                        <th className="py-2.5">Date Ingested</th>
                        <th className="py-2.5">Uploaded By</th>
                        <th className="py-2.5">Vector Status</th>
                        <th className="py-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {store.documents.map((doc) => (
                        <tr key={doc.id} className="border-b border-white/5 hover:bg-white/5 transition-all duration-150">
                          <td className="py-3 flex items-center gap-2.5 font-medium text-white">
                            <FileText className="w-4 h-4 text-blue-400" />
                            {doc.name}
                          </td>
                          <td className="py-3 text-[#a1a1aa]">{doc.size}</td>
                          <td className="py-3 text-[#a1a1aa]">{doc.uploadedAt}</td>
                          <td className="py-3 text-[#a1a1aa]">{doc.uploadedBy}</td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 bg-emerald-500/5 border border-emerald-500/10 rounded text-[8px] font-bold text-emerald-400">
                              Vectorized
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => {
                                store.deleteDocument(doc.id);
                                store.addNotification("Doc Removed", `Deleted ${doc.name} from index.`, "warning");
                              }}
                              className="text-[#555] hover:text-red-500 p-1 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {store.documents.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-muted italic">
                            No documents indexed. Ingest a document file to begin vector mapping.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </div>
          )}

          {/* TAB 4: Semantic Search */}
          {store.currentTab === "search" && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="text-center pb-3">
                <h1 className="text-xl font-semibold tracking-tight text-white">AI Semantic Engine</h1>
                <p className="text-xs text-[#888888] mt-1">Queries the vector indexes using cosine similarity. Reads intent, not keywords.</p>
              </div>

              {/* Central Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-4 text-blue-500 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => triggerSemanticSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/5 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                  placeholder="Ask a question about your knowledge files (e.g. core architecture components)..."
                />
              </div>

              {/* Suggestions */}
              <div className="flex flex-wrap items-center gap-2 justify-center text-xs text-[#888888] pt-1">
                <span>Try:</span>
                <button
                  onClick={() => handleQuerySuggestionClick("What components compile the core platform?")}
                  className="bg-[#0C0C0C]/60 hover:bg-white/5 px-2.5 py-1 rounded-full border border-white/10 text-[10px] text-slate-300 transition-all"
                >
                  "core components setup"
                </button>
                <button
                  onClick={() => handleQuerySuggestionClick("How do we configure local development environment?")}
                  className="bg-[#0C0C0C]/60 hover:bg-white/5 px-2.5 py-1 rounded-full border border-white/10 text-[10px] text-slate-300 transition-all"
                >
                  "local environment config"
                </button>
              </div>

              {/* Result Listings */}
              <div className="space-y-4 pt-4">
                {searchResults.map((result, idx) => (
                  <GlassCard key={idx} className="p-5 border-white/5">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                          <h3
                            onClick={() => {
                              store.setActiveWikiPageId(result.page.id);
                              store.setCurrentTab("wiki");
                            }}
                            className="font-semibold text-white text-xs hover:text-blue-400 cursor-pointer transition-colors"
                          >
                            {result.page.title}
                          </h3>
                        </div>
                        <span className="text-[9px] text-[#555] block mt-1">
                          /workspaces/{result.page.workspaceId === "w1" ? "engineering" : "design"}/{result.page.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-[9px] font-bold">
                        <Zap className="w-2.5 h-2.5" />
                        {result.score}% Match
                      </div>
                    </div>

                    <p className="text-[#a1a1aa] text-xs mt-3 leading-relaxed bg-black/20 p-3 rounded border border-white/5 font-mono">
                      ... {result.snippet} ...
                    </p>
                  </GlassCard>
                ))}

                {searchQuery && searchResults.length === 0 && (
                  <div className="text-center py-12 bg-white/5 rounded-lg border border-white/5 text-[#888888] text-xs italic">
                    No matching database records found.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: AI Assistant */}
          {store.currentTab === "assistant" && (
            <div className="h-full max-w-4xl mx-auto flex flex-col justify-between overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/5 pb-3 shrink-0 mb-4">
                <div>
                  <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2 text-white">
                    <Bot className="text-blue-500 w-4 h-4 animate-pulse" />
                    AI Assistant RAG Pipeline
                  </h1>
                  <p className="text-xs text-[#888888]">Answers queries context-aware using local document embeddings.</p>
                </div>
                <button
                  onClick={() => store.clearChat()}
                  className="px-2.5 py-1 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-[9px] text-slate-300 transition-all"
                >
                  Clear Chat
                </button>
              </div>

              {/* Messages Panel */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
                {store.chatHistory.map((msg) => {
                  const isAi = msg.role === "assistant";
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 max-w-[85%] ${isAi ? "mr-auto" : "ml-auto flex-row-reverse"}`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center font-bold text-[10px] shadow-sm ${
                          isAi
                            ? "bg-gradient-to-tr from-neutral-700 to-neutral-500 text-white"
                            : "bg-gradient-to-tr from-blue-600 to-blue-500 text-white"
                        }`}
                      >
                        {isAi ? "AI" : store.currentUser.avatar}
                      </div>

                      <div className="space-y-2">
                        <GlassCard
                          className={`p-4 border-white/5 ${
                            isAi ? "rounded-tl-none bg-[#0C0C0C]/70" : "rounded-tr-none bg-blue-500/5 border-blue-500/10"
                          }`}
                        >
                          <p className="text-slate-200 text-xs leading-relaxed font-sans whitespace-pre-wrap">
                            {msg.content}
                          </p>
                          <span className="text-[8px] text-[#555] block text-right mt-1.5">{msg.timestamp}</span>
                        </GlassCard>

                        {isAi && msg.sources && msg.sources.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[8px] text-[#555] font-bold uppercase tracking-wider">Citations:</span>
                            {msg.sources.map((src, idx) => (
                              <span key={idx} className="bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-[8px] text-slate-300">
                                {src}
                              </span>
                            ))}
                            <button
                              onClick={() => handleConvertMessageToSOP(msg.content)}
                              className="bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full text-[8px] font-semibold hover:bg-emerald-500/15 transition-all ml-auto flex items-center gap-1"
                            >
                              <Plus className="w-2.5 h-2.5" />
                              Convert to SOP Wiki
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {chatLoading && (
                  <div className="flex gap-3 mr-auto items-center">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-neutral-700 to-neutral-500 text-white flex items-center justify-center font-bold text-[10px] shadow-sm">
                      AI
                    </div>
                    <div className="flex gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" />
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce delay-75" />
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce delay-150" />
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input Field */}
              <form onSubmit={handleChatSubmit} className="flex gap-2 shrink-0 border-t border-white/5 pt-3 bg-[#050505]">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask a question (e.g. Summarize our core system dependencies)..."
                  className="flex-1 bg-black/40 border border-white/5 rounded-lg py-2.5 px-4 text-xs outline-none text-white focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="p-2.5 bg-white text-black hover:bg-neutral-200 rounded-lg shadow transition-all flex items-center justify-center"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}

          {/* TAB 6: Knowledge Graph */}
          {store.currentTab === "graph" && (
            <div className="h-full max-w-5xl mx-auto flex flex-col">
              <InteractiveNetwork />
            </div>
          )}

          {/* TAB 7: Insights & Analytics */}
          {store.currentTab === "analytics" && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="border-b border-white/5 pb-3">
                <h1 className="text-xl font-semibold tracking-tight text-white">Knowledge Insights & Analytics</h1>
                <p className="text-xs text-[#888888] mt-1">Scan organizational information structures and missing documentation blocks.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Search Term Analytics */}
                <GlassCard className="p-6 border-white/5 md:col-span-2">
                  <h3 className="font-semibold text-xs mb-4 text-[#888888] uppercase tracking-wider">Top User Query Targets</h3>
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-200">1. "Docker deployment logs"</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-black/40 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-blue-500 h-full w-[90%]" />
                        </div>
                        <span className="text-[#555] font-bold text-[10px]">42 hits</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-200">2. "Framer animation configurations"</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-black/40 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-blue-500 h-full w-[70%]" />
                        </div>
                        <span className="text-[#555] font-bold text-[10px]">31 hits</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-200">3. "PgVector sql schema migrations"</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-black/40 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-blue-500 h-full w-[50%]" />
                        </div>
                        <span className="text-[#555] font-bold text-[10px]">20 hits</span>
                      </div>
                    </div>
                  </div>
                </GlassCard>

                {/* Missing knowledge gap alerts */}
                <GlassCard className="p-6 border-white/5 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-xs mb-4 text-[#888888] uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-blue-500" />
                      Missing Knowledge Gaps
                    </h3>
                    <div className="space-y-4 text-xs">
                      <div className="pb-3 border-b border-white/5">
                        <span className="font-semibold text-white block">"SOC2 Compliance checklist"</span>
                        <span className="text-[#888888] text-[9px] block mt-0.5">8 failed queries with 0 similarity.</span>
                      </div>
                      <div className="pb-3 border-b border-white/5">
                        <span className="font-semibold text-white block">"Redis caching setup"</span>
                        <span className="text-[#888888] text-[9px] block mt-0.5">5 failed queries with 0 similarity.</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const title = "SOC2 Compliance Checklist";
                      store.addWikiPage(title, undefined, `# SOC2 Compliance Checklist\n\nConfigure SOC2 compliance procedures...`);
                      store.setCurrentTab("wiki");
                    }}
                    className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-center text-xs font-semibold transition-all"
                  >
                    Generate SOC2 SOP Wiki
                  </button>
                </GlassCard>
              </div>
            </div>
          )}

          {/* TAB 8: Admin Console */}
          {store.currentTab === "admin" && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="border-b border-white/5 pb-3">
                <h1 className="text-xl font-semibold tracking-tight text-white">Admin Console</h1>
                <p className="text-xs text-[#888888] mt-1">Configure workspace rules, Role-Based Access Controls (RBAC), and logs.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Users List Table */}
                <GlassCard className="p-6 border-white/5 md:col-span-2">
                  <h3 className="font-semibold text-xs mb-4 text-[#888888] uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                    Workspace User Roles (RBAC)
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-white/5">
                      <div>
                        <span className="font-semibold text-white block leading-tight">Alex Sterling</span>
                        <span className="text-[#888888] text-[9px]">alex@nexora.ai</span>
                      </div>
                      <span className="px-2 py-0.5 bg-blue-500/5 border border-blue-500/10 rounded text-[9px] font-bold text-blue-400">
                        Administrator
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-white/5">
                      <div>
                        <span className="font-semibold text-white block leading-tight">Sarah Chen</span>
                        <span className="text-[#888888] text-[9px]">sarah@nexora.ai</span>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-500/5 border border-emerald-500/10 rounded text-[9px] font-bold text-emerald-400">
                        Author / Editor
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-white/5">
                      <div>
                        <span className="font-semibold text-white block leading-tight">Marcus Vance</span>
                        <span className="text-[#888888] text-[9px]">marcus@nexora.ai</span>
                      </div>
                      <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] font-bold text-[#888888]">
                        Collaborator
                      </span>
                    </div>
                  </div>
                </GlassCard>

                {/* Settings settings settings */}
                <GlassCard className="p-6 border-white/5 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-xs mb-4 text-[#888888] uppercase tracking-wider flex items-center gap-1.5">
                      <Settings className="w-3.5 h-3.5 text-slate-400" />
                      Workspace Settings
                    </h3>
                    <div className="space-y-4 text-xs">
                      <div>
                        <span className="font-semibold text-white block">Audit Trailing status</span>
                        <span className="text-[9px] text-emerald-400 font-bold mt-1 block">✓ Hardened AES Logging active</span>
                      </div>
                      <div>
                        <span className="font-semibold text-white block">Multi-Factor Authenticator</span>
                        <span className="text-[9px] text-[#888888] font-bold mt-1 block">Enabled (Enforce on Admins)</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => alert("Audit logs downloaded to locally secure storage.")}
                    className="w-full py-2 bg-[#0C0C0C]/60 hover:bg-white/5 border border-white/10 text-white rounded-lg text-center text-xs font-semibold transition-all"
                  >
                    Download Audit CSV log
                  </button>
                </GlassCard>
              </div>
            </div>
          )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
