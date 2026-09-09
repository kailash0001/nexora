"""Local SQLite operations, validated and audited within one write transaction."""
import datetime as dt
import hashlib
import json
from decimal import Decimal
from typing import Literal
from uuid import uuid4

from fastapi import HTTPException
from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator
from sqlalchemy import Column, String, Integer, Text, ForeignKey, UniqueConstraint, select, text
from sqlalchemy.orm import Session

import agents
from database import Base


class Employer(Base):
    __tablename__ = "employers"
    id = Column(String, primary_key=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)


class Record(Base):
    __tablename__ = "operation_records"
    id = Column(String, primary_key=True)
    employer_id = Column(String, ForeignKey("employers.id"), nullable=False, index=True)
    kind = Column(String, nullable=False)
    version = Column(Integer, nullable=False, default=1)
    data_json = Column(Text, nullable=False)


class Audit(Base):
    __tablename__ = "operation_audit"
    sequence = Column(Integer, primary_key=True, autoincrement=True)
    employer_id = Column(String, ForeignKey("employers.id"), nullable=False, index=True)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    request_id = Column(String, nullable=False)
    action = Column(String, nullable=False)
    record_id = Column(String, nullable=False)
    before_json = Column(Text, nullable=False)
    after_json = Column(Text, nullable=False)
    occurred_at = Column(String, nullable=False)
    previous_hash = Column(String, nullable=False)
    digest = Column(String, nullable=False)
    __table_args__ = (UniqueConstraint("actor_id", "request_id"),)


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class EmployerInput(Strict):
    name: str = Field(min_length=1, max_length=120)


class ClientInput(Strict):
    name: str = Field(min_length=1, max_length=120)
    reference: str = Field(min_length=1, max_length=100)


class JobInput(Strict):
    client_id: str
    title: str = Field(min_length=1, max_length=160)
    assignee: str = Field(min_length=1, max_length=120)
    status: Literal["scheduled", "active", "completed", "cancelled"] = "scheduled"


class MedicationInput(Strict):
    client_id: str
    name: str = Field(min_length=1, max_length=120)
    dose: Decimal = Field(gt=0, max_digits=10, decimal_places=4)
    unit: Literal["mg", "mcg", "g", "mL", "tablet", "capsule", "unit"]
    route: str = Field(min_length=1, max_length=80)
    instructions: str = Field(min_length=1, max_length=1000)
    prescribed_by: str = Field(min_length=1, max_length=120)
    scheduled_at: dt.datetime
    status: Literal["scheduled", "cancelled"] = "scheduled"

    @field_validator("scheduled_at")
    @classmethod
    def timezone_required(cls, value):
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("Schedule requires an explicit timezone")
        return value.astimezone(dt.timezone.utc)


class AdministrationInput(Strict):
    medication_id: str
    medication_version: int = Field(ge=1)
    outcome: Literal["given", "missed", "refused"]
    dose: Decimal = Field(ge=0, max_digits=10, decimal_places=4)
    unit: Literal["mg", "mcg", "g", "mL", "tablet", "capsule", "unit"]
    note: str = Field(min_length=1, max_length=1000)


class Command(Strict):
    request_id: str = Field(min_length=8, max_length=100)
    employer_id: str | None = None
    action: Literal["employer.create", "client.create", "job.create", "job.update", "medication.create", "medication.update", "administration.create"]
    record_id: str | None = None
    expected_version: int | None = Field(default=None, ge=1)
    payload: dict


SCHEMAS = {"employer": EmployerInput, "client": ClientInput, "job": JobInput,
           "medication": MedicationInput, "administration": AdministrationInput}
OWNERS = {"employer": agents.AgentId.INTAKE, "client": agents.AgentId.INTAKE,
          "job": agents.AgentId.EXECUTION, "medication": agents.AgentId.MEDICATION,
          "administration": agents.AgentId.MEDICATION}


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def snapshot(record):
    return {"id": record.id, "employer_id": record.employer_id, "kind": record.kind,
            "version": record.version, **json.loads(record.data_json)}


def require_employer(db, employer_id, actor_id):
    employer = db.get(Employer, employer_id)
    if employer is None or employer.owner_id != actor_id:
        raise HTTPException(404, "Employer not found")
    return employer


def related(db, record_id, employer_id, kind):
    record = db.get(Record, record_id)
    if record is None or record.employer_id != employer_id or record.kind != kind:
        raise HTTPException(422, f"Invalid {kind} reference")
    return record


