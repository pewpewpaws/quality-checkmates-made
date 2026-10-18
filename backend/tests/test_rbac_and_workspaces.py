import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.models.schemas import RequirementStatus, UserRole
from backend.services.storage import store

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_store_state(monkeypatch):
    """Ensure clean test isolation across persistent SQLite runs and fast RBAC verification."""
    from backend.api import routes_requirements
    async def mock_extract(text):
        return []
    monkeypatch.setattr(routes_requirements.qualcomm, "extract_xray_issues", mock_extract)

    test_pids = [
        "proj-surgical-arm",
        "proj-aero-drone",
        "proj-context-test",
        "proj-rbac-test",
        "proj-dualkey-rbac",
    ]
    for pid in test_pids:
        store.delete_project(pid)
    yield
    for pid in test_pids:
        store.delete_project(pid)


def test_multi_project_creation_and_listing():
    # 1. Create Project A (Robotic Surgical Arm)
    resp_a = client.post(
        "/api/projects",
        json={
            "project_id": "proj-surgical-arm",
            "project_name": "Robotic Surgical Arm Controller",
            "domain": "Medical Robotics (IEC 62304)",
            "description": "Sub-millimeter haptic feedback and real-time safety interlock loop."
        },
        headers={"X-User-Role": "product_manager"}
    )
    assert resp_a.status_code == 200
    data_a = resp_a.json()
    assert data_a["project_id"] == "proj-surgical-arm"
    assert data_a["is_locked"] is False

    # 2. Create Project B (Aerospace Drone Telemetry)
    resp_b = client.post(
        "/api/projects",
        json={
            "project_id": "proj-aero-drone",
            "project_name": "Autonomous Drone Telemetry Mesh",
            "domain": "Aerospace Avionics (DO-178C)",
            "description": "Multi-band encrypted satellite and mesh telemetry gateway."
        },
        headers={"X-User-Role": "product_manager"}
    )
    assert resp_b.status_code == 200

    # 3. List projects - should include default, surgical-arm, and aero-drone
    resp_list = client.get("/api/projects")
    assert resp_list.status_code == 200
    projects = resp_list.json()
    project_ids = [p["project_id"] for p in projects]
    assert "proj-surgical-arm" in project_ids
    assert "proj-aero-drone" in project_ids


def test_cross_project_requirement_isolation():
    # Ingest requirement into Surgical Arm project
    req_surg = client.post(
        "/api/requirements",
        json={
            "id": "REQ-SURG-001",
            "project_id": "proj-surgical-arm",
            "text": "The surgical arm actuator shall stop motion within 5ms of safety curtain breach.",
            "category": "Safety Interlock",
            "status": "FLAGGED_TBD"
        },
        headers={"X-User-Role": "product_manager"}
    )
    assert req_surg.status_code == 200

    # Ingest requirement into Drone project
    req_drone = client.post(
        "/api/requirements",
        json={
            "id": "REQ-DRONE-001",
            "project_id": "proj-aero-drone",
            "text": "The drone telemetry uplink shall switch to Iridium SATCOM if 5G signal drops below -105 dBm.",
            "category": "Communications",
            "status": "FLAGGED_TBD"
        },
        headers={"X-User-Role": "product_manager"}
    )
    assert req_drone.status_code == 200

    # Query Surgical Arm project requirements
    resp_surg = client.get("/api/requirements?project_id=proj-surgical-arm")
    assert resp_surg.status_code == 200
    surg_ids = [r["id"] for r in resp_surg.json()]
    assert "REQ-SURG-001" in surg_ids
    assert "REQ-DRONE-001" not in surg_ids  # STRICT ISOLATION

    # Query Drone project requirements
    resp_drone = client.get("/api/requirements?project_id=proj-aero-drone")
    assert resp_drone.status_code == 200
    drone_ids = [r["id"] for r in resp_drone.json()]
    assert "REQ-DRONE-001" in drone_ids
    assert "REQ-SURG-001" not in drone_ids  # STRICT ISOLATION


