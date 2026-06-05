import { create } from "zustand";

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  membersCount: number;
}

export interface WikiPage {
  id: string;
  title: string;
  content: string;
  parentId?: string;
  workspaceId: string;
  tags: string[];
  updatedAt: string;
  updatedBy: string;
  version: number;
  comments: Comment[];
}

export interface Comment {
  id: string;
  user: string;
  avatar: string;
  text: string;
  timestamp: string;
}

export interface DocumentFile {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
  uploadedBy: string;
  tags: string[];
  workspaceId: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sources?: string[];
}

export interface Collaborator {
  name: string;
  status: "active" | "idle" | "offline";
  color: string;
  avatar: string;
  pageId?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  type: "info" | "success" | "warning" | "ai";
  time: string;
  read: boolean;
}

interface NexoraState {
  // App settings
  useBackend: boolean;
  setUseBackend: (val: boolean) => void;

  // Active Context
  activeWorkspaceId: string;
  setActiveWorkspaceId: (id: string) => void;
  activeWikiPageId: string;
  setActiveWikiPageId: (id: string) => void;
  currentTab: "dashboard" | "wiki" | "documents" | "search" | "assistant" | "analytics" | "graph" | "admin";
  setCurrentTab: (tab: "dashboard" | "wiki" | "documents" | "search" | "assistant" | "analytics" | "graph" | "admin") => void;

  // Data
  workspaces: Workspace[];
  wikiPages: WikiPage[];
  documents: DocumentFile[];
  chatHistory: Message[];
  collaborators: Collaborator[];
  notifications: NotificationItem[];

  // User Auth
  currentUser: {
    name: string;
    email: string;
    role: string;
    avatar: string;
  } | null;

  // Actions
  login: (email: string, role: string) => void;
  logout: () => void;
  addWikiPage: (title: string, parentId?: string, content?: string) => void;
  updateWikiPage: (id: string, updates: Partial<WikiPage>) => void;
  deleteWikiPage: (id: string) => void;
  addComment: (pageId: string, text: string) => void;
  addDocument: (doc: Omit<DocumentFile, "id" | "uploadedAt" | "uploadedBy" | "workspaceId">) => void;
  deleteDocument: (id: string) => void;
  addMessage: (msg: Omit<Message, "id" | "timestamp">) => void;
  clearChat: () => void;
  markNotificationsAsRead: () => void;
  addNotification: (title: string, description: string, type: NotificationItem["type"]) => void;
}

