import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.models.schemas import RequirementStatement, RequirementStatus
from backend.services.storage import store
from backend.services.qualcomm_service import QualcommService

client = TestClient(app)
qualcomm = QualcommService()


@pytest.fixture(autouse=True)
def clean_test_workspaces():
    """Ensure clean workspace state and live mode before and after each test."""
    from backend.api.routes_requirements import qualcomm as req_qc
    from backend.api.routes_analysis import qualcomm as ana_qc
    req_qc.mock_mode = False
    ana_qc.mock_mode = False

    pids = ["proj-dup-check", "proj-semantic-test", "proj-conflict-radar"]
    for pid in pids:
        store.delete_project(pid)
    yield
    for pid in pids:
        store.delete_project(pid)
    req_qc.mock_mode = True
    ana_qc.mock_mode = True


# ==============================================================================
# 1. REQUIREMENT DUPLICATION CHECK (EXACT & LEXICAL NEAR-DUPLICATE)
# ==============================================================================

def test_01_requirement_duplication_check_lexical_and_exact():
    """
    Test 1: Exact text hashing and lexical near-duplicate token overlap.
    """
    pid = "proj-dup-check"
    client.post(
        "/api/projects",
        json={
            "project_id": pid,
            "project_name": "Duplication Test Bed",
            "domain": "Automotive Systems",
            "description": "Verifying exact and lexical duplicate detection."
        },
        headers={"X-User-Role": "product_manager"}
    )

    # Ingest Requirement A
    r1 = client.post(
        "/api/requirements",
        json={
            "id": "REQ-DUP-101",
            "project_id": pid,
            "text": "The battery management system shall transmit pack telemetry over CAN-FD every 50ms.",
            "category": "Telemetry",
            "status": "FLAGGED_TBD"
        },
        headers={"X-User-Role": "product_manager"}
    )
    assert r1.status_code == 200

    # Ingest Requirement B: Exact Text Duplicate -> verify blocked by default (HTTP 409)
    r2_blocked = client.post(
        "/api/requirements",
        json={
            "id": "REQ-DUP-102",
            "project_id": pid,
            "text": "  The battery management system shall transmit pack telemetry over CAN-FD every 50ms.  ",
            "category": "Telemetry",
            "status": "FLAGGED_TBD"
        },
        headers={"X-User-Role": "product_manager"}
    )
    assert r2_blocked.status_code == 409
    assert "duplicate" in r2_blocked.json()["detail"].lower()

    # Pass allow_duplicate=true to test duplicate detection radar endpoint
    r2 = client.post(
        "/api/requirements?allow_duplicate=true",
        json={
            "id": "REQ-DUP-102",
            "project_id": pid,
            "text": "  The battery management system shall transmit pack telemetry over CAN-FD every 50ms.  ",
            "category": "Telemetry",
            "status": "FLAGGED_TBD"
        },
        headers={"X-User-Role": "product_manager"}
    )
    assert r2.status_code == 200

    # Ingest Requirement C: Near-Duplicate (lexical token overlap >= 70%)
    r3 = client.post(
        "/api/requirements",
        json={
            "id": "REQ-DUP-103",
            "project_id": pid,
            "text": "The battery management system shall transmit pack telemetry data over CAN-FD bus every 50ms.",
            "category": "Telemetry",
            "status": "FLAGGED_TBD"
        },
        headers={"X-User-Role": "product_manager"}
    )
    assert r3.status_code == 200

    # Ingest Requirement D: Completely distinct requirement
    r4 = client.post(
        "/api/requirements",
        json={
            "id": "REQ-DUP-104",
            "project_id": pid,
            "text": "The high voltage pyrofuse shall disconnect the main battery contactors within 10ms of impact.",
            "category": "Safety Pyrofuse",
            "status": "FLAGGED_TBD"
        },
        headers={"X-User-Role": "product_manager"}
    )
    assert r4.status_code == 200

    # Query Lexical Duplicate Detection Endpoint
    resp = client.get(f"/api/requirements/duplicates?project_id={pid}&threshold=0.70")
    assert resp.status_code == 200
    duplicates = resp.json()
    assert len(duplicates) >= 2, f"Expected at least 2 duplicates, got {len(duplicates)}"

    # 1. Exact Match verification
    exact_matches = [d for d in duplicates if d["match_type"] == "EXACT"]
    assert len(exact_matches) >= 1
    exact_pair = {exact_matches[0]["req_id_a"], exact_matches[0]["req_id_b"]}
    assert exact_pair == {"REQ-DUP-101", "REQ-DUP-102"}
    assert exact_matches[0]["similarity"] == 1.0

    # 2. Near-Duplicate verification
    near_matches = [d for d in duplicates if d["match_type"] == "NEAR_DUPLICATE"]
    assert len(near_matches) >= 1
    near_ids = {near_matches[0]["req_id_a"], near_matches[0]["req_id_b"]}
    assert "REQ-DUP-103" in near_ids
    assert near_matches[0]["similarity"] >= 0.70

    # 3. Ensure REQ-DUP-104 (pyrofuse) is never matched with telemetry
    for d in duplicates:
        assert "REQ-DUP-104" not in (d["req_id_a"], d["req_id_b"])