def test_manual_project_context_crud_and_boundary_locking():
    project_id = "proj-context-test"
    # Create project
    create_resp = client.post(
        "/api/projects",
        json={
            "project_id": project_id,
            "project_name": "Boundary Lock Test Project",
            "domain": "Industrial IoT",
            "description": "High temperature sensor node."
        },
        headers={"X-User-Role": "product_manager"}
    )
    assert create_resp.status_code == 200

    # Add charter document
    doc_resp = client.post(
        f"/api/projects/{project_id}/documents",
        data={
            "title": "Thermal Envelope Charter",
            "category": "Environmental Constraints",
            "text": "Max continuous operating temperature is 125°C."
        },
        headers={"X-User-Role": "product_manager"}
    )
    assert doc_resp.status_code == 200
    docs = doc_resp.json()["documents"]
    assert len(docs) == 1
    doc_id = docs[0]["id"]
    assert docs[0]["title"] == "Thermal Envelope Charter"

    # Lock the project architecture boundary
    lock_resp = client.post(
        f"/api/projects/{project_id}/lock",
        json={"is_locked": True, "locked_by": "Chief Systems Architect"},
        headers={"X-User-Role": "systems_engineer"}
    )
    assert lock_resp.status_code == 200
    assert lock_resp.json()["is_locked"] is True
    assert lock_resp.json()["locked_by"] == "Chief Systems Architect"

    # Attempt to modify project metadata while locked -> MUST FAIL (423 Locked)
    update_fail = client.put(
        f"/api/projects/{project_id}",
        json={"description": "Hacked metadata change"},
        headers={"X-User-Role": "product_manager"}
    )
    assert update_fail.status_code == 423
    assert "locked" in update_fail.json()["detail"].lower()

    # Attempt to add another document while locked -> MUST FAIL (423 Locked)
    doc_fail = client.post(
        f"/api/projects/{project_id}/documents",
        data={
            "title": "Unauthorized Document",
            "text": "This should not be allowed while boundary is locked."
        },
        headers={"X-User-Role": "product_manager"}
    )
    assert doc_fail.status_code == 423
    assert "locked" in doc_fail.json()["detail"].lower()

    # Attempt to delete document while locked -> MUST FAIL (423 Locked)
    del_doc_fail = client.delete(
        f"/api/projects/{project_id}/documents/{doc_id}",
        headers={"X-User-Role": "product_manager"}
    )
    assert del_doc_fail.status_code == 423

    # Unlock the boundary
    unlock_resp = client.post(
        f"/api/projects/{project_id}/lock",
        json={"is_locked": False},
        headers={"X-User-Role": "systems_engineer"}
    )
    assert unlock_resp.status_code == 200
    assert unlock_resp.json()["is_locked"] is False

    # Now document deletion succeeds
    del_doc_ok = client.delete(
        f"/api/projects/{project_id}/documents/{doc_id}",
        headers={"X-User-Role": "product_manager"}
    )
    assert del_doc_ok.status_code == 200
    assert del_doc_ok.json()["status"] == "deleted"