def audit_hash(row):
    return hashlib.sha256(canonical({key: getattr(row, key) for key in (
        "employer_id", "actor_id", "request_id", "action", "record_id", "before_json",
        "after_json", "occurred_at", "previous_hash")}).encode()).hexdigest()


def audit_verification(db, employer_id):
    previous = "0" * 64
    latest = {}
    errors = []
    recorded_outcomes = set()
    rows = db.scalars(select(Audit).where(Audit.employer_id == employer_id).order_by(Audit.sequence)).all()
    for row in rows:
        if row.previous_hash != previous or row.digest != audit_hash(row):
            errors.append(f"Audit chain mismatch at sequence {row.sequence}")
        previous = row.digest
        try:
            latest[row.record_id] = json.loads(row.after_json)
        except (ValueError, TypeError):
            errors.append(f"Invalid audit payload at sequence {row.sequence}")
    for record in db.scalars(select(Record).where(Record.employer_id == employer_id)).all():
        try:
            data = SCHEMAS[record.kind].model_validate(json.loads(record.data_json))
            if record.kind in ("job", "medication"):
                related(db, data.client_id, employer_id, "client")
            if record.kind == "administration":
                medication = related(db, data.medication_id, employer_id, "medication")
                order = MedicationInput.model_validate_json(medication.data_json)
                expected_dose = order.dose if data.outcome == "given" else Decimal(0)
                if (data.medication_id in recorded_outcomes or medication.version != data.medication_version
                        or data.unit != order.unit or data.dose != expected_dose or order.status != "scheduled"):
                    errors.append(f"Medication outcome integrity mismatch: {record.id}")
                recorded_outcomes.add(data.medication_id)
            if latest.pop(record.id, None) != snapshot(record):
                errors.append(f"Record/audit mismatch: {record.id}")
        except (ValidationError, ValueError, TypeError, KeyError, HTTPException):
            errors.append(f"Invalid record: {record.id}")
    employer = db.get(Employer, employer_id)
    if employer:
        if latest.pop(employer_id, None) != {"id": employer.id, "name": employer.name, "owner_id": employer.owner_id}:
            errors.append("Employer/audit mismatch")
    if latest:
        errors.append("Audited records are missing")
    return {"agent_id": agents.AgentId.AUDIT, "status": "passed" if not errors else "failed",
            "events_checked": len(rows), "errors": errors}


