"""Isolated application database for imports and API smoke tests."""
import atexit
import os
import tempfile
from pathlib import Path

_directory = tempfile.TemporaryDirectory(prefix="nexora-tests-")
os.environ["DATABASE_URL"] = "sqlite:///" + str(Path(_directory.name) / "test.db").replace("\\", "/")


def cleanup():
    from database import engine
    engine.dispose()
    _directory.cleanup()


atexit.register(cleanup)