def test_hierarchical_executive_rbac_restrictions():
    # 1. Executive attempts to create a project -> MUST BE REJECTED (403)
    exec_proj_fail = client.post(
        "/api/projects",
        json={
            "project_id": "proj-exec-unauthorized",
            "project_name": "Executive Project",
            "domain": "Finance",
            "description": "Unauthorized creation"
        },
        headers={"X-User-Role": "executive"}
    )
    assert exec_proj_fail.status_code == 403
    assert "read-only" in exec_proj_fail.json()["detail"].lower()

    # 2. Executive attempts to create a requirement -> MUST BE REJECTED (403)
    exec_req_fail = client.post(
        "/api/requirements",
        json={
            "id": "REQ-EXEC-001",
            "text": "Executive added requirement",
            "status": "DRAFT"
        },
        headers={"X-User-Role": "executive"}
    )
    assert exec_req_fail.status_code == 403

    # 3. Executive attempts parse endpoint -> MUST BE REJECTED (403)
    exec_parse_fail = client.post(
        "/api/parse/text",
        json={"text": "1. Test requirement statement."},
        headers={"X-User-Role": "executive"}
    )
    assert exec_parse_fail.status_code == 403

    # 4. Setup requirements with different states in a project
    pid = "proj-rbac-test"
    client.post(
        "/api/projects",
        json={
            "project_id": pid,
            "project_name": "RBAC Test Project",
            "domain": "Automotive",
            "description": "Testing visibility thresholds"
        },
        headers={"X-User-Role": "product_manager"}
    )

    # REQ 1: FLAGGED_TBD (Draft / flaw found)
    client.post(
        "/api/requirements",
        json={
            "id": "REQ-RBAC-001",
            "project_id": pid,
            "text": "The controller shall quickly respond to faults.",
            "status": "FLAGGED_TBD"
        },
        headers={"X-User-Role": "product_manager"}
    )

    # REQ 2: PROVISIONAL_PM (PM Approved provisional target)
    client.post(
        "/api/requirements",
        json={
            "id": "REQ-RBAC-002",
            "project_id": pid,
            "text": "The controller shall respond within 200ms of fault.",
            "status": "PROVISIONAL_PM"
        },
        headers={"X-User-Role": "product_manager"}
    )

    # REQ 3: LOCKED_BASELINE (Fully signed off)
    client.post(
        "/api/requirements",
        json={
            "id": "REQ-RBAC-003",
            "project_id": pid,
            "text": "The controller shall cut power within 15ms of pyrofuse fire.",
            "status": "LOCKED_BASELINE"
        },
        headers={"X-User-Role": "product_manager"}
    )

    # 5. Executive Visibility Test:
    # Executives query requirements for this project
    exec_list_resp = client.get(
        f"/api/requirements?project_id={pid}",
        headers={"X-User-Role": "executive"}
    )
    assert exec_list_resp.status_code == 200
    exec_items = exec_list_resp.json()
    exec_ids = [item["id"] for item in exec_items]

    # FLAGGED_TBD MUST BE SHIELDED FROM EXECUTIVE
    assert "REQ-RBAC-001" not in exec_ids
    # PROVISIONAL_PM and LOCKED_BASELINE ARE VISIBLE
    assert "REQ-RBAC-002" in exec_ids
    assert "REQ-RBAC-003" in exec_ids

    # 6. PM sees all three
    pm_list_resp = client.get(
        f"/api/requirements?project_id={pid}",
        headers={"X-User-Role": "product_manager"}
    )
    pm_ids = [item["id"] for item in pm_list_resp.json()]
    assert "REQ-RBAC-001" in pm_ids
    assert "REQ-RBAC-002" in pm_ids
    assert "REQ-RBAC-003" in pm_ids

    # 7. Executive attempts direct GET of REQ-RBAC-001 (FLAGGED_TBD) -> MUST BE 403 Forbidden
    direct_get_fail = client.get(
        f"/api/requirements/REQ-RBAC-001?project_id={pid}",
        headers={"X-User-Role": "executive"}
    )
    assert direct_get_fail.status_code == 403
    assert "hidden from executive review" in direct_get_fail.json()["detail"].lower()

    # 8. Executive attempts direct GET of REQ-RBAC-002 (PROVISIONAL_PM) -> SUCCEEDS (200)
    direct_get_ok = client.get(
        f"/api/requirements/REQ-RBAC-002?project_id={pid}",
        headers={"X-User-Role": "executive"}
    )
    assert direct_get_ok.status_code == 200


