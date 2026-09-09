import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

import models, schemas, auth, agents, operations
from database import engine, get_db

# Additive table creation only: legacy wiki/document tables and records remain.
models.Base.metadata.create_all(bind=engine)
app = FastAPI(title="Nexora Employer Operations API", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True, allow_methods=["GET", "POST"], allow_headers=["Authorization", "Content-Type"],
)


@app.post("/api/auth/register", response_model=schemas.UserResponse, status_code=201)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    user = models.User(name=user_in.name.strip(), email=user_in.email,
                       hashed_password=auth.get_password_hash(user_in.password), role="Collaborator")
    if not user.name:
        raise HTTPException(422, "Name cannot be blank")
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Email already registered")
    db.refresh(user)
    return user


@app.post("/api/auth/login")
def login(user_in: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if not user or not auth.verify_password(user_in.password, user.hashed_password):
        raise HTTPException(400, "Invalid email or password")
    return {"access_token": auth.create_access_token({"sub": user.email}), "token_type": "bearer"}


@app.get("/api/me", response_model=schemas.UserResponse)
def current_user(user=Depends(auth.get_current_user)):
    return user


@app.get("/api/agents", response_model=list[agents.AgentDefinition])
def list_agents():
    return list(agents.REGISTRY.values())


@app.post("/api/agents/dispatch", response_model=agents.AgentResult)
def dispatch_request(request: agents.AgentRequest):
    # Read-only free-text planning; all writes require /api/operations and auth.
    return agents.dispatch(request)


@app.post("/api/chat", deprecated=True)
def retired_chat(query: schemas.ChatQuery):
    raise HTTPException(410, "Use /api/agents/dispatch for planning or authenticated /api/operations for writes")


@app.get("/api/health")
def health(db: Session = Depends(get_db)):
    agents.verify_topology()
    db.execute(text("SELECT 1"))
    return {"status": "ok", "agent_count": len(agents.REGISTRY), "execution_mode": "local_rules",
            "operational_writes": engine.dialect.name == "sqlite"}


@app.get("/api/employers")
def employers(user=Depends(auth.get_current_user), db: Session = Depends(get_db)):
    return db.query(operations.Employer).filter_by(owner_id=user.id).all()


@app.post("/api/operations", status_code=201)
def operate(command: operations.Command, user=Depends(auth.get_current_user)):
    return agents.TOOLS["execute_operation"](command, user.id, engine)


@app.get("/api/employers/{employer_id}/dashboard")
def employer_dashboard(employer_id: str, user=Depends(auth.get_current_user), db: Session = Depends(get_db)):
    # sqlite3 legacy transaction mode does not BEGIN for SELECT. Hold one
    # read snapshot across records, integrity verification and reporting.
    if db.bind.dialect.name == "sqlite":
        connection = db.connection()
        if not connection.connection.driver_connection.in_transaction:
            connection.exec_driver_sql("BEGIN")
    operations.require_employer(db, employer_id, user.id)
    audit = agents.TOOLS["verify_database"](db, employer_id)
    if audit["status"] != "passed":
        raise HTTPException(409, "Integrity verification failed; reporting withheld: " + "; ".join(audit["errors"]))
    records = [operations.snapshot(r) for r in db.query(operations.Record).filter_by(employer_id=employer_id).all()]
    events = db.query(operations.Audit).filter_by(employer_id=employer_id).order_by(operations.Audit.sequence.desc()).limit(50).all()
    return {"records": records, "metrics": agents.TOOLS["report_metrics"](records), "audit": audit,
            "events": [{"sequence": e.sequence, "action": e.action, "record_id": e.record_id,
                        "occurred_at": e.occurred_at, "actor_id": e.actor_id, "digest": e.digest} for e in events]}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
