"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "../components/GlassCard";
import NexoraLogo from "../components/NexoraLogo";
import {
  Search,
  Zap,
  BookOpen,
  FolderOpen,
  Network,
  ShieldCheck,
  Code2,
  Sparkles,
  ArrowRight,
  ChevronRight,
  GitBranch,
  FileText,
  Lock,
  Cpu,
  Layers,
  MessageSquare,
  Server,
  UserCheck,
  History
} from "lucide-react";

export default function LandingPage() {
  const [typedQuery, setTypedQuery] = useState("");
  const [searchResultActive, setSearchResultActive] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // Search Typing Simulation
  useEffect(() => {
    const targetQuery = "How do we configure local embedding vectors?";
    let index = 0;
    let timer: NodeJS.Timeout;

    const startTyping = () => {
      timer = setInterval(() => {
        if (index < targetQuery.length) {
          setTypedQuery(targetQuery.slice(0, index + 1));
          index++;
        } else {
          clearInterval(timer);
          setTimeout(() => {
            setSearchResultActive(true);
          }, 450);
        }
      }, 45);
    };

    const delayStart = setTimeout(startTyping, 1000);

    return () => {
      clearTimeout(delayStart);
      clearInterval(timer);
    };
  }, []);

  const faqs = [
    {
      q: "Does Nexora require paid OpenAI API keys?",
      a: "No! Nexora is engineered local-first. It connects directly with Ollama or uses CPU-based HuggingFace transformers (sentence-transformers) for free, offline semantic embedding and search."
    },
    {
      q: "What file formats are supported for document ingestion?",
      a: "Nexora parses PDFs, DOCX files, PowerPoint slides (PPTX), standard Markdown docs, and images with automatic text extraction."
    },
    {
      q: "Can I self-host this with Docker?",
      a: "Absolutely. We supply a full docker-compose.yml config comprising pgvector PostgreSQL, Redis caching, FastAPI server, and Next.js frontend."
    },
    {
      q: "How does the hybrid search function?",
      a: "It combines dense vector calculations (cosine similarity over neural embeddings) with traditional sparse lexical matching (similar to BM25) to guarantee highly accurate results."
    }
  ];

  // Motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-[#ededed] overflow-hidden relative font-sans">
      {/* Subtle Ambient Background Glows */}
      <div className="absolute top-[-150px] left-1/3 w-[600px] h-[600px] rounded-full radial-glow opacity-30 blur-[140px] -z-10 animate-pulse-slow" />
      <div className="absolute bottom-[200px] right-1/4 w-[600px] h-[600px] rounded-full secondary-glow opacity-20 blur-[130px] -z-10" />

      {/* Landing Navbar */}
      <header className="border-b border-white/5 backdrop-blur-lg sticky top-0 z-50 bg-[#030303]/70">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <NexoraLogo className="w-8 h-8" />
            <div>
              <span className="font-semibold tracking-tight text-white text-base block leading-none">NEXORA</span>
              <span className="text-[8px] tracking-widest text-[#888888] font-semibold mt-1 block">WORKSPACE</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-xs text-[#888888]">
            <a href="#features" className="hover:text-white transition-colors duration-200">Features</a>
            <a href="#demo" className="hover:text-white transition-colors duration-200">Interactive Demo</a>
            <a href="#pricing" className="hover:text-white transition-colors duration-200">Pricing</a>
            <a href="#security" className="hover:text-white transition-colors duration-200">Security</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href="/auth"
              className="text-xs font-medium px-4 py-2 border border-white/10 hover:bg-white/5 hover:border-white/20 rounded-lg transition-all duration-200"
            >
              Sign In
            </Link>
            <Link
              href="/auth?signup=true"
              className="text-xs font-medium px-4 py-2 bg-white text-black hover:bg-neutral-200 rounded-lg shadow-[0_4px_12px_rgba(255,255,255,0.05)] transition-all duration-200"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-28 pb-16 px-6 relative max-w-7xl mx-auto flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-[#a1a1aa] font-medium mb-6"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
          The Self-Hosted AI Second Brain
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="text-4xl sm:text-6xl font-semibold tracking-tight max-w-4xl leading-tight text-white"
        >
          Transform Company Knowledge Into a <br className="hidden sm:inline" />
          <span className="gradient-text-primary">Living Knowledge Base</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="mt-6 text-sm sm:text-base text-[#888888] max-w-xl leading-relaxed"
        >
          Nexora consolidates team wikis, uploaded documents, conversation history, and templates into an interactive, glassmorphic workspace powered by offline semantic AI.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center"
        >
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/auth"
              className="w-full sm:w-auto px-6 py-3 bg-white text-black hover:bg-neutral-200 rounded-lg font-medium text-xs shadow-[0_4px_12px_rgba(255,255,255,0.1)] flex items-center justify-center gap-1.5 transition-all duration-200"
            >
              Launch Free Workspace
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <a
              href="#demo"
              className="w-full sm:w-auto px-6 py-3 bg-[#0c0c0c] border border-white/10 hover:bg-white/5 rounded-lg font-medium text-xs text-white flex items-center justify-center gap-1.5 transition-all duration-200"
            >
              Watch AI Demo
            </a>
          </motion.div>
        </motion.div>

        {/* AI Typing Search Animation Panel */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.45 }}
          className="mt-20 w-full max-w-4xl relative"
        >
          <div className="absolute inset-0 bg-blue-500/5 rounded-2xl blur-3xl opacity-20 -z-10" />
          <GlassCard className="p-6 text-left border-white/5 shadow-2xl relative" glowColor="rgba(255,255,255,0.03)" hoverEffect={false}>
            {/* Window title bar */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              </div>
              <span className="text-[9px] text-zinc-500 font-semibold tracking-widest uppercase">NEXORA SEMANTIC GATEWAY</span>
              <div className="w-12 h-2" />
            </div>

            {/* Search Input Box */}
            <div className="relative">
              <Search className="absolute left-4 top-3.5 text-blue-500 w-4 h-4" />
              <div className="w-full bg-[#050505] border border-white/5 rounded-lg py-3 pl-11 pr-4 text-xs text-white flex items-center min-h-[44px] shadow-inner font-mono">
                <span>{typedQuery}</span>
                <span className="w-1.5 h-3.5 bg-blue-500 ml-0.5 animate-pulse" />
              </div>
            </div>

            {/* Simulated Search Response */}
            <AnimatePresence>
              {searchResultActive && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="mt-5 space-y-4"
                >
                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-2.5 py-0.5 rounded-lg w-max">
                    <Zap className="w-3 h-3 text-emerald-400" />
                    Semantic Match Index: 98.4%
                  </div>
                  <p className="text-xs leading-relaxed text-[#a1a1aa] bg-white/5 p-4 rounded-lg border border-white/5 font-sans">
                    To run semantic embedding search offline, Nexora initiates Uvicorn routes mapping to a local `SentenceTransformer('all-MiniLM-L6-v2')` pipeline. It extracts text chunks from PDF/Markdown libraries, creates 384-dimensional array vectors, and compares cosines directly without sending data to external endpoints.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <div className="text-[9px] bg-white/5 border border-white/5 px-2.5 py-1 rounded-full text-[#888888] flex items-center gap-1.5">
                      <FileText className="w-3 h-3 text-blue-400" />
                      local_dev_playbook.md (Chunk 3)
                    </div>
                    <div className="text-[9px] bg-white/5 border border-white/5 px-2.5 py-1 rounded-full text-[#888888] flex items-center gap-1.5">
                      <FileText className="w-3 h-3 text-blue-400" />
                      api_design_specifications.pdf (Page 14)
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        </motion.div>
      </section>

      {/* Bento Grid Features Layout */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-6 border-t border-white/5 relative">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="text-center mb-16"
        >
          <motion.h2 variants={itemVariants} className="text-2xl font-semibold tracking-tight text-white">Engineered For Teams</motion.h2>
          <motion.p variants={itemVariants} className="text-[#888888] text-xs mt-2.5 max-w-sm mx-auto">
            Clean, functional layouts styled with Vercel and Linear standards. Optimized and developer-first.
          </motion.p>
        </motion.div>

        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          
          {/* Card 1: Semantic Search (colspan-2) */}
          <div className="md:col-span-2">
            <GlassCard className="p-6 border-white/5 flex flex-col justify-between h-full" glowColor="rgba(255,255,255,0.02)">
              <div>
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                  <Search className="w-4 h-4 text-blue-500" />
                </div>
                <h3 className="text-sm font-semibold mb-1.5 text-white">AI Semantic Search Engine</h3>
                <p className="text-xs text-[#888888] leading-relaxed max-w-xl">
                  Nexora uses a local sentence embedding pipeline to parse document chunks. Instead of simple keyword strings, it reads the contextual intent, returning relevant file segments in under 20 milliseconds.
                </p>
              </div>
              
              <div className="mt-5 space-y-2 bg-[#050505]/60 p-3 rounded-lg border border-white/5">
                <div className="flex justify-between items-center text-[9px] border-b border-white/5 pb-1.5 text-[#555555]">
                  <span>QueryResult: "database config"</span>
                  <span className="text-emerald-400 font-medium">96% Similarity Match</span>
                </div>
                <div className="text-[9px] text-[#a1a1aa] font-mono py-1">
                  ... engine = create_engine(DATABASE_URL, connect_args=connect_args) ...
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Card 2: Self-Hosted & Local-First (colspan-1) */}
          <div className="md:col-span-1">
            <GlassCard className="p-6 border-white/5 flex flex-col justify-between h-full" glowColor="rgba(255, 255, 255, 0.02)">
              <div>
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                  <Cpu className="w-4 h-4 text-slate-300" />
                </div>
                <h3 className="text-sm font-semibold mb-1.5 text-white">100% Offline Privacy</h3>
                <p className="text-xs text-[#888888] leading-relaxed">
                  Keep your intellectual property 100% private. Run Nexora locally on your private cloud using local embeddings and Ollama support.
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between text-[9px] bg-white/5 border border-white/5 p-2 rounded-lg">
                <span className="text-[#a1a1aa] flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-blue-500" />
                  SQLite vector fallback
                </span>
                <span className="text-emerald-400 font-semibold">ACTIVE</span>
              </div>
            </GlassCard>
          </div>

          {/* Card 3: Interactive Knowledge Graph (colspan-1, rowspan-2) */}
          <div className="md:col-span-1">
            <GlassCard className="p-6 border-white/5 flex flex-col justify-between h-full" glowColor="rgba(255, 255, 255, 0.02)">
              <div>
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                  <Network className="w-4 h-4 text-slate-300" />
                </div>
                <h3 className="text-sm font-semibold mb-1.5 text-white">Relationship Graph</h3>
                <p className="text-xs text-[#888888] leading-relaxed">
                  Information is not isolated. Visualize page references, overlapping topics, and tags through a dynamic vector graph, uncovering connected knowledge pipelines instantly.
                </p>
              </div>

              <div className="mt-6 relative h-28 bg-[#050505]/40 rounded-lg border border-white/5 overflow-hidden flex items-center justify-center">
                <div className="absolute w-16 h-16 rounded-full bg-blue-500/5 border border-white/5 animate-pulse" />
                <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[7px] font-bold z-10">
                  DB
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Card 4: Wiki Workspace (colspan-2) */}
          <div className="md:col-span-2">
            <GlassCard className="p-6 border-white/5 flex flex-col justify-between h-full" glowColor="rgba(255, 255, 255, 0.02)">
              <div>
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                  <BookOpen className="w-4 h-4 text-slate-300" />
                </div>
                <h3 className="text-sm font-semibold mb-1.5 text-white">Markdown Wiki Workspace</h3>
                <p className="text-xs text-[#888888] leading-relaxed max-w-xl">
                  A premium markdown editor equipped with template insertion shortcuts (SOPs, meeting logs), nested document trees, active revision histories, and team commenting streams.
                </p>
              </div>

              <div className="mt-5 bg-[#050505]/50 border border-white/5 rounded-lg p-3">
                <div className="flex justify-between items-center pb-2 border-b border-white/5 text-[9px] text-[#555555]">
                  <span>wiki_guide.md</span>
                  <span className="text-emerald-400">● Saved</span>
                </div>
                <div className="text-[9px] text-[#888888] font-mono mt-2">
                  # Setup Checklist <br/>
                  - [x] Run npm install; npm run dev
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Card 5: Auto-Tagging & Metadata (colspan-1) */}
          <div className="md:col-span-1">
            <GlassCard className="p-6 border-white/5 flex flex-col justify-between h-full" glowColor="rgba(255, 255, 255, 0.02)">
              <div>
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                  <Layers className="w-4 h-4 text-slate-300" />
                </div>
                <h3 className="text-sm font-semibold mb-1.5 text-white">Smart Auto-Tagging</h3>
                <p className="text-xs text-[#888888] leading-relaxed">
                  AI scans files upon upload and automatically appends smart classification tags, department headers, and summary logs.
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-1.5">
                <span className="bg-white/5 border border-white/10 px-2.5 py-0.5 rounded text-[8px] text-[#a1a1aa]">#Engineering</span>
                <span className="bg-white/5 border border-white/10 px-2.5 py-0.5 rounded text-[8px] text-[#a1a1aa]">#Q3_Release</span>
              </div>
            </GlassCard>
          </div>

          {/* Card 6: Enterprise Security (colspan-2) */}
          <div className="md:col-span-2">
            <GlassCard className="p-6 border-white/5 flex flex-col justify-between h-full" glowColor="rgba(255, 255, 255, 0.02)">
              <div>
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-4 h-4 text-slate-300" />
                </div>
                <h3 className="text-sm font-semibold mb-1.5 text-white">Enterprise Permissioning</h3>
                <p className="text-xs text-[#888888] leading-relaxed max-w-xl">
                  Nexora is equipped with strict Role-Based Access Controls (RBAC), multi-factor authentication (MFA) prompts, passwordless Magic Link dispatch pipelines, and detailed audit logging.
                </p>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 text-[9px] text-[#a1a1aa]">
                <div className="p-2 bg-white/5 border border-white/5 rounded-lg flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-500" />
                  MFA Enforce
                </div>
                <div className="p-2 bg-white/5 border border-white/5 rounded-lg flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  RBAC Active
                </div>
                <div className="p-2 bg-white/5 border border-white/5 rounded-lg flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-neutral-400" />
                  AES Logging
                </div>
              </div>
            </GlassCard>
          </div>

        </motion.div>
      </section>

      {/* Interactive AI Search Playground */}
      <section id="demo" className="py-20 bg-black/10 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-[#a1a1aa] font-medium mb-4">
              <Cpu className="w-3.5 h-3.5" />
              Interactive Playground
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">Try Semantic Classification</h2>
            <p className="text-xs text-[#888888] mt-3 leading-relaxed">
              Standard databases require matching exact wording. Nexora reads the intent. Try asking questions about our mock database in the window.
            </p>
            <div className="mt-5 space-y-2.5">
              <div className="p-3 bg-white/5 border border-white/5 rounded-lg text-xs hover:border-white/20 hover:bg-white/10 cursor-pointer transition-all flex items-center justify-between">
                <span>"Who designed the color rules?"</span>
                <ChevronRight className="w-4 h-4 text-blue-500" />
              </div>
              <div className="p-3 bg-white/5 border border-white/5 rounded-lg text-xs hover:border-white/20 hover:bg-white/10 cursor-pointer transition-all flex items-center justify-between">
                <span>"How do we configure database migrations?"</span>
                <ChevronRight className="w-4 h-4 text-blue-500" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <GlassCard className="p-6 border-white/5" glowColor="rgba(255,255,255,0.02)">
              <h3 className="font-semibold text-xs mb-3 flex items-center gap-1.5 text-blue-400">
                <Sparkles className="w-4 h-4 text-blue-400" />
                Knowledge Graph Ingest
              </h3>
              <div className="space-y-3.5">
                <div className="p-2.5 bg-black/30 rounded-lg border border-white/5 text-xs flex justify-between items-center">
                  <span className="text-slate-300 font-mono text-[11px]">Nexora Design System.md</span>
                  <span className="text-emerald-400 font-medium">Indexed</span>
                </div>
                <div className="p-2.5 bg-black/30 rounded-lg border border-white/5 text-xs flex justify-between items-center">
                  <span className="text-slate-300 font-mono text-[11px]">Core Architecture Spec.pdf</span>
                  <span className="text-emerald-400 font-medium">Indexed</span>
                </div>
                <div className="p-2.5 bg-black/30 rounded-lg border border-white/5 text-xs flex justify-between items-center">
                  <span className="text-slate-300 font-mono text-[11px]">Local Dev Playbook.md</span>
                  <span className="text-emerald-400 font-medium">Indexed</span>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section id="pricing" className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-2xl font-semibold tracking-tight text-white">Self-Hosted Pricing</h2>
          <p className="text-[#888888] text-xs mt-2.5">Run fully free in offline dev workspaces, or scale to enterprise instances.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Starter */}
          <GlassCard className="p-6 border-white/5 flex flex-col justify-between min-h-[360px]" glowColor="rgba(255,255,255,0.02)">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Self-Host Basic</span>
              <h3 className="text-xl font-semibold mt-1 text-white">$0</h3>
              <p className="text-[11px] text-[#888888] mt-1.5">Perfect for single developers or local offline testing.</p>
              <ul className="mt-5 space-y-2 text-[11px] text-slate-300">
                <li className="flex items-center gap-2">✓ Local SQLite similarity vector engine</li>
                <li className="flex items-center gap-2">✓ Offline Sentence-Transformer ingestion</li>
                <li className="flex items-center gap-2">✓ Unlimited local wiki pages & uploads</li>
              </ul>
            </div>
            <Link
              href="/auth"
              className="mt-6 w-full py-2 bg-[#0c0c0c] hover:bg-white/5 border border-white/10 rounded-lg text-center text-xs font-medium block transition-all"
            >
              Start Free Locally
            </Link>
          </GlassCard>

          {/* Pro */}
          <GlassCard className="p-6 border-white/15 relative flex flex-col justify-between min-h-[360px] shadow-[0_4px_30px_rgba(255,255,255,0.02)]" glowColor="rgba(255,255,255,0.03)">
            <div className="absolute top-0 right-6 transform -translate-y-1/2 bg-white text-black text-[9px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Popular
            </div>
            <div>
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">Team Cluster</span>
              <h3 className="text-xl font-semibold mt-1 text-white">$19<span className="text-xs font-normal text-[#888888]">/user/mo</span></h3>
              <p className="text-[11px] text-[#888888] mt-1.5">For growing technology groups requiring cloud hosting.</p>
              <ul className="mt-5 space-y-2 text-[11px] text-slate-300">
                <li className="flex items-center gap-2">✓ Docker Compose + PgVector production DB</li>
                <li className="flex items-center gap-2">✓ Real-time multi-user editing presence</li>
                <li className="flex items-center gap-2">✓ Redis integration & admin console</li>
                <li className="flex items-center gap-2">✓ 15+ external cloud connections</li>
              </ul>
            </div>
            <Link
              href="/auth"
              className="mt-6 w-full py-2 bg-white text-black hover:bg-neutral-200 rounded-lg text-center text-xs font-semibold block transition-all"
            >
              Get Started
            </Link>
          </GlassCard>

          {/* Enterprise */}
          <GlassCard className="p-6 border-white/5 flex flex-col justify-between min-h-[360px]" glowColor="rgba(255,255,255,0.02)">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enterprise Shield</span>
              <h3 className="text-xl font-semibold mt-1 text-white">$49<span className="text-xs font-normal text-[#888888]">/user/mo</span></h3>
              <p className="text-[11px] text-[#888888] mt-1.5">For global enterprise networks needing high availability.</p>
              <ul className="mt-5 space-y-2 text-[11px] text-slate-300">
                <li className="flex items-center gap-2">✓ Kubernetes ready clustering configs</li>
                <li className="flex items-center gap-2">✓ SSO SAML, MFA, & LDAP logins</li>
                <li className="flex items-center gap-2">✓ SOC2 compliant auditing reports</li>
                <li className="flex items-center gap-2">✓ Dedicated offline LLM support channel</li>
              </ul>
            </div>
            <Link
              href="/auth"
              className="mt-6 w-full py-2 bg-[#0c0c0c] hover:bg-white/5 border border-white/10 rounded-lg text-center text-xs font-medium block transition-all"
            >
              Request Enterprise Demo
            </Link>
          </GlassCard>
        </div>
      </section>

      {/* Security Info */}
      <section id="security" className="py-20 bg-black/10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Lock className="w-8 h-8 text-slate-300 mb-4" />
            <h2 className="text-2xl font-semibold tracking-tight text-white">Security Hardened. Privacy Guaranteed.</h2>
            <p className="text-xs text-[#888888] mt-4 leading-relaxed">
              Nexora was engineered from day one to safeguard sensitive intellectual assets. Because we support running entirely offline and self-contained on your hardware, your data is never compiled, shared, or scanned by external LLM agencies.
            </p>
          </motion.div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 rounded-lg border border-white/5">
              <span className="font-semibold text-white block text-xs">RBAC Access</span>
              <span className="text-[10px] text-[#888888] mt-1 block">Limit pages to specific groups.</span>
            </div>
            <div className="p-4 bg-white/5 rounded-lg border border-white/5">
              <span className="font-semibold text-white block text-xs">MFA Validation</span>
              <span className="text-[10px] text-[#888888] mt-1 block">Verify login through token codes.</span>
            </div>
            <div className="p-4 bg-white/5 rounded-lg border border-white/5">
              <span className="font-semibold text-white block text-xs">AES-256</span>
              <span className="text-[10px] text-[#888888] mt-1 block">Encrypt database text chunks.</span>
            </div>
            <div className="p-4 bg-white/5 rounded-lg border border-white/5">
              <span className="font-semibold text-white block text-xs">Audit Trails</span>
              <span className="text-[10px] text-[#888888] mt-1 block">Track user edits and log changes.</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ section */}
      <section className="py-24 max-w-3xl mx-auto px-6">
        <h2 className="text-xl font-semibold tracking-tight text-center text-white mb-12">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="border border-white/5 rounded-lg bg-white/5 overflow-hidden transition-all duration-300"
            >
              <button
                onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                className="w-full p-4 text-left flex justify-between items-center text-xs font-medium text-white hover:bg-white/5 transition-all"
              >
                <span>{faq.q}</span>
                <ChevronRight className={`w-3.5 h-3.5 text-blue-500 transition-transform duration-300 ${faqOpen === idx ? "rotate-90" : ""}`} />
              </button>
              <AnimatePresence initial={false}>
                {faqOpen === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <p className="px-4 pb-4 pt-1 text-[11px] text-[#888888] leading-relaxed border-t border-white/5 bg-black/10">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* Landing Footer */}
      <footer className="border-t border-white/5 py-12 bg-black/40 text-muted">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2.5">
            <NexoraLogo className="w-6 h-6" />
            <span className="font-semibold text-white text-xs">NEXORA</span>
          </div>
          <span className="text-[10px] font-normal">© 2026 Nexora Inc. Distributed under Apache 2.0 open source licenses.</span>
        </div>
      </footer>
    </div>
  );
}
