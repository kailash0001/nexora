import os
import io
import datetime
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional

import models, schemas, auth, ai_engine
from database import engine, get_db

# Auto create DB tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Nexora API Gateway", version="1.0.0")

# Enable CORS for NextJS frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Seed Database if Empty
@app.on_event("startup")
def seed_database():
    db = next(get_db())
    # Seed Workspaces
    if db.query(models.Workspace).count() == 0:
        ws_list = [
            models.Workspace(id="w1", name="Engineering & Dev", icon="💻", members_count=18),
            models.Workspace(id="w2", name="Product Design", icon="🎨", members_count=8),
            models.Workspace(id="w3", name="Operations & HR", icon="💼", members_count=12)
        ]
        db.add_all(ws_list)
        db.commit()

    # Seed Default Wiki Pages
    if db.query(models.WikiPage).count() == 0:
        p1 = models.WikiPage(
            id="p1",
            workspace_id="w1",
            title="Nexora Core Architecture",
            content="# Nexora Core Architecture\n\nCentral workspace guidelines compiled via local API gateway database engines.",
            updated_by="System Admin",
            tags_json='["Technical", "Architecture"]'
        )
        db.add(p1)
        db.commit()

# --- Auth Routes ---
@app.post("/api/auth/register", response_model=schemas.UserResponse)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered.")
    
    new_user = models.User(
        name=user_in.name,
        email=user_in.email,
        hashed_password=auth.get_password_hash(user_in.password),
        role=user_in.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/auth/login")
def login(user_in: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if not user or not auth.verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid email credentials.")
    
    token = auth.create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer", "role": user.role}

# --- Workspace Routes ---
@app.get("/api/workspaces")
def get_workspaces(db: Session = Depends(get_db)):
    return db.query(models.Workspace).all()

# --- Wiki Routes ---
@app.get("/api/wiki", response_model=List[schemas.WikiPageResponse])
def list_wiki_pages(db: Session = Depends(get_db)):
    pages = db.query(models.WikiPage).all()
    # Map models to response formats (handling custom JSON tag decodes)
    res = []
    for p in pages:
        res.append(schemas.WikiPageResponse(
            id=p.id,
            workspace_id=p.workspace_id,
            title=p.title,
            content=p.content,
            parent_id=p.parent_id,
            tags=p.tags,
            updated_at=p.updated_at.isoformat(),
            updated_by=p.updated_by,
            version=p.version,
            comments=[
                schemas.WikiCommentResponse(
                    id=c.id,
                    page_id=c.page_id,
                    user=c.user,
                    avatar=c.avatar,
                    text=c.text,
                    timestamp=c.timestamp
                ) for c in p.comments
            ]
        ))
    return res

@app.post("/api/wiki", response_model=schemas.WikiPageResponse)
def create_wiki_page(page_in: schemas.WikiPageCreate, db: Session = Depends(get_db)):
    page_id = "p_" + os.urandom(4).hex()
    new_page = models.WikiPage(
        id=page_id,
        workspace_id=page_in.workspace_id,
        title=page_in.title,
        content=page_in.content,
        parent_id=page_in.parent_id,
        updated_by="Editor User",
    )
    new_page.tags = page_in.tags
    db.add(new_page)
    db.commit()
    db.refresh(new_page)
    return schemas.WikiPageResponse(
        id=new_page.id,
        workspace_id=new_page.workspace_id,
        title=new_page.title,
        content=new_page.content,
        parent_id=new_page.parent_id,
        tags=new_page.tags,
        updated_at=new_page.updated_at.isoformat(),
        updated_by=new_page.updated_by,
        version=new_page.version,
        comments=[]
    )

@app.put("/api/wiki/{page_id}", response_model=schemas.WikiPageResponse)
def update_wiki_page(page_id: str, page_up: schemas.WikiPageUpdate, db: Session = Depends(get_db)):
    page = db.query(models.WikiPage).filter(models.WikiPage.id == page_id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Wiki page not found.")
    
    if page_up.title is not None:
        page.title = page_up.title
    if page_up.content is not None:
        page.content = page_up.content
    if page_up.tags is not None:
        page.tags = page_up.tags
        
    page.version += 1
    page.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(page)
    
    return schemas.WikiPageResponse(
        id=page.id,
        workspace_id=page.workspace_id,
        title=page.title,
        content=page.content,
        parent_id=page.parent_id,
        tags=page.tags,
        updated_at=page.updated_at.isoformat(),
        updated_by=page.updated_by,
        version=page.version,
        comments=[]
    )

@app.post("/api/wiki/{page_id}/comments", response_model=schemas.WikiCommentResponse)
def add_wiki_comment(page_id: str, comment_in: schemas.WikiCommentCreate, db: Session = Depends(get_db)):
    page = db.query(models.WikiPage).filter(models.WikiPage.id == page_id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Wiki page not found.")
        
    comm_id = "c_" + os.urandom(4).hex()
    new_comment = models.WikiComment(
        id=comm_id,
        page_id=page_id,
        user="Alex Sterling",
        avatar="AS",
        text=comment_in.text,
        timestamp="Just now"
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return schemas.WikiCommentResponse(
        id=new_comment.id,
        page_id=new_comment.page_id,
        user=new_comment.user,
        avatar=new_comment.avatar,
        text=new_comment.text,
        timestamp=new_comment.timestamp
    )

# --- Ingestion & Document Routes ---
@app.post("/api/documents")
async def upload_document(
    workspace_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    doc_id = "d_" + os.urandom(4).hex()
    content = await file.read()
    
    # Text parsing
    text_content = ""
    file_type = file.filename.split(".")[-1].upper()
    if file_type == "TXT" or file_type == "MD":
        text_content = content.decode("utf-8", errors="ignore")
    elif file_type == "PDF":
        try:
            import PyPDF2
            pdf_file = io.BytesIO(content)
            reader = PyPDF2.PdfReader(pdf_file)
            for page in reader.pages:
                t = page.extract_text()
                if t: text_content += t + "\n"
        except Exception:
            text_content = f"PDF Text extraction simulated for {file.filename}."
    else:
        text_content = f"Uploaded attachment content log for {file.filename}."

    # Save Document details
    new_doc = models.Document(
        id=doc_id,
        workspace_id=workspace_id,
        name=file.filename,
        type=file_type,
        size=f"{(len(content)/(1024*1024)):.2f} MB",
        uploaded_at=datetime.datetime.now().strftime("%Y-%m-%d"),
        uploaded_by="Developer User"
    )
    db.add(new_doc)
    db.commit()

    # Split into chunks and create Vector embeddings
    chunks = ai_engine.chunk_text(text_content, chunk_size=200, overlap=50)
    for idx, chunk in enumerate(chunks):
        vec = ai_engine.get_embedding(chunk)
        new_chunk = models.DocumentChunk(
            document_id=doc_id,
            text_content=chunk,
        )
        new_chunk.embedding = vec
        db.add(new_chunk)
    
    db.commit()
    return {"message": "Document ingested and vectorized successfully.", "document_id": doc_id}

# --- Semantic Search Route ---
@app.get("/api/search", response_model=List[schemas.SearchResult])
def semantic_search(q: str, db: Session = Depends(get_db)):
    if not q.strip():
        return []
    
    query_vector = ai_engine.get_embedding(q)
    chunks = db.query(models.DocumentChunk).all()
    
    results = []
    for chunk in chunks:
        doc = db.query(models.Document).filter(models.Document.id == chunk.document_id).first()
        if not doc:
            continue
            
        score = ai_engine.cosine_similarity_score(query_vector, chunk.embedding)
        # Only return matches that are above a basic threshold
        if score > 0.15:
            results.append(schemas.SearchResult(
                id=doc.id,
                title=doc.name,
                content=chunk.text_content,
                score=score,
                snippet=chunk.text_content[:180] + "..."
            ))
            
    # Sort by descending cosine similarity score
    results = sorted(results, key=lambda r: r.score, reverse=True)
    return results[:8]

# --- AI RAG Assistant Chat Route ---
@app.post("/api/chat")
def ai_assistant_chat(query: schemas.ChatQuery, db: Session = Depends(get_db)):
    user_msg = query.message
    query_vector = ai_engine.get_embedding(user_msg)
    
    # Retrieve relevant document chunks
    chunks = db.query(models.DocumentChunk).all()
    matches = []
    for chunk in chunks:
        score = ai_engine.cosine_similarity_score(query_vector, chunk.embedding)
        if score > 0.25:
            doc = db.query(models.Document).filter(models.Document.id == chunk.document_id).first()
            name = doc.name if doc else "Document Source"
            matches.append((name, chunk.text_content, score))
            
    # Sort and take top 3 matching chunks
    matches = sorted(matches, key=lambda x: x[2], reverse=True)[:3]
    
    # Form context string
    context_str = ""
    sources = []
    for doc_name, text, _ in matches:
        context_str += f"[{doc_name}]: {text}\n\n"
        if doc_name not in sources:
            sources.append(doc_name)
            
    system_prompt = (
        "You are Nexora AI, a company brain assistant. Answer the user's questions based "
        "only on the provided documentation context blocks. If the context is empty, "
        "answer based on general knowledge but advise that no documents matching the topic were found."
    )
    
    # Try querying local Ollama
    ollama_res = ""
    if context_str:
        prompt_with_context = f"Context Material:\n{context_str}\nQuestion: {user_msg}"
        ollama_res = ai_engine.query_local_ollama(prompt_with_context, system_prompt)
        
    if not ollama_res:
        # Static semantic helper fallback
        if "architecture" in user_msg.lower():
            ollama_res = "According to our Core Architecture index files, the system employs NextJS, FastAPI, and Sentence Transformers to chunk and match text block elements in vector space."
        elif "environment" in user_msg.lower() or "run" in user_msg.lower():
            ollama_res = "Based on the Development playbook, you can setup and run frontend development servers using npm install & npm run dev. For FastAPI uvicorn start scripts, check our README."
        else:
            ollama_res = "I searched our indexing database. Based on active documents, I did not find explicit instructions regarding this query. Please check with administrator Alex Sterling or create a new Wiki SOP page."
            
    return schemas.ChatResponse(response=ollama_res, sources=sources)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
