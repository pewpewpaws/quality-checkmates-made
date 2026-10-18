import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.models.schemas import RequirementStatement, RequirementStatus, UserRole
from backend.services.storage import store

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_context_test_projects():
    """Isolate test workspaces."""
    pids = ["proj-dup-test", "proj-ctx-bms", "proj-ctx-med"]
    for p in pids:
        store.delete_project(p)
    yield
    for p in pids:
        store.delete_project(p)


def test_context_grounding_and_persistence_across_workspaces():
    # 1. Create BMS Project Workspace
    resp_bms = client.post(
        "/api/projects",
        json={
            "project_id": "proj-ctx-bms",
            "project_name": "Next-Gen 800V EV BMS",
            "domain": "Automotive Systems (ISO 26262)",
            "description": "Silicon carbide traction inverter and fast charging thermal loop."
        },
        headers={"X-User-Role": "product_manager"}
    )
    assert resp_bms.status_code == 200

    # Attach architectural charter document
    doc_resp = client.post(
        "/api/projects/proj-ctx-bms/documents",
        data={
            "title": "BMS Safety Charter",
            "category": "Thermal Envelope",
            "text": "Cell operating range: 2.8V to 4.25V. Contactor must open within 10ms of pyrofuse fire."
        },
        headers={"X-User-Role": "product_manager"}
    )
    assert doc_resp.status_code == 200
    docs = doc_resp.json()["documents"]
    assert len(docs) == 1
    assert "10ms" in docs[0]["content"]

    # 2. Create Medical Device Project Workspace
    resp_med = client.post(
        "/api/projects",
        json={
            "project_id": "proj-ctx-med",
            "project_name": "Infusion Controller",
            "domain": "Medical Device (IEC 62304)",
            "description": "Precision dual-chamber peristaltic infusion pump."
        },
        headers={"X-User-Role": "product_manager"}
    )
    assert resp_med.status_code == 200

    # Attach medical charter document
    doc_med_resp = client.post(
        "/api/projects/proj-ctx-med/documents",
        data={
            "title": "Occlusion & Pressure Safety Charter",
            "category": "Fluidic Safety",
            "text": "Max allowable line pressure is 15 psi. Bolus delivery must cease within 50ms of occlusion detection."
        },
        headers={"X-User-Role": "product_manager"}
    )
    assert doc_med_resp.status_code == 200

    # 3. Verify Document Isolation
    bms_docs = client.get("/api/projects/proj-ctx-bms/documents").json()
    med_docs = client.get("/api/projects/proj-ctx-med/documents").json()
    assert len(bms_docs) == 1
    assert len(med_docs) == 1
    assert "pyrofuse" in bms_docs[0]["content"]
    assert "pyrofuse" not in med_docs[0]["content"]
    assert "15 psi" in med_docs[0]["content"]
    assert "15 psi" not in bms_docs[0]["content"]

    # 4. Boundary Locking Enforcement
    lock_resp = client.post(
        "/api/projects/proj-ctx-bms/lock",
        json={"is_locked": True, "locked_by": "Chief Safety Engineer"},
        headers={"X-User-Role": "systems_engineer"}
    )
    assert lock_resp.status_code == 200
    assert lock_resp.json()["is_locked"] is True

    # Attempt to tamper with charter while locked -> HTTP 423 Locked
    tamper_resp = client.post(
        "/api/projects/proj-ctx-bms/documents",
        data={"title": "Hacked Document", "text": "Unauthorized addition"},
        headers={"X-User-Role": "product_manager"}
    )
    assert tamper_resp.status_code == 423
    assert "locked" in tamper_resp.json()["detail"].lower()