# ==============================================================================
# 2. SEMANTICALLY SAME REQUIREMENTS (NEURAL VECTOR EMBEDDINGS ON QUALCOMM AI100)
# ==============================================================================

def test_02_semantically_same_requirements_live_bge_embeddings():
    """
    Test 2: Neural semantic duplicate detection using BAAI/bge-large-en-v1.5 dense embeddings.
    Tests two requirements stating identical systems engineering intent using completely different vocabulary.
    """
    pid = "proj-semantic-test"
    client.post(
        "/api/projects",
        json={
            "project_id": pid,
            "project_name": "Semantic Duplicate Testing",
            "domain": "Automotive Systems",
            "description": "Verifying neural vector duplicate clustering."
        },
        headers={"X-User-Role": "product_manager"}
    )

    # Ingest Statement 1 (Standard terminology)
    req1 = client.post(
        "/api/requirements",
        json={
            "id": "REQ-SEM-001",
            "project_id": pid,
            "text": "The accumulator management unit shall broadcast traction pack voltage, current, and state of charge over CAN-FD every 50ms.",
            "category": "Telemetry",
            "status": "FLAGGED_TBD"
        },
        headers={"X-User-Role": "product_manager"}
    )
    assert req1.status_code == 200

    # Ingest Statement 2 (Completely disjoint vocabulary, but identical systems engineering meaning)
    req2 = client.post(
        "/api/requirements",
        json={
            "id": "REQ-SEM-002",
            "project_id": pid,
            "text": "The BMS controller shall transmit battery pack metrics including potential, amperage, and SOC across serial automotive bus at 50ms periodic intervals.",
            "category": "Telemetry",
            "status": "FLAGGED_TBD"
        },
        headers={"X-User-Role": "product_manager"}
    )
    assert req2.status_code == 200

    # Ingest Statement 3 (Orthogonal control requirement)
    req3 = client.post(
        "/api/requirements",
        json={
            "id": "REQ-SEM-003",
            "project_id": pid,
            "text": "The climate control subsystem shall regulate cabin airflow to maintain passenger compartment temperature at 22 degrees Celsius.",
            "category": "HVAC",
            "status": "FLAGGED_TBD"
        },
        headers={"X-User-Role": "product_manager"}
    )
    assert req3.status_code == 200

    # Ingest Statement 4 (Standard paraphrase)
    req4 = client.post(
        "/api/requirements",
        json={
            "id": "REQ-SEM-004",
            "project_id": pid,
            "text": "The battery management system shall send pack telemetry over CAN-FD every 50ms.",
            "category": "Telemetry",
            "status": "FLAGGED_TBD"
        },
        headers={"X-User-Role": "product_manager"}
    )
    assert req4.status_code == 200

    # 1. Query Project Semantic Duplicates Endpoint with threshold=0.75
    resp = client.get(f"/api/requirements/duplicates/semantic?project_id={pid}&threshold=0.75")
    assert resp.status_code == 200
    semantic_matches = resp.json()

    assert len(semantic_matches) >= 2, f"Expected at least 2 semantic matches, got {semantic_matches}"
    
    # Check top match between REQ-SEM-001 and REQ-SEM-004 (>= 0.85)
    top_match = semantic_matches[0]
    assert top_match["similarity_score"] >= 0.85
    
    # Check heavy synonym match between REQ-SEM-001 and REQ-SEM-002 (> 0.75)
    synonym_match = next((m for m in semantic_matches if {m["req_id_a"], m["req_id_b"]} == {"REQ-SEM-001", "REQ-SEM-002"}), None)
    assert synonym_match is not None, f"Expected match between REQ-SEM-001 and REQ-SEM-002 in {semantic_matches}"
    assert synonym_match["similarity_score"] >= 0.75
    assert synonym_match["match_type"] == "NEURAL_SEMANTIC"

    # Ensure REQ-SEM-003 (HVAC) is NOT in any semantic duplicate matches
    for m in semantic_matches:
        assert "REQ-SEM-003" not in (m["req_id_a"], m["req_id_b"])

    # 2. Also verify through direct POST /api/analysis/semantic-duplicates endpoint
    direct_resp = client.post(
        "/api/analysis/semantic-duplicates",
        json={
            "requirements": [
                {
                    "id": "REQ-SEM-001",
                    "text": "The accumulator management unit shall broadcast traction pack voltage, current, and state of charge over CAN-FD every 50ms."
                },
                {
                    "id": "REQ-SEM-004",
                    "text": "The battery management system shall send pack telemetry over CAN-FD every 50ms."
                }
            ],
            "similarity_threshold": 0.75
        }
    )
    assert direct_resp.status_code == 200
    direct_matches = direct_resp.json()
    assert len(direct_matches) >= 1



# ==============================================================================
# 3. CONTRADICTORY REQUIREMENTS (CONFLICT RADAR ON QUALCOMM AI100 LLAMA-3.3-70B)
# ==============================================================================

