import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.models.schemas import (
    RequirementStatement, 
    RequirementStatus, 
    DualKeySignOff, 
    VerificationPlan, 
    TestCase,
    UserRole
)
from backend.services.storage import store

client = TestClient(app)

def test_executive_verification_and_certification_lifecycle():
    project_id = "proj-exec-test"
    
    # Setup isolated test workspace
    if store.get_project(project_id):
        store.delete_project(project_id)
    
    store.create_project(
        project_id=project_id,
        project_name="Avionics Flight Control Baseline",
        domain="Aerospace DO-178C",
        description="Dual-key avionics safety specification"
    )

    # 1. Add 2 requirements: 1 locked, 1 provisional
    req1 = RequirementStatement(
        id="REQ-AV-01",
        text="The flight control computer shall engage primary actuators within 50 ms of autopilot command.",
        category="Safety-Critical",
        status=RequirementStatus.LOCKED_BASELINE,
        sign_off=DualKeySignOff(
            requirement_id="REQ-AV-01",
            pm_target_val="50 ms",
            pm_author="PM Jane",
            tech_lead_approver="Lead Systems Engineer Alex",
            hardware_rationale="Actuator bus latency is 25 ms, leaving 25 ms safety margin."
        ),
        verification_plan=VerificationPlan(
            verification_method="Test",
            preconditions=["Primary flight computer booted and CAN bus online."],
            positive_test_case=TestCase(
                name="TC-AV-01-NOM: Nominal autopilot command engagement",
                stimulus="Step autopilot command from 0 to 10 deg pitch",
                expected_response="Actuators engage in 42 ms"
            ),
            negative_boundary_test_case=TestCase(
                name="TC-AV-01-STRESS: Boundary latency test under bus load",
                stimulus="70% CAN bus busyness",
                expected_response="Actuators engage within 49 ms without frame drops"
            ),
            acceptance_criteria={"pass": "Latency <= 50 ms in 100% of runs", "fail": "Latency > 50 ms"}
        )
    )

    req2 = RequirementStatement(
        id="REQ-AV-02",
        text="The pitch trim rate shall not exceed [TBD: pitch_rate_deg_per_sec] deg/s during manual control.",
        category="Flight Envelope",
        status=RequirementStatus.PROVISIONAL_PM
    )

    store.upsert(req1, project_id=project_id)
    store.upsert(req2, project_id=project_id)

    # 2. As Executive, fetch master test suite: should show is_all_locked = False
    resp = client.get(
        f"/api/projects/{project_id}/master-test-suite",
        headers={"X-User-Role": "executive"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_all_locked"] is False
    assert data["total_requirements"] == 2
    assert data["locked_count"] == 1
    assert data["pending_count"] == 1
    assert data["executive_certified"] is False

    # 3. Attempting executive certify when not all locked must fail with 400
    cert_fail = client.post(
        f"/api/projects/{project_id}/executive-certify",
        json={"approver_name": "VP Systems Dave", "notes": "Premature release attempt"},
        headers={"X-User-Role": "executive"}
    )
    assert cert_fail.status_code == 400
    assert "not yet locked by Lead Systems Engineer" in cert_fail.json()["detail"]

    # 4. Attempting executive certify as non-executive must fail with 403
    perm_fail = client.post(
        f"/api/projects/{project_id}/executive-certify",
        json={"approver_name": "Hacker", "notes": "Unauthorized"},
        headers={"X-User-Role": "product_manager"}
    )
    assert perm_fail.status_code == 403

    # 5. Lead Systems Engineer signs off on REQ-AV-02 -> LOCKED_BASELINE
    req2.status = RequirementStatus.LOCKED_BASELINE
    req2.text = "The pitch trim rate shall not exceed 1.5 deg/s during manual control."
    req2.sign_off = DualKeySignOff(
        requirement_id="REQ-AV-02",
        pm_target_val="1.5 deg/s",
        pm_author="PM Jane",
        tech_lead_approver="Lead Systems Engineer Alex",
        hardware_rationale="Aerodynamic load limits max pitch trim rate to 1.5 deg/s."
    )
    req2.verification_plan = VerificationPlan(
        verification_method="Test",
        preconditions=["Control surface actuators powered."],
        positive_test_case=TestCase(
            name="TC-AV-02-NOM: Nominal trim rate test",
            stimulus="Apply full manual nose-up trim input",
            expected_response="Trim rate measures 1.48 deg/s"
        ),
        negative_boundary_test_case=TestCase(
            name="TC-AV-02-STRESS: Overspeed trim boundary test",
            stimulus="Full deflection at Vne (never exceed velocity)",
            expected_response="Pitch trim rate clipped strictly at 1.5 deg/s"
        ),
        acceptance_criteria={"pass": "Trim rate <= 1.5 deg/s", "fail": "Trim rate > 1.5 deg/s"}
    )
    store.upsert(req2, project_id=project_id)

    # 6. Fetch master test suite again: is_all_locked must now be True
    resp2 = client.get(
        f"/api/projects/{project_id}/master-test-suite",
        headers={"X-User-Role": "executive"}
    )
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert data2["is_all_locked"] is True
    assert data2["total_requirements"] == 2
    assert data2["locked_count"] == 2
    assert data2["pending_count"] == 0
    assert len(data2["test_suite"]) == 2

    # 7. Senior Executive executes master certification
    cert_success = client.post(
        f"/api/projects/{project_id}/executive-certify",
        json={
            "approver_name": "Dr. Sarah Lin, VP Avionics Systems",
            "notes": "Flight baseline certified for Level-A DO-178C formal testing."
        },
        headers={"X-User-Role": "executive"}
    )
    assert cert_success.status_code == 200
    ws = cert_success.json()
    assert ws["executive_certified"] is True
    assert ws["executive_certified_by"] == "Dr. Sarah Lin, VP Avionics Systems"
    assert ws["executive_notes"] == "Flight baseline certified for Level-A DO-178C formal testing."
    assert ws["executive_certified_at"] is not None

    # Clean up
    store.delete_project(project_id)