def execute(command: Command, actor_id: int, engine):
    """SQLite BEGIN IMMEDIATE serializes version checks and audit-chain appends."""
    if engine.dialect.name != "sqlite":
        raise HTTPException(503, "Operational writes currently require local SQLite")
    with Session(engine) as db:
        try:
            db.execute(text("BEGIN IMMEDIATE"))
            existing = db.scalar(select(Audit).where(Audit.actor_id == actor_id, Audit.request_id == command.request_id))
            if existing:
                # Never silently reuse an idempotency key for another payload.
                raise HTTPException(409, "Request ID already applied; refresh records before retrying")
            kind, action = command.action.split(".")
            try:
                data = SCHEMAS[kind].model_validate(command.payload).model_dump(mode="json")
            except ValidationError as error:
                raise HTTPException(422, json.loads(error.json(include_url=False)))
            before = {}
            if kind == "employer":
                if command.employer_id or command.record_id or command.expected_version:
                    raise HTTPException(422, "Employer creation must not reference an existing record")
                employer_id = str(uuid4())
                record_id = employer_id
                if agents.TOOLS["verify_database"](db, employer_id)["status"] != "passed":
                    raise HTTPException(409, "Employer integrity verification failed")
                db.add(Employer(id=employer_id, name=data["name"], owner_id=actor_id))
                after = {"id": employer_id, "name": data["name"], "owner_id": actor_id}
            else:
                employer_id = command.employer_id
                require_employer(db, employer_id, actor_id)
                verification = agents.TOOLS["verify_database"](db, employer_id)
                if verification["status"] != "passed":
                    raise HTTPException(409, "Integrity verification failed; writes blocked")
                if kind in ("job", "medication"):
                    related(db, data["client_id"], employer_id, "client")
                if kind == "administration":
                    medication = related(db, data["medication_id"], employer_id, "medication")
                    order = json.loads(medication.data_json)
                    if medication.version != data["medication_version"] or order["status"] != "scheduled":
                        raise HTTPException(409, "Medication order changed or was cancelled")
                    if data["unit"] != order["unit"]:
                        raise HTTPException(422, "Unit must match the prescribed order")
                    if data["outcome"] == "given" and Decimal(data["dose"]) != Decimal(order["dose"]):
                        raise HTTPException(422, "Dose must exactly match the prescribed order")
                    if data["outcome"] != "given" and Decimal(data["dose"]) != 0:
                        raise HTTPException(422, "Missed/refused doses must record zero administered")
                    for entry in db.scalars(select(Record).where(Record.employer_id == employer_id, Record.kind == "administration")):
                        if json.loads(entry.data_json)["medication_id"] == medication.id:
                            raise HTTPException(409, "This scheduled dose already has an outcome")
                if action == "update":
                    if not command.record_id or command.expected_version is None:
                        raise HTTPException(422, "Update requires record_id and expected_version")
                    record = related(db, command.record_id, employer_id, kind)
                    before = snapshot(record)
                    if record.version != command.expected_version:
                        raise HTTPException(409, "Record changed; refresh before updating")
                    if data["client_id"] != before["client_id"]:
                        raise HTTPException(422, "Client identity cannot be reassigned")
                    if kind == "medication":
                        for entry in db.scalars(select(Record).where(Record.employer_id == employer_id, Record.kind == "administration")):
                            if json.loads(entry.data_json)["medication_id"] == record.id:
                                raise HTTPException(409, "A medication with a recorded outcome is immutable")
                    if kind == "job":
                        allowed = {"scheduled": {"scheduled", "active", "cancelled"}, "active": {"active", "completed", "cancelled"}, "completed": {"completed"}, "cancelled": {"cancelled"}}
                        if data["status"] not in allowed[before["status"]]:
                            raise HTTPException(422, "Invalid job status transition")
                    record.version += 1
                    record.data_json = canonical(data)
                else:
                    if command.record_id or command.expected_version:
                        raise HTTPException(422, "Create must not specify a record or version")
                    if kind == "job" and data["status"] != "scheduled":
                        raise HTTPException(422, "New jobs must be scheduled")
                    record = Record(id=str(uuid4()), employer_id=employer_id, kind=kind, version=1, data_json=canonical(data))
                    db.add(record)
                record_id = record.id
                after = snapshot(record)
            db.flush()
            previous = db.scalar(select(Audit).where(Audit.employer_id == employer_id).order_by(Audit.sequence.desc()))
            row = Audit(employer_id=employer_id, actor_id=actor_id, request_id=command.request_id,
                        action=command.action, record_id=record_id, before_json=canonical(before),
                        after_json=canonical(after), occurred_at=dt.datetime.now(dt.timezone.utc).isoformat(),
                        previous_hash=previous.digest if previous else "0" * 64)
            row.digest = audit_hash(row)
            db.add(row)
            db.flush()
            verification = agents.TOOLS["verify_database"](db, employer_id)
            if verification["status"] != "passed":
                raise HTTPException(409, "Post-write integrity check failed; transaction rolled back")
            db.commit()
            return {"request_id": command.request_id, "agent_id": OWNERS[kind], "status": "completed",
                    "trace": [agents.AgentId.INTAKE, agents.AgentId.AUDIT, OWNERS[kind]],
                    "writes_performed": True, "record": after}
        except Exception:
            db.rollback()
            raise


def report(records):
    jobs = [r for r in records if r["kind"] == "job"]
    meds = [r for r in records if r["kind"] == "medication" and r["status"] == "scheduled"]
    outcomes = {r["medication_id"]: r for r in records if r["kind"] == "administration"}
    now = dt.datetime.now(dt.timezone.utc)
    due = [r for r in meds if dt.datetime.fromisoformat(r["scheduled_at"].replace("Z", "+00:00")) <= now]
    given = sum(outcomes.get(r["id"], {}).get("outcome") == "given" for r in due)
    return {"agent_id": agents.AgentId.REPORTING, "active_jobs": sum(r["status"] == "active" for r in jobs),
            "total_jobs": len(jobs), "completed_jobs": sum(r["status"] == "completed" for r in jobs),
            "due_doses": len(due), "given_due_doses": given,
            "adherence_percent": round(100 * given / len(due), 1) if due else None,
            "attention_doses": len(due) - given,
            "definition": "Recorded given outcomes / scheduled doses due by now; cancelled doses excluded."}
