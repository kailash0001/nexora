# Nexora — AI-Powered Team Knowledge Platform

<div align="center">

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg?style=flat-square)](https://opensource.org/licenses/Apache-2.0)
[![Next.js Version](https://img.shields.io/badge/Next.js-15.1.0-black.svg?style=flat-square&logo=next.js)](https://nextjs.org/)
[![FastAPI Version](https://img.shields.io/badge/FastAPI-0.109.0-009688.svg?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Docker Compose Ready](https://img.shields.io/badge/Docker_Compose-Ready-2496ED.svg?style=flat-square&logo=docker)](https://www.docker.com/)
[![Local-First AI](https://img.shields.io/badge/AI-Local--First_&_Offline-10B981.svg?style=flat-square)](https://ollama.com/)

**Nexora** is an enterprise-grade, self-hosted AI Second Brain for teams. It consolidates scattered wikis, uploaded documents, conversation history, and templates into an interactive, glassmorphic workspace powered by offline local semantic AI.

[Key Features](#-key-features) • [System Architecture](#-system-architecture) • [Getting Started](#-getting-started) • [Docker Deployment](#-docker-deployment) • [GitHub Publishing Guide](#-github-publishing-guide)

</div>

---

## 🎨 Design Philosophy

Nexora is designed with a premium, high-end developer aesthetic inspired by Stripe, Vercel, and Linear:
- **Obsidian & Silver:** Deep obsidian black canvases (`#030303`) paired with zinc-steel borders, sharp typography, and subtle steel-blue status indicators.
- **Frosted Glass Panels:** Real-time backdrop-blur saturate overlays featuring a tactile SVG grain noise texture to simulate premium physical layers.
- **Fluid Animations:** Spring-physics page entries, scroll reveals, active tab horizontal slides, and mouse-spotlight hover reflections powered by **Framer Motion**.

---

## ⚡ Key Features

* **📝 Notion-Style Wiki Workspace:** A rich markdown editor supporting SOP & meeting note templates, nested document hierarchies, edit logs, and collaborative comment sections.
* **📂 Ingestion & Document Library:** Multi-format file uploader (PDF, DOCX, PPTX, TXT) that splits documents into semantic chunks, encodes them into vector representations, and lists metadata status.
* **🔍 Intent-Based Semantic Search:** A cosine similarity search engine that reads the contextual intent of queries, matching files in under 20ms and providing source-level text snippets.
* **🤖 Context-Aware AI Chat:** An interactive RAG (Retrieval-Augmented Generation) assistant that answers queries based on your uploaded documentation, citing references and allowing you to save conversations directly into SOP Wiki pages.
* **📊 Knowledge Gap Analytics:** A dashboard tracker compiling top user queries, identifying queries with 0% semantic matches, and prompting administrators to generate pages for missing information blocks.
* **🕸️ Interactive Relationship Graph:** A physics-simulated node network visualizing overlapping topics, page references, and metadata tags.
* **🛡️ Admin Console (RBAC & Audit):** Comprehensive configuration panels listing user access roles, multi-factor authentication toggles, and secure AES-256 audit log downloads.

---

## 🏗️ System Architecture

```text
                                  ┌────────────────────────┐
                                  │   Next.js 15 Client    │
                                  │ (Zustand State Engine) │
                                  └───────────┬────────────┘
                                              │
                                       REST / JSON API
                                              │
                                              ▼
                                  ┌────────────────────────┐
                                  │   FastAPI Gateway      │
                                  │  (JWT Auth & Routing)  │
                                  └───────────┬────────────┘
                                              │
                    ┌─────────────────────────┴─────────────────────────┐
                    ▼                                                   ▼
        ┌───────────────────────┐                           ┌───────────────────────┐
        │   Local AI Engine     │                           │   Database Session    │
        │ (SentenceTransformer) │                           │  (SQLAlchemy Engine)  │
        └───────────┬───────────┘                           └───────────┬───────────┘
                    │                                                   │
        ┌───────────┴───────────┐                           ┌───────────┴───────────┐
        │   Ollama Local LLM    │                           │ SQLite (Local Dev) /  │
        │ (llama3 / offline)    │                           │ PostgreSQL + pgvector │
        └───────────────────────┘                           └───────────────────────┘
```

- **Frontend Client (`/frontend`):** A Next.js 15 Single Page Application styled with TailwindCSS, globals.css glass panels, and Framer Motion. State management is reactive via a Zustand global store.
- **FastAPI Gateway (`/backend`):** An asynchronous Python API handling authentication, document tokenization, wiki management, and database query executions.
- **Semantic Engine (`ai_engine.py`):** Encodes text into 384-dimensional dense vectors using a local `all-MiniLM-L6-v2` transformer model running entirely offline on CPU.
- **Database Layer:** Uses a lightweight SQLAlchemy engine that defaults to a local SQLite schema for zero-setup development, and connects to a production PostgreSQL cluster with `pgvector` index support when deployed in Docker.

---

## 🛠️ Folder Layout

```text
nexora/
├── docker-compose.yml       # Production-ready PostgreSQL/PgVector/Redis stack
├── README.md                # General system handbook
├── frontend/                # NextJS 15 React application
│   ├── package.json
│   ├── tailwind.config.js   # Monochrome zinc theme colors & properties
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── globals.css  # Frosted glass, animations, and custom scrollbars
│   │   │   ├── page.tsx     # Animated premium Hero landing page
│   │   │   ├── auth/        # Credentials entry & step-flip MFA login
│   │   │   └── dashboard/   # Main app canvas (Wikis, Docs, Chat, Graph, Admin)
│   │   ├── components/
│   │   │   ├── Sidebar.tsx  # Workspace navigation and API mode switcher
│   │   │   ├── GlassCard.tsx # Framer Motion card with spotlight tracking
│   │   │   └── NexoraLogo.tsx # 3D geometric isometric glass prism symbol
│   │   └── store/
│   │       └── useNexoraStore.ts # Central Zustand client state manager
└── backend/                 # FastAPI Python application
    ├── requirements.txt
    ├── main.py              # REST routing endpoints (Wiki, Auth, Ingest, Search)
    ├── database.py          # Session engines (SQLite local fallback / PostgreSQL)
    ├── models.py            # SQLite & SQLalchemy table definitions
    ├── schemas.py           # Pydantic validation structures
    ├── auth.py              # JWT tokens, password hashing, and RBAC rules
    └── ai_engine.py         # local SentenceTransformers & Ollama local bridge
```

---

## 🚀 Getting Started

Nexora supports a **Hybrid client-side fallback**. By default, the application runs entirely inside the browser using Zustand-preseeded mock data. You can explore the landing page, write wikis, view the interactive relationship graph, and chat with a mock agent with zero databases or services required.

### 1. Run the Frontend Client
Ensure you have [Node.js](https://nodejs.org/) installed.
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the package dependencies:
   ```bash
   npm install
   ```
3. Launch the development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to **`http://localhost:3000`**.

### 2. Run the Local Python Server (Optional)
To query actual semantic embeddings and test local PDF file uploads on CPU:
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Setup and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the server:
   ```bash
   python main.py
   ```
5. Server starts on **`http://localhost:8000`**. Inside the app sidebar, toggle the server selector to **"LOCAL API"** to route queries directly to the active python instance.

### 3. Hook up Offline Local LLMs (Optional)
To query a fully private generative model:
1. Download and run [Ollama](https://ollama.com).
2. Pull your preferred conversational model:
   ```bash
   ollama pull llama3
   ```
3. Nexora's `ai_engine.py` will automatically detect Ollama running on `http://localhost:11434` and route RAG Chat queries to it for local, offline context-aware answers.

---

## 🐳 Docker Deployment

To spin up a containerized production environment (including pgvector PostgreSQL and Redis caching), run:
```bash
docker-compose up --build
```
This launches:
- **db:** PostgreSQL database with `pgvector` indexing (Port `5432`)
- **redis:** Redis caching service (Port `6379`)
- **backend:** FastAPI API micro-service (Port `8000`)
- **frontend:** Next.js SSR client (Port `3000`)

---

## 📤 GitHub Publishing Guide

To push this project to your GitHub account:

### 1. Initialize Git Repository
In the root directory of the project, run:
```bash
git init
```

### 2. Configure Git Ignores
Create a `.gitignore` file in the root directory if it does not exist, or ensure the following paths are ignored:
```text
# Node dependencies & caches
node_modules/
.next/
out/
build/
*.log

# Python dependencies & environments
venv/
__pycache__/
*.pyc
.env
*.db
```

### 3. Commit the Code
Stage and commit your local workspace files:
```bash
git add .
git commit -m "feat: init Nexora platform with premium design and smooth transitions"
```

### 4. Push to GitHub
1. Create a new repository on [GitHub](https://github.com/new). Leave it empty (do not add a README, license, or gitignore).
2. Link your local repository to GitHub and push:
   ```bash
   # Rename the default branch to main
   git branch -M main

   # Add your GitHub repository URL as remote origin
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

   # Push to the main branch
   git push -u origin main
   ```
3. Refresh your GitHub repository page to see your complete codebase online!