def test_03_contradictory_requirements_live_conflict_radar():
    """
    Test 3: Conflict Radar deep logical reasoning detecting physical/operational contradictions.
    Tests direct contradictions from golden dataset (REQ-004 vs REQ-005) and opposing safety commands.
    """
    pid = "proj-conflict-radar"
    client.post(
        "/api/projects",
        json={
            "project_id": pid,
            "project_name": "Conflict Radar Test Bed",
            "domain": "Safety-Critical Embedded Systems",
            "description": "Verifying Llama-3.3-70B conflict and contradiction detection."
        },
        headers={"X-User-Role": "product_manager"}
    )

    # Ingest Golden Contradiction Pair (Network Behavior clash)
    # REQ-CONF-001: transmit telemetry every 5s during normal operation
    c1 = client.post(
        "/api/requirements",
        json={
            "id": "REQ-CONF-001",
            "project_id": pid,
            "text": "The device shall transmit cloud telemetry every five seconds during normal operation.",
            "category": "Network",
            "status": "FLAGGED_TBD"
        },
        headers={"X-User-Role": "product_manager"}
    )
    assert c1.status_code == 200

    # REQ-CONF-002: make no external transmissions during normal operation (DIRECT CONTRADICTION)
    c2 = client.post(
        "/api/requirements",
        json={
            "id": "REQ-CONF-002",
            "project_id": pid,
            "text": "The device shall make no external network transmissions during normal operation.",
            "category": "Network",
            "status": "FLAGGED_TBD"
        },
        headers={"X-User-Role": "product_manager"}
    )
    assert c2.status_code == 200

    # REQ-CONF-003: Orthogonal compatible requirement
    c3 = client.post(
        "/api/requirements",
        json={
            "id": "REQ-CONF-003",
            "project_id": pid,
            "text": "The battery heater shall activate when ambient temperature drops below 0 degrees Celsius.",
            "category": "Thermal",
            "status": "FLAGGED_TBD"
        },
        headers={"X-User-Role": "product_manager"}
    )
    assert c3.status_code == 200

    # 1. Test POST /api/analysis/conflicts targeting REQ-CONF-001
    radar_resp = client.post(
        "/api/analysis/conflicts",
        json={
            "project_id": pid,
            "target_req_id": "REQ-CONF-001"
        }
    )
    assert radar_resp.status_code == 200
    radar_data = radar_resp.json()

    assert radar_data["total_conflicts_found"] >= 1, f"Expected conflict detected, got {radar_data}"
    conflict = radar_data["conflicts"][0]

    # Verify conflict classification
    assert conflict["conflict_type"] in [
        "Direct Contradiction",
        "Operational Incompatibility"
    ]
    assert conflict["severity"] in ["BLOCKER", "MAJOR"]
    
    # Verify exact quotes extracted
    assert "transmit" in conflict["conflicting_quote_a"].lower() or "telemetry" in conflict["conflicting_quote_a"].lower()
    assert "no external" in conflict["conflicting_quote_b"].lower() or "transmission" in conflict["conflicting_quote_b"].lower()
    
    # Verify systems engineering explanation and reconciliation
    assert len(conflict["explanation"]) > 20
    assert len(conflict["reconciliation_suggestion"]) > 10

    # 2. Test Direct Text Opposing Safety Commands (Regen Braking during ABS)
    abs_resp = client.post(
        "/api/analysis/conflicts",
        json={
            "target_text": "During anti-lock braking (ABS) intervention, the motor inverter shall maintain regenerative braking torque to maximize energy recovery.",
            "candidate_requirements": [
                {
                    "id": "REQ-ABS-SAFE",
                    "text": "During anti-lock braking (ABS) intervention, the motor inverter shall reduce regenerative braking torque to 0 Nm to prevent wheel lockup.",
                    "category": "Braking Safety"
                },
                {
                    "id": "REQ-LIGHTS",
                    "text": "The headlights shall turn on automatically when ambient illuminance falls below 500 lux.",
                    "category": "Lighting"
                }
            ]
        }
    )
    assert abs_resp.status_code == 200
    abs_data = abs_resp.json()
    assert abs_data["total_conflicts_found"] >= 1
    abs_conflict = abs_data["conflicts"][0]
    assert abs_conflict["req_id_b"] == "REQ-ABS-SAFE"
    assert abs_conflict["severity"] == "BLOCKER"

    # 3. Test Negative Control (No conflicts between mutually compatible requirements)
    clean_resp = client.post(
        "/api/analysis/conflicts",
        json={
            "target_text": "The GPS receiver shall update position coordinates at a frequency of 10 Hz.",
            "candidate_requirements": [
                {
                    "id": "REQ-TIRE",
                    "text": "The tire pressure monitoring system shall alert the driver if pressure drops below 2.0 bar.",
                    "category": "TPMS"
                }
            ]
        }
    )
    assert clean_resp.status_code == 200
    clean_data = clean_resp.json()
    assert clean_data["total_conflicts_found"] == 0