def test_dual_key_separation_of_duties_rbac():
    pid = "proj-dualkey-rbac"
    client.post(
        "/api/projects",
        json={
            "project_id": pid,
            "project_name": "Dual Key Separation",
            "domain": "Avionics",
            "description": "Rigorous gate checking"
        },
        headers={"X-User-Role": "product_manager"}
    )

    client.post(
        "/api/requirements",
        json={
            "id": "REQ-GATE-001",
            "project_id": pid,
            "text": "The autopilot shall disengage under manual yoke torque.",
            "status": "FLAGGED_TBD"
        },
        headers={"X-User-Role": "product_manager"}
    )

    # 1. Product Manager CANNOT grant technical sign-off (lock_baseline)
    pm_lock_fail = client.post(
        f"/api/requirements/REQ-GATE-001/sign-off?project_id={pid}",
        json={
            "action": "lock_baseline",
            "tech_lead_approver": "Rogue PM",
            "hardware_rationale": "Attempted bypass"
        },
        headers={"X-User-Role": "product_manager"}
    )
    assert pm_lock_fail.status_code == 403
    assert "lead systems engineer technical sign-off" in pm_lock_fail.json()["detail"].lower()

    # 2. Systems Engineer CANNOT author provisional PM target
    eng_prov_fail = client.post(
        f"/api/requirements/REQ-GATE-001/sign-off?project_id={pid}",
        json={
            "action": "provisional_pm",
            "pm_author": "Rogue Engineer",
            "pm_target_val": "50 Nm"
        },
        headers={"X-User-Role": "systems_engineer"}
    )
    assert eng_prov_fail.status_code == 403
    assert "reserved for product managers" in eng_prov_fail.json()["detail"].lower()

    # 3. Executive CANNOT perform ANY dual-key transition
    exec_sign_fail = client.post(
        f"/api/requirements/REQ-GATE-001/sign-off?project_id={pid}",
        json={"action": "provisional_pm"},
        headers={"X-User-Role": "executive"}
    )
    assert exec_sign_fail.status_code == 403

    # 4. Valid flow: PM sets provisional, Lead Engineer locks baseline
    pm_step = client.post(
        f"/api/requirements/REQ-GATE-001/sign-off?project_id={pid}",
        json={
            "action": "provisional_pm",
            "pm_author": "Authorized PM",
            "pm_target_val": "25 Nm yoke force"
        },
        headers={"X-User-Role": "product_manager"}
    )
    assert pm_step.status_code == 200
    assert pm_step.json()["status"] == RequirementStatus.PROVISIONAL_PM

    eng_step = client.post(
        f"/api/requirements/REQ-GATE-001/sign-off?project_id={pid}",
        json={
            "action": "lock_baseline",
            "tech_lead_approver": "Chief Avionics Engineer",
            "hardware_rationale": "Calibrated against strain gauge sensor range"
        },
        headers={"X-User-Role": "systems_engineer"}
    )
    assert eng_step.status_code == 200
    assert eng_step.json()["status"] == RequirementStatus.LOCKED_BASELINE
    assert eng_step.json()["sign_off"]["tech_lead_approver"] == "Chief Avionics Engineer"


def test_sqlite_write_through_rehydration(tmp_path):
    """Verify that projects, documents, and requirements rehydrate flawlessly across server restarts."""
    import tempfile
    from backend.services.storage import RequirementStore
    from backend.models.schemas import RequirementStatement, RequirementStatus

    db_file = tmp_path / "test_rehydrate.db"

    # Server Run 1: Create workspace & add requirement
    s1 = RequirementStore(db_path=db_file)
    s1.create_project("proj-durability", "Durability Node", "Industrial Safety", "Fail-safe shutdown")
    s1.upsert(
        RequirementStatement(
            id="REQ-DUR-001",
            project_id="proj-durability",
            text="The fail-safe relay shall open within 2ms of power loss.",
            status=RequirementStatus.LOCKED_BASELINE
        )
    )

    # Server Run 2: Fresh instance simulating server reboot / venue restart
    s2 = RequirementStore(db_path=db_file)
    proj = s2.get_project("proj-durability")
    assert proj is not None
    assert proj.project_name == "Durability Node"
    assert proj.domain == "Industrial Safety"

    req = s2.get_by_id("REQ-DUR-001", project_id="proj-durability")
    assert req is not None
    assert req.text == "The fail-safe relay shall open within 2ms of power loss."
    assert req.status == RequirementStatus.LOCKED_BASELINE


