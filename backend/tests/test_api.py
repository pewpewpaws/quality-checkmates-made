from fastapi.testclient import TestClient
from backend.main import app
from backend.models.schemas import RequirementStatus

client = TestClient(app)


def test_root_endpoint():
    resp = client.get("/")
    assert resp.status_code == 200
    data = resp.json()
    assert "Qualcomm Cloud AI 100" in data["hardware"]


def test_health_endpoint():
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["backend"] == "healthy"
    assert "qualcomm_ai100" in data


def test_list_requirements():
    resp = client.get("/api/requirements")
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) >= 4  # Preloaded demo items


def test_dual_key_sign_off_flow():
    # 1. Check initial state
    resp = client.get("/api/requirements/REQ-BMS-001")
    assert resp.status_code == 200
    assert resp.json()["status"] == RequirementStatus.FLAGGED_TBD

    # 2. PM sets provisional value
    pm_resp = client.post(
        "/api/requirements/REQ-BMS-001/sign-off",
        json={
            "action": "provisional_pm",
            "pm_author": "Alice PM",
            "pm_target_val": "250 ms"
        }
    )
    assert pm_resp.status_code == 200
    assert pm_resp.json()["status"] == RequirementStatus.PROVISIONAL_PM
    assert pm_resp.json()["sign_off"]["pm_target_val"] == "250 ms"

    # 3. Lead Systems Engineer signs off
    eng_resp = client.post(
        "/api/requirements/REQ-BMS-001/sign-off",
        json={
            "action": "lock_baseline",
            "tech_lead_approver": "Bob Systems Lead",
            "hardware_rationale": "Matches CAN-FD 500kbps bus cycle allowance"
        }
    )
    assert eng_resp.status_code == 200
    assert eng_resp.json()["status"] == RequirementStatus.LOCKED_BASELINE
    assert eng_resp.json()["sign_off"]["tech_lead_approver"] == "Bob Systems Lead"


def test_parse_text_api():
    text_data = "1. The pump shall shut down on fault.\n2. The alarm shall sound within 1 second."
    resp = client.post("/api/parse/text", json={"text": text_data})
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_parsed"] == 2


def test_analysis_endpoints_with_mock():
    from backend.api.routes_analysis import qualcomm
    qualcomm.mock_mode = True

    # Use existing REQ-BMS-001
    # 1. X-Ray
    resp = client.post("/api/analysis/xray", json={"requirement_id": "REQ-BMS-001"})
    assert resp.status_code == 200
    issues = resp.json()
    assert isinstance(issues, list)
    assert len(issues) > 0

    # 2. Interpretation Duel
    resp = client.post("/api/analysis/duel", json={"requirement_id": "REQ-BMS-001"})
    assert resp.status_code == 200
    duel = resp.json()
    assert "card_a" in duel and "card_b" in duel

    # 3. Smart Rewriter
    resp = client.post("/api/analysis/rewrite", json={"requirement_id": "REQ-BMS-001"})
    assert resp.status_code == 200
    rewritten = resp.json()
    assert "[TBD:" in rewritten["revised"]
    assert len(rewritten["identified_tbds"]) > 0

    # 4. Verification Blueprint
    resp = client.post("/api/analysis/blueprint", json={"requirement_id": "REQ-BMS-001"})
    assert resp.status_code == 200
    blueprint = resp.json()
    assert "positive_test_case" in blueprint
    assert "acceptance_criteria" in blueprint