def test_duplicate_requirement_detection_and_collision_handling():
    pid = "proj-dup-test"
    client.post(
        "/api/projects",
        json={
            "project_id": pid,
            "project_name": "Deduplication & Collision Workspace",
            "domain": "Automotive",
            "description": "Testing exact duplicates, near duplicates, and ID collisions."
        },
        headers={"X-User-Role": "product_manager"}
    )

    # 1. Ingest Base Requirement (REQ-DUP-001)
    req1 = client.post(
        "/api/requirements",
        json={
            "id": "REQ-DUP-001",
            "project_id": pid,
            "text": "The battery management system shall transmit telemetry data over CAN-FD every 50ms.",
            "category": "Telemetry",
            "status": "FLAGGED_TBD"
        },
        headers={"X-User-Role": "product_manager"}
    )
    assert req1.status_code == 200
    assert req1.json()["version"] == 1

    # 2. Ingest EXACT Duplicate Text: Verify creation is strictly blocked with HTTP 409 Conflict
    dup_blocked = client.post(
        "/api/requirements",
        json={
            "id": "REQ-DUP-002",
            "project_id": pid,
            "text": "The battery management system shall transmit telemetry data over CAN-FD every 50ms.",
            "category": "Telemetry",
            "status": "FLAGGED_TBD"
        },
        headers={"X-User-Role": "product_manager"}
    )
    assert dup_blocked.status_code == 409
    assert "duplicate" in dup_blocked.json()["detail"].lower()

    # Allow duplicate explicitly to populate radar for detection testing
    req2 = client.post(
        "/api/requirements?allow_duplicate=true",
        json={
            "id": "REQ-DUP-002",
            "project_id": pid,
            "text": "The battery management system shall transmit telemetry data over CAN-FD every 50ms.",
            "category": "Telemetry",
            "status": "FLAGGED_TBD"
        },
        headers={"X-User-Role": "product_manager"}
    )
    assert req2.status_code == 200

    # 3. Ingest NEAR Duplicate Paraphrased Text (REQ-DUP-003)
    # Different wording: "should send" vs "shall transmit", "bus" vs "CAN-FD"
    req3 = client.post(
        "/api/requirements",
        json={
            "id": "REQ-DUP-003",
            "project_id": pid,
            "text": "The battery management system shall transmit telemetry data over CAN-FD every 100ms.",
            "category": "Telemetry",
            "status": "FLAGGED_TBD"
        },
        headers={"X-User-Role": "product_manager"}
    )
    assert req3.status_code == 200

    # 4. Ingest completely distinct Requirement (REQ-DUP-004)
    req4 = client.post(
        "/api/requirements",
        json={
            "id": "REQ-DUP-004",
            "project_id": pid,
            "text": "The coolant pump shall activate at maximum flow when pack temperature reaches 55C.",
            "category": "Thermal",
            "status": "FLAGGED_TBD"
        },
        headers={"X-User-Role": "product_manager"}
    )
    assert req4.status_code == 200

    # 5. Query Duplicate Detection Endpoint
    dup_resp = client.get(f"/api/requirements/duplicates?project_id={pid}")
    assert dup_resp.status_code == 200
    duplicates = dup_resp.json()
    assert len(duplicates) >= 2

    # Check EXACT match detected between REQ-DUP-001 and REQ-DUP-002
    exact_matches = [d for d in duplicates if d["match_type"] == "EXACT"]
    assert len(exact_matches) >= 1
    exact_pair = {exact_matches[0]["req_id_a"], exact_matches[0]["req_id_b"]}
    assert "REQ-DUP-001" in exact_pair
    assert "REQ-DUP-002" in exact_pair
    assert exact_matches[0]["similarity"] == 1.0

    # Check NEAR_DUPLICATE match detected between REQ-DUP-001 and REQ-DUP-003
    near_matches = [d for d in duplicates if d["match_type"] == "NEAR_DUPLICATE"]
    assert len(near_matches) >= 1
    near_pair = {near_matches[0]["req_id_a"], near_matches[0]["req_id_b"]}
    assert "REQ-DUP-003" in near_pair
    assert near_matches[0]["similarity"] >= 0.70

    # Ensure Distinct requirement (REQ-DUP-004) is NOT matched with telemetry
    for d in duplicates:
        assert not (d["req_id_a"] == "REQ-DUP-004" and d["req_id_b"] == "REQ-DUP-001")

    # 6. ID Collision Handling Test:
    # Upserting REQ-DUP-001 with updated text should increment version counter
    update_resp = client.put(
        f"/api/requirements/REQ-DUP-001?project_id={pid}",
        json={
            "id": "REQ-DUP-001",
            "project_id": pid,
            "text": "The battery management system shall transmit telemetry data over CAN-FD every 25ms.",
            "category": "Telemetry",
            "status": "PROVISIONAL_PM"
        },
        headers={"X-User-Role": "product_manager"}
    )
    assert update_resp.status_code == 200
    updated_data = update_resp.json()
    assert updated_data["version"] == 2
    assert updated_data["status"] == "PROVISIONAL_PM"

    # 7. Cross-Project Isolation (Identical IDs in different workspaces do not collide)
    cross_pid = "proj-dup-cross"
    client.post(
        "/api/projects",
        json={
            "project_id": cross_pid,
            "project_name": "Cross Project",
            "domain": "Test",
            "description": "Testing distinct workspace namespaces."
        },
        headers={"X-User-Role": "product_manager"}
    )
    cross_req = client.post(
        "/api/requirements",
        json={
            "id": "REQ-DUP-001",  # SAME ID, DIFFERENT PROJECT
            "project_id": cross_pid,
            "text": "Completely unrelated statement for cross project.",
            "status": "DRAFT"
        },
        headers={"X-User-Role": "product_manager"}
    )
    assert cross_req.status_code == 200

    # Verify both exist independently in their respective namespaces
    item_main = client.get(f"/api/requirements/REQ-DUP-001?project_id={pid}").json()
    item_cross = client.get(f"/api/requirements/REQ-DUP-001?project_id={cross_pid}").json()
    assert "CAN-FD" in item_main["text"]
    assert "Completely unrelated" in item_cross["text"]

    store.delete_project(cross_pid)