export const useNexoraStore = create<NexoraState>((set, get) => ({
  useBackend: false, // Default to frontend simulation mode
  setUseBackend: (val) => set({ useBackend: val }),

  activeWorkspaceId: "w1",
  setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id, activeWikiPageId: get().wikiPages.find(p => p.workspaceId === id)?.id || "" }),
  activeWikiPageId: "p1",
  setActiveWikiPageId: (id) => set({ activeWikiPageId: id }),
  currentTab: "dashboard",
  setCurrentTab: (tab) => set({ currentTab: tab }),

  currentUser: {
    name: "Alex Sterling",
    email: "alex@nexora.ai",
    role: "Administrator",
    avatar: "AS"
  },

  workspaces: [
    { id: "w1", name: "Engineering & Dev", icon: "💻", membersCount: 18 },
    { id: "w2", name: "Product Design", icon: "🎨", membersCount: 8 },
    { id: "w3", name: "Operations & HR", icon: "💼", membersCount: 12 },
  ],

  wikiPages: [
    {
      id: "p1",
      workspaceId: "w1",
      title: "Nexora Core Architecture",
      content: `# Nexora Platform Core Architecture

Welcome to the central technical wiki page. Nexora is designed as an ultra-high performance workspace using a decentralized knowledge-graph design.

## System Components
1. **Frontend App:** Single Page App powered by Next.js 15, styled with glassmorphic CSS overlays and tailwind utility tokens. State is client-managed using Zustand.
2. **FastAPI Gateway:** Python-based asynchronous REST API.
3. **Hybrid Semantic Engine:** Computes vector representations using local embedding models (\`all-MiniLM-L6-v2\`), performing spatial searches over documents in less than 20ms.

## Architecture Diagram
Our system deploys across Docker nodes and runs fully micro-serviced in production.
- Client requests hits the NextJS SSR boundary.
- Heavy embeddings calculations are processed asynchronously inside background worker task queues.
`,
      tags: ["Technical", "Documentation", "Architecture"],
      updatedAt: "2026-06-05T09:12:00Z",
      updatedBy: "Sarah Chen",
      version: 4,
      comments: [
        { id: "c1", user: "Marcus Vance", avatar: "MV", text: "Does this scale well with 10k documents?", timestamp: "1 hour ago" },
        { id: "c2", user: "Sarah Chen", avatar: "SC", text: "Yes! The local SQLite fallback utilizes numpy calculations, while production PostgreSQL handles PgVector indexing efficiently.", timestamp: "45 mins ago" }
      ]
    },
    {
      id: "p2",
      workspaceId: "w1",
      title: "Local Development Playbook",
      content: `# Local Development Playbook

Follow these quick steps to launch Nexora in your developer workspace:

## Frontend Setup
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`
Server runs at \`http://localhost:3000\`.

## Backend Setup
\`\`\`bash
cd backend
python -m venv venv
venv\\Scripts\\activate   # On Windows
pip install -r requirements.txt
python main.py
\`\`\`
API runs at \`http://localhost:8000\`.
`,
      parentId: "p1",
      tags: ["Guide", "Developer", "Setup"],
      updatedAt: "2026-06-05T08:30:00Z",
      updatedBy: "Alex Sterling",
      version: 1,
      comments: []
    },
    {
      id: "p3",
      workspaceId: "w2",
      title: "Nexora Design System v1",
      content: `# Nexora Product Design Language

Nexora's visual personality centers around clean aesthetics, glassmorphic panels, and depth.

## Core Rules
- **Themes:** Pure dark background (\`#0B1020\`).
- **Cards:** Glass backdrop-blur (16px), 8% white opacity, with 12% border opacity.
- **Accents:** Neon Indigo (\`#7C3AED\`) paired with vibrant Cyan (\`#06B6D4\`) highlights.

Refer to \`globals.css\` for visual system presets.`,
      tags: ["Design", "Brand", "UI/UX"],
      updatedAt: "2026-06-04T17:45:00Z",
      updatedBy: "Elena Rostova",
      version: 2,
      comments: []
    }
  ],

  documents: [
    { id: "d1", name: "API_Design_Specifications.pdf", type: "PDF", size: "4.2 MB", uploadedAt: "2026-06-04", uploadedBy: "Alex Sterling", tags: ["Spec", "API"], workspaceId: "w1" },
    { id: "d2", name: "Security_Audit_Report_2026.pdf", type: "PDF", size: "12.8 MB", uploadedAt: "2026-06-02", uploadedBy: "Sarah Chen", tags: ["Security", "Compliance"], workspaceId: "w1" },
    { id: "d3", name: "Brand_Asset_Guidelines.pptx", type: "PPTX", size: "22.1 MB", uploadedAt: "2026-06-01", uploadedBy: "Elena Rostova", tags: ["Design", "Marketing"], workspaceId: "w2" },
  ],

  chatHistory: [
    { id: "m1", role: "assistant", content: "Hello! I am your Nexora AI Knowledge Assistant. Ask me anything about your uploaded documents, company wiki pages, or workspaces. How can I help you today?", timestamp: "10:00 AM" }
  ],

  collaborators: [
    { name: "Sarah Chen", status: "active", color: "bg-emerald-500", avatar: "SC", pageId: "p1" },
    { name: "Marcus Vance", status: "idle", color: "bg-amber-500", avatar: "MV", pageId: "p1" },
    { name: "Elena Rostova", status: "active", color: "bg-indigo-500", avatar: "ER", pageId: "p3" },
    { name: "Devon K.", status: "offline", color: "bg-slate-500", avatar: "DK" },
  ],

  notifications: [
    { id: "n1", title: "New Document Indexed", description: "Security_Audit_Report_2026.pdf was successfully split into 48 semantic blocks.", type: "ai", time: "1 hour ago", read: false },
    { id: "n2", title: "Wiki Page Updated", description: "Sarah Chen updated Nexora Core Architecture (v4).", type: "info", time: "2 hours ago", read: false },
    { id: "n3", title: "Comment in Workspace", description: "Marcus Vance mentioned you in Engineering & Dev.", type: "success", time: "4 hours ago", read: true },
  ],

  login: (email, role) => set({
    currentUser: {
      name: email.split("@")[0].split(".").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" "),
      email,
      role,
      avatar: email.substring(0, 2).toUpperCase()
    }
  }),
  logout: () => set({ currentUser: null, currentTab: "dashboard" }),

  addWikiPage: (title, parentId, content) => {
    const activeWs = get().activeWorkspaceId;
    const newPage: WikiPage = {
      id: "p_" + Math.random().toString(36).substring(2, 9),
      workspaceId: activeWs,
      title,
      content: content || `# ${title}\n\nStart typing content here...`,
      parentId,
      tags: [],
      updatedAt: new Date().toISOString(),
      updatedBy: get().currentUser?.name || "Guest",
      version: 1,
      comments: []
    };
    set({
      wikiPages: [...get().wikiPages, newPage],
      activeWikiPageId: newPage.id
    });
    get().addNotification("Page Created", `"${title}" was added to your workspace wiki.`, "success");
  },

  updateWikiPage: (id, updates) => set(state => {
    const pages = state.wikiPages.map(page => {
      if (page.id === id) {
        return {
          ...page,
          ...updates,
          version: page.version + 1,
          updatedAt: new Date().toISOString(),
          updatedBy: state.currentUser?.name || "Guest"
        };
      }
      return page;
    });
    return { wikiPages: pages };
  }),

  deleteWikiPage: (id) => set(state => {
    const filtered = state.wikiPages.filter(p => p.id !== id);
    const activePage = state.activeWikiPageId === id ? (filtered.find(p => p.workspaceId === state.activeWorkspaceId)?.id || "") : state.activeWikiPageId;
    return { wikiPages: filtered, activeWikiPageId: activePage };
  }),

  addComment: (pageId, text) => set(state => {
    const pages = state.wikiPages.map(page => {
      if (page.id === pageId) {
        const newComment: Comment = {
          id: "c_" + Math.random().toString(36).substring(2, 9),
          user: state.currentUser?.name || "Guest",
          avatar: state.currentUser?.avatar || "G",
          text,
          timestamp: "Just now"
        };
        return {
          ...page,
          comments: [...page.comments, newComment]
        };
      }
      return page;
    });
    return { wikiPages: pages };
  }),

  addDocument: (doc) => {
    const newDoc: DocumentFile = {
      ...doc,
      id: "d_" + Math.random().toString(36).substring(2, 9),
      uploadedAt: new Date().toISOString().split("T")[0],
      uploadedBy: get().currentUser?.name || "Guest",
      workspaceId: get().activeWorkspaceId
    };
    set({ documents: [...get().documents, newDoc] });
    get().addNotification("Document Uploaded", `"${doc.name}" has been uploaded and scheduled for semantic parsing.`, "info");
  },

  deleteDocument: (id) => set(state => ({
    documents: state.documents.filter(d => d.id !== id)
  })),

  addMessage: (msg) => {
    const newMessage: Message = {
      ...msg,
      id: "m_" + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    set({ chatHistory: [...get().chatHistory, newMessage] });
  },

  clearChat: () => set({ chatHistory: [
    { id: "m1", role: "assistant", content: "Chat history cleared. How can I help you search your knowledge base now?", timestamp: "Just now" }
  ] }),

  markNotificationsAsRead: () => set(state => ({
    notifications: state.notifications.map(n => ({ ...n, read: true }))
  })),

  addNotification: (title, description, type) => {
    const newNotify: NotificationItem = {
      id: "n_" + Math.random().toString(36).substring(2, 9),
      title,
      description,
      type,
      time: "Just now",
      read: false
    };
    set({ notifications: [newNotify, ...get().notifications] });
  }
}));
