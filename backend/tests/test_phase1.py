import os
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

import test_support

from fastapi.testclient import TestClient
from pydantic import ValidationError
import agents
import ai_engine
import auth
from main import app
from database import engine


class AgentTests(unittest.TestCase):
    def test_password_round_trip(self):
        hashed = auth.get_password_hash("sample-password")
        self.assertTrue(auth.verify_password("sample-password", hashed))
        self.assertFalse(auth.verify_password("wrong-password", hashed))

    def test_exact_topology_and_tools(self):
        agents.verify_topology()
        self.assertEqual(len(agents.REGISTRY), 5)
        for definition in agents.REGISTRY.values():
            self.assertTrue(definition.fallback)
            for name in definition.tools:
                self.assertTrue(callable(agents.TOOLS[name]))

    def test_all_routes_are_read_only(self):
        for kind, target in agents.ROUTES.items():
            result = agents.dispatch(agents.AgentRequest(employer_id="e1", kind=kind, message="Review request"))
            self.assertEqual(result.agent_id, target)
            self.assertFalse(result.writes_performed)
            self.assertIn(agents.AgentId.AUDIT, result.trace)
        self.assertEqual(agents.dispatch(agents.AgentRequest(employer_id="e1", kind="medication", message="Update")).status, "blocked")

    def test_invalid_envelopes(self):
        for changes in ({"employer_id": " "}, {"kind": "unknown"}, {"message": ""}, {"dosage": 5}):
            with self.assertRaises(ValidationError):
                agents.AgentRequest.model_validate(dict(employer_id="e1", kind="service", message="test") | changes)

    def test_verification_failure_stops_dispatch(self):
        with patch("agents.verify_request", side_effect=ValueError("Audit failed")):
            with self.assertRaises(ValueError):
                agents.dispatch(agents.AgentRequest(employer_id="e1", kind="service", message="test"))

    def test_api_contracts_and_health(self):
        with TestClient(app) as client:
            self.assertEqual(client.get("/api/health").json()["agent_count"], 5)
            self.assertEqual(len(client.get("/api/agents").json()), 5)
            for kind in agents.RequestKind:
                response = client.post("/api/agents/dispatch", json={"employer_id": "e1", "kind": kind.value, "message": "Review"})
                self.assertEqual(response.status_code, 200)
                self.assertFalse(response.json()["writes_performed"])
            self.assertEqual(client.post("/api/agents/dispatch", json={"kind": "other"}).status_code, 422)
            self.assertEqual(client.post("/api/chat", json={"message": "hello"}).status_code, 410)
            schema = client.get("/openapi.json")
            self.assertEqual(schema.status_code, 200)

    def test_embeddings_are_stable_across_processes(self):
        # Explicit separate interpreter catches Python hash randomization regressions.
        script = "import ai_engine,json; print(json.dumps(ai_engine.get_embedding('service employer')))"
        output = subprocess.check_output([sys.executable, "-c", script], text=True)
        import json
        self.assertEqual(json.loads(output), ai_engine.get_embedding("service employer"))
        self.assertGreater(ai_engine.cosine_similarity_score(ai_engine.get_embedding("service employer"), ai_engine.get_embedding("service")), 0)

    def test_chunking_bounds(self):
        for size, overlap in ((0, 0), (10, 10), (10, -1)):
            with self.assertRaises(ValueError):
                ai_engine.chunk_text("sample", size, overlap)
        self.assertEqual(ai_engine.chunk_text("a b c d", 3, 1), ["a b c", "c d"])


if __name__ == "__main__":
    unittest.main()
