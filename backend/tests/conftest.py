import os
import pytest
from pathlib import Path

# Direct all test database persistence away from the production demo database
TEST_DB_PATH = Path(__file__).parent.parent / "data" / "test_ephemeral.db"
os.environ["QUALITY_COPILOT_DB_PATH"] = str(TEST_DB_PATH)


@pytest.fixture(scope="session", autouse=True)
def setup_and_teardown_test_database():
    if TEST_DB_PATH.exists():
        try:
            TEST_DB_PATH.unlink()
        except Exception:
            pass

    from backend.services.storage import store
    from backend.main import preload_demo_datasets

    store.db_path = TEST_DB_PATH
    store._init_db()
    preload_demo_datasets()

    yield

    if TEST_DB_PATH.exists():
        try:
            TEST_DB_PATH.unlink()
        except Exception:
            pass
