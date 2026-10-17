import os
import pytest
from pathlib import Path

# Direct all test database persistence away from the production demo database
TEST_DB_PATH = Path(__file__).parent.parent / "data" / "test_ephemeral.db"
os.environ["QUALITY_COPILOT_DB_PATH"] = str(TEST_DB_PATH)


@pytest.fixture(scope="session", autouse=True)
def cleanup_test_database():
    if TEST_DB_PATH.exists():
        try:
            TEST_DB_PATH.unlink()
        except Exception:
            pass
    yield
    if TEST_DB_PATH.exists():
        try:
            TEST_DB_PATH.unlink()
        except Exception:
            pass
