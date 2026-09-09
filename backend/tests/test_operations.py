import copy
import test_support
import tempfile
from pathlib import Path
import json
import unittest
from concurrent.futures import ThreadPoolExecutor
from unittest.mock import patch
from uuid import uuid4

from fastapi.testclient import TestClient
from fastapi import HTTPException
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

import agents
import auth
import models
import operations as op
from database import Base
from main import app


class OperationsTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
        Base.metadata.create_all(self.engine)
        with Session(self.engine) as db:
            db.add(models.User(id=1, name="Owner", email="owner@example.com", hashed_password="unused"))
            db.commit()
        self.employer = self.command("employer.create", {"name": "Example Services"})["record"]["id"]
        self.client = self.command("client.create", {"name": "Sample Client", "reference": "DEMO-1"})["record"]["id"]
        self.order = {"client_id": self.client, "name": "Recorded prescription", "dose": "5.0000", "unit": "mg",
                      "route": "oral", "instructions": "Follow recorded prescription", "prescribed_by": "Recorded prescriber",
                      "scheduled_at": "2025-01-01T09:00:00Z", "status": "scheduled"}

    def tearDown(self):
        self.engine.dispose()

    def command(self, action, payload, **kwargs):
        return op.execute(op.Command(request_id=str(uuid4()), employer_id=getattr(self, "employer", None),
                                    action=action, payload=payload, **kwargs), 1, self.engine)

    def stored(self):
        with Session(self.engine) as db:
            return [op.snapshot(r) for r in db.scalars(select(op.Record))], [r.digest for r in db.scalars(select(op.Audit))]

    def test_medication_update_preserves_fields_and_history(self):
        record = self.command("medication.create", self.order)["record"]
        updated = {**self.order, "instructions": "Updated recorded instructions"}
        result = self.command("medication.update", updated, record_id=record["id"], expected_version=1)["record"]
        self.assertEqual(result["dose"], "5.0000")
        self.assertEqual(result["client_id"], self.client)
        self.assertEqual(result["version"], 2)
        with Session(self.engine) as db:
            event = db.scalars(select(op.Audit).order_by(op.Audit.sequence.desc())).first()
            self.assertEqual(json.loads(event.before_json), record)
            self.assertEqual(json.loads(event.after_json), result)
            self.assertEqual(op.audit_verification(db, self.employer)["status"], "passed")

    def test_invalid_dose_and_stale_version_do_not_write(self):
        record = self.command("medication.create", self.order)["record"]
        baseline = self.stored()
        for change in ({"dose": "0"}, {"dose": "NaN"}, {"unit": "unknown"}, {"scheduled_at": "2026-01-01T09:00:00"}, {"client_id": "missing"}):
            with self.assertRaises(Exception):
                self.command("medication.update", self.order | change, record_id=record["id"], expected_version=1)
            self.assertEqual(self.stored(), baseline)
        with self.assertRaises(Exception):
            self.command("medication.update", self.order, record_id=record["id"], expected_version=2)
        self.assertEqual(self.stored(), baseline)

    def test_rollback_when_post_write_audit_fails(self):
        baseline = self.stored()
        with patch("operations.audit_verification", side_effect=[{"status": "passed"}, {"status": "failed"}]):
            with self.assertRaises(Exception):
                self.command("medication.create", self.order)
        self.assertEqual(self.stored(), baseline)

    def test_tamper_detection_blocks_new_writes(self):
        with Session(self.engine) as db:
            record = db.get(op.Record, self.client)
            record.data_json = json.dumps({"name": "Altered", "reference": "DEMO-1"})
            db.commit()
        with self.assertRaises(Exception):
            self.command("medication.create", self.order)

    def test_malformed_audit_payload_is_flagged(self):
        with Session(self.engine) as db:
            event = db.scalars(select(op.Audit)).first()
            event.after_json = "not-json"
            db.commit()
            verification = op.audit_verification(db, self.employer)
            self.assertEqual(verification["status"], "failed")
            self.assertTrue(any("Invalid audit payload" in error for error in verification["errors"]))

    def test_dose_integrity_and_duplicate_outcome(self):
        med = self.command("medication.create", self.order)["record"]
        payload = {"medication_id": med["id"], "medication_version": 1, "outcome": "given", "dose": "10", "unit": "mg", "note": "Recorded by operator"}
        baseline = self.stored()
        with self.assertRaises(Exception):
            self.command("administration.create", payload)
        self.assertEqual(self.stored(), baseline)
        self.command("administration.create", payload | {"dose": "5"})
        with self.assertRaises(Exception):
            self.command("administration.create", payload | {"dose": "5"})
        with self.assertRaises(Exception):
            self.command("medication.update", self.order, record_id=med["id"], expected_version=1)

    def test_employer_isolation_and_idempotency(self):
        command = op.Command(request_id=str(uuid4()), employer_id=self.employer, action="client.create", payload={"name": "Other", "reference": "2"})
        with self.assertRaises(Exception):
            op.execute(command, 999, self.engine)
        op.execute(command, 1, self.engine)
        baseline = self.stored()
        with self.assertRaises(Exception):
            op.execute(command, 1, self.engine)
        self.assertEqual(self.stored(), baseline)

    def test_full_api_workflow(self):
        from database import get_db
        def db_override():
            with Session(self.engine) as db:
                yield db
        app.dependency_overrides[get_db] = db_override
        app.dependency_overrides[auth.get_current_user] = lambda: models.User(id=1)
        try:
            with patch("main.engine", self.engine), TestClient(app) as client:
                def post(action, payload, **kwargs):
                    response = client.post("/api/operations", json={"request_id": str(uuid4()), "employer_id": self.employer,
                        "action": action, "payload": payload, **kwargs})
                    self.assertEqual(response.status_code, 201, response.text)
                    return response.json()["record"]
                job_data = {"client_id": self.client, "title": "Daily visit", "assignee": "Operator", "status": "scheduled"}
                job = post("job.create", job_data)
                post("job.update", job_data | {"status": "active"}, record_id=job["id"], expected_version=1)
                med = post("medication.create", self.order)
                post("administration.create", {"medication_id": med["id"], "medication_version": 1,
                    "outcome": "given", "dose": "5", "unit": "mg", "note": "Confirmed"})
                result = client.get(f"/api/employers/{self.employer}/dashboard")
                self.assertEqual(result.status_code, 200)
                self.assertEqual(result.json()["audit"]["status"], "passed")
                self.assertEqual(result.json()["metrics"]["adherence_percent"], 100)
                self.assertEqual(result.json()["metrics"]["active_jobs"], 1)
                self.assertEqual(client.get("/api/employers/not-owned/dashboard").status_code, 404)
        finally:
            app.dependency_overrides.clear()

    def test_concurrent_stale_updates_have_one_winner(self):
        with tempfile.TemporaryDirectory(prefix="nexora-concurrency-") as directory:
            file_engine = create_engine("sqlite:///" + str(Path(directory) / "race.db"), connect_args={"check_same_thread": False})
            Base.metadata.create_all(file_engine)
            with Session(file_engine) as db:
                db.add(models.User(id=1, name="QA", email="qa@example.com", hashed_password="unused"))
                db.commit()
            def run(action, payload, employer_id=None, **kw):
                return op.execute(op.Command(action=action, payload=payload, employer_id=employer_id, request_id=str(uuid4()), **kw), 1, file_engine)["record"]
            employer = run("employer.create", {"name": "Concurrent QA"})["id"]
            client = run("client.create", {"name": "QA", "reference": "QA"}, employer)["id"]
            job_data = {"client_id": client, "title": "Visit", "assignee": "QA", "status": "scheduled"}
            job = run("job.create", job_data, employer)
            def update(title):
                try:
                    run("job.update", job_data | {"title": title}, employer, record_id=job["id"], expected_version=1)
                    return 201
                except HTTPException as error:
                    return error.status_code
            with ThreadPoolExecutor(max_workers=2) as pool:
                results = list(pool.map(update, ["First", "Second"]))
            self.assertEqual(sorted(results), [201, 409])
            with Session(file_engine) as db:
                self.assertEqual(db.get(op.Record, job["id"]).version, 2)
                self.assertEqual(op.audit_verification(db, employer)["status"], "passed")
            file_engine.dispose()

    def test_authentication_required(self):
        with TestClient(app) as client:
            self.assertEqual(client.get("/api/employers").status_code, 401)
            self.assertEqual(client.post("/api/operations", json={}).status_code, 401)


if __name__ == "__main__":
    unittest.main()