def test_tbd_resolution_and_provisional_demotion_governance():
    """
    Verify strict Dual-Key Governance:
    - Resolving TBD from red to concrete value sets status to PROVISIONAL_PM (yellow), NOT green.
    - Resolving while already provisional keeps status as PROVISIONAL_PM (yellow).
    - Cannot lock baseline if [TBD] placeholders remain (HTTP 400).
    - If requirement was LOCKED_BASELINE (green) and text/parameters are modified, it demotes to PROVISIONAL_PM (yellow).
    - ONLY Lead Systems Engineer sign-off can transition to LOCKED_BASELINE (green).
    """
    pid = "proj-gov-demotion"
    store.create_project(pid, "Demotion Testbed", "Automotive", "Strict sign-off verification")

    # 1. Ingest with [TBD:] -> FLAGGED_TBD (red)
    r1 = client.post(
        f"/api/requirements?project_id={pid}",
        json={
            "id": "REQ-DEMO-01",
            "project_id": pid,
            "text": "The controller shall broadcast status within [TBD: latency in ms].",
            "status": "FLAGGED_TBD"
        },
        headers={"X-User-Role": "product_manager"}
    )
    assert r1.status_code == 200
    assert r1.json()["status"] == RequirementStatus.FLAGGED_TBD

    # 2. Senior Engineer attempts to lock baseline while [TBD:] remains -> 400 Rejected
    lock_fail = client.post(
        f"/api/requirements/REQ-DEMO-01/sign-off?project_id={pid}",
        json={
            "action": "lock_baseline",
            "tech_lead_approver": "Chief Engineer",
            "hardware_rationale": "Hardware envelope check"
        },
        headers={"X-User-Role": "systems_engineer"}
    )
    assert lock_fail.status_code == 400
    assert "contains unresolved [TBD] parameters" in lock_fail.json()["detail"]

    # 3. Resolve TBD to a selected value ('15ms') via PUT -> Must become PROVISIONAL_PM (yellow), NEVER green
    r1_updated = client.put(
        f"/api/requirements/REQ-DEMO-01?project_id={pid}",
        json={
            "id": "REQ-DEMO-01",
            "project_id": pid,
            "text": "The controller shall broadcast status within 15ms.",
            "status": "LOCKED_BASELINE"  # Attempting to forge green baseline in PUT
        },
        headers={"X-User-Role": "product_manager"}
    )
    assert r1_updated.status_code == 200
    # Strict check: Server enforced PROVISIONAL_PM (yellow)
    assert r1_updated.json()["status"] == RequirementStatus.PROVISIONAL_PM
    assert r1_updated.json()["sign_off"] is None or r1_updated.json()["sign_off"]["tech_lead_approver"] is None

    # 4. Senior Systems Engineer explicitly reviews and grants technical sign-off -> Now LOCKED_BASELINE (green)
    lock_success = client.post(
        f"/api/requirements/REQ-DEMO-01/sign-off?project_id={pid}",
        json={
            "action": "lock_baseline",
            "tech_lead_approver": "Chief Avionics Engineer",
            "hardware_rationale": "15ms fits within 20ms CAN bus cyclic budget"
        },
        headers={"X-User-Role": "systems_engineer"}
    )
    assert lock_success.status_code == 200
    assert lock_success.json()["status"] == RequirementStatus.LOCKED_BASELINE
    assert lock_success.json()["sign_off"]["tech_lead_approver"] == "Chief Avionics Engineer"

    # 5. Subsequent text/parameter edit by PM demotes LOCKED_BASELINE immediately back to PROVISIONAL_PM (yellow)
    r1_re_edited = client.put(
        f"/api/requirements/REQ-DEMO-01?project_id={pid}",
        json={
            "id": "REQ-DEMO-01",
            "project_id": pid,
            "text": "The controller shall broadcast status within 25ms.",
            "status": "LOCKED_BASELINE"
        },
        headers={"X-User-Role": "product_manager"}
    )
    assert r1_re_edited.status_code == 200
    # Demoted back to yellow!
    assert r1_re_edited.json()["status"] == RequirementStatus.PROVISIONAL_PM
    # Senior sign-off invalidated and cleared
    assert r1_re_edited.json()["sign_off"] is None or r1_re_edited.json()["sign_off"]["tech_lead_approver"] is None

