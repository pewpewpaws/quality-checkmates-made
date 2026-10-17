"""
End-to-End Comprehensive Verification Suite: Phase 0 through Phase 2.

Covers:
- Phase 0: System health and architecture runtime.
- Phase 1: Ingestion & Document Parsing (TXT, CSV, PDF) across Aerospace, Robotic Surgery, and Avionics domains.
- Phase 1.5: Multi-Project Workspaces, Document Context Attachment & Hierarchical Executive RBAC.
- Phase 1: Conversational Requirement Copilot chat grounded in uploaded project documentation.
- Phase 2: Deterministic Rubric Scoring Engine (100 pts) with Itemized Receipts.
- Phase 2: Evidence Validator verbatim substring grounding and character span offsets.
- Phase 2: Duplicate detection & Dual-Key Governance sign-off transitions.
"""

from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.storage import store
from backend.services.document_parser import DocumentParser
from backend.services.rubric_engine import rubric_engine
from backend.services.evidence_validator import evidence_validator
from backend.api.routes_chat import qualcomm as chat_qualcomm
from backend.api.routes_analysis import qualcomm as analysis_qualcomm
from backend.api.routes_requirements import qualcomm as req_qualcomm
from backend.models.schemas import RequirementStatus, UserRole

client = TestClient(app)
chat_qualcomm.mock_mode = True
analysis_qualcomm.mock_mode = True
req_qualcomm.mock_mode = True
DOCS_DIR = Path("sample_data/pm_documents")


# ==============================================================================
# PHASE 0: SYSTEM HEALTH & RUNTIME
# ==============================================================================

def test_phase_0_system_health():
    """Verify backend health and core operational endpoints."""
    resp_root = client.get("/")
    assert resp_root.status_code == 200
    assert resp_root.json()["status"] == "online"
    assert "Qualcomm" in resp_root.json()["hardware"]

    resp_health = client.get("/health")
    assert resp_health.status_code == 200
    data = resp_health.json()
    assert data["backend"] == "healthy"
    assert "qualcomm_ai100" in data


# ==============================================================================
# PHASE 1: DOCUMENT PARSING ACROSS FORMATS (TXT, CSV, PDF)
# ==============================================================================

def test_phase_1_parse_aerospace_txt():
    """Verify TXT ingestion: numbered list with conditions, units, and TBD tokens."""
    txt_path = DOCS_DIR / "aerospace_flight_charter.txt"
    assert txt_path.exists(), "Aerospace flight charter TXT missing"
    
    content = txt_path.read_text(encoding="utf-8")
    reqs, fmt = DocumentParser.parse_text(content, default_category="Flight Controls")
    
    assert len(reqs) == 5
    assert fmt == "numbered_list"
    assert any("pitch angle between -15 degrees" in r.text for r in reqs)
    assert any("[TBD: stall_warning_speed_knots]" in r.text for r in reqs)
    assert any("where feasible" in r.text for r in reqs)


def test_phase_1_parse_robotic_surgery_csv():
    """Verify CSV ingestion: structured rows, explicit IDs, and medical parameters."""
    csv_path = DOCS_DIR / "robotic_surgery_spec.csv"
    assert csv_path.exists(), "Robotic surgery CSV missing"
    
    content_bytes = csv_path.read_bytes()
    reqs = DocumentParser.parse_csv(content_bytes, default_category="Surgical Robotics")
    
    assert len(reqs) == 5
    assert reqs[0].id == "REQ-ROB-01"
    assert reqs[0].category == "Kinematics"
    assert "0.5 mm" in reqs[0].text
    assert reqs[2].id == "REQ-ROB-03"
    assert "[TBD: estop_latency_ms]" in reqs[2].text
    assert "fast and reliably" in reqs[3].text


def test_phase_1_parse_avionics_pdf():
    """Verify PDF ingestion: DO-178C avionics specification with explicit REQ tags."""
    pdf_path = DOCS_DIR / "avionics_displays_srs.pdf"
    assert pdf_path.exists(), "Avionics displays PDF missing"
    
    content_bytes = pdf_path.read_bytes()
    reqs, fmt = DocumentParser.parse_pdf(content_bytes, default_category="Avionics")
    
    assert len(reqs) == 5
    assert "pdf" in fmt
    assert any("REQ-AV-101" in r.id for r in reqs)
    assert any("artificial horizon attitude indicators at 60 Hz" in r.text for r in reqs)
    assert any("[TBD: standby_boot_ms]" in r.text for r in reqs)


def test_phase_1_api_multipart_file_upload():
    """Verify API file upload endpoint across all 3 formats."""
    # 1. Upload TXT via API
    with open(DOCS_DIR / "aerospace_flight_charter.txt", "rb") as f:
        resp_txt = client.post(
            "/api/parse/file",
            files={"file": ("aerospace_flight_charter.txt", f, "text/plain")},
            data={"category": "Aerospace"}
        )
    assert resp_txt.status_code == 200
    assert resp_txt.json()["total_parsed"] == 5

    # 2. Upload CSV via API
    with open(DOCS_DIR / "robotic_surgery_spec.csv", "rb") as f:
        resp_csv = client.post(
            "/api/parse/file",
            files={"file": ("robotic_surgery_spec.csv", f, "text/csv")},
            data={"category": "Robotics"}
        )
    assert resp_csv.status_code == 200
    assert resp_csv.json()["total_parsed"] == 5

    # 3. Upload PDF via API
    with open(DOCS_DIR / "avionics_displays_srs.pdf", "rb") as f:
        resp_pdf = client.post(
            "/api/parse/file",
            files={"file": ("avionics_displays_srs.pdf", f, "application/pdf")},
            data={"category": "Avionics"}
        )
    assert resp_pdf.status_code == 200
    assert resp_pdf.json()["total_parsed"] == 5


# ==============================================================================
# PHASE 1.5: MULTI-PROJECT WORKSPACES & EXECUTIVE RBAC
# ==============================================================================

def test_phase_1_5_workspace_isolation_and_rbac():
    pid = "proj-e2e-aerospace"
    store.delete_project(pid)

    # 1. Create Workspace
    resp = client.post(
        "/api/projects",
        json={
            "project_id": pid,
            "project_name": "Commercial Regional Jet Avionics",
            "domain": "Aerospace DO-178C DAL-A",
            "description": "Primary Flight Display and Fly-by-wire controls."
        },
        headers={"X-User-Role": "product_manager"}
    )
    assert resp.status_code == 200

    # 2. Attach PDF document to workspace context
    with open(DOCS_DIR / "avionics_displays_srs.pdf", "rb") as f:
        doc_resp = client.post(
            "/api/chat/context/document",
            data={
                "title": "Primary Flight Display Specification",
                "category": "Avionics",
                "project_id": pid
            },
            files={"file": ("avionics_displays_srs.pdf", f, "application/pdf")}
        )
    assert doc_resp.status_code == 200
    ctx = doc_resp.json()
    assert any(d["title"] == "Primary Flight Display Specification" for d in ctx["documents"])

    # 3. Add Draft Requirement to Project
    req_resp = client.post(
        "/api/requirements",
        json={
            "id": "REQ-AERO-001",
            "project_id": pid,
            "text": "The flight computer shall command rudder trim rapidly as needed.",
            "category": "Controls",
            "status": "FLAGGED_TBD"
        },
        headers={"X-User-Role": "product_manager"}
    )
    assert req_resp.status_code == 200

    # 4. Verify Executive Visibility Shielding
    # PM can view the unapproved draft:
    pm_view = client.get(f"/api/requirements/REQ-AERO-001?project_id={pid}", headers={"X-User-Role": "product_manager"})
    assert pm_view.status_code == 200

    # Executive is shielded (403):
    exec_view = client.get(f"/api/requirements/REQ-AERO-001?project_id={pid}", headers={"X-User-Role": "executive"})
    assert exec_view.status_code == 403

    # Clean up project
    store.delete_project(pid)


# ==============================================================================
# PHASE 1: CONVERSATIONAL REQUIREMENT COPILOT CHAT
# ==============================================================================

def test_phase_1_chat_copilot_synthesis():
    """Verify Conversational PM Chat synthesizes atomic EARS requirements with [TBD] preservation."""
    pm_message = (
        "When the cabin altitude exceeds 10,000 feet, sound the warning chime and illuminate master caution."
    )

    resp = client.post(
        "/api/chat/message",
        json={
            "message": pm_message,
            "project_id": "default_project",
            "save_to_store": False
        }
    )
    assert resp.status_code == 200
    data = resp.json()

    assert "agent_reply" in data
    assert len(data["agent_reply"]) > 10
    reqs = data["generated_requirements"]
    assert len(reqs) >= 1
    assert any("shall" in r["text"].lower() for r in reqs)
    assert any(r["status"] == RequirementStatus.FLAGGED_TBD for r in reqs)


# ==============================================================================
# PHASE 2: DETERMINISTIC RUBRIC ENGINE & EVIDENCE VALIDATOR
# ==============================================================================

def test_phase_2_rubric_scoring_and_receipts():
    """Verify 100-pt rubric score calculation with itemized deduction receipts."""
    # 1. Requirement with clarity flaw from robotic surgery CSV
    flawed_robotic = "The articulated arm shall execute wrist rotations fast and reliably."
    score_flawed = rubric_engine.calculate_score(flawed_robotic)
    assert score_flawed.overall == 90.0
    assert score_flawed.clarity == 15.0  # Penalized for 'fast' (-5) and 'reliably' (-5)
    assert any("fast" in r for r in score_flawed.receipt)
    assert any("reliably" in r for r in score_flawed.receipt)

    # 2. Perfect avionics requirement from avionics PDF
    perfect_avionics = "The primary flight display shall refresh artificial horizon attitude indicators at 60 Hz."
    score_perfect = rubric_engine.calculate_score(perfect_avionics)
    assert score_perfect.overall >= 95.0
    assert score_perfect.clarity == 25.0
    assert score_perfect.verifiability == 25.0
    assert score_perfect.completeness == 20.0
    assert score_perfect.atomicity == 15.0
    assert score_perfect.consistency == 15.0


def test_phase_2_evidence_validator_offsets():
    """Verify EvidenceValidator extracts exact character offsets for UI highlighting."""
    text = "The detachable instrument tool shall withstand 50 autoclave steam sterilization cycles at 134 degrees Celsius."
    quote = "withstand 50 autoclave steam sterilization cycles"
    is_grounded, aligned, start, end = evidence_validator.locate_substring(text, quote)
    
    assert is_grounded is True
    assert aligned == quote
    assert start is not None
    assert end is not None
    assert text[start:end] == quote


def test_phase_2_duplicate_detection_and_dual_key_signoff():
    """Verify duplicate detection and full dual-key governance lifecycle."""
    pid = "proj-e2e-governance"
    store.delete_project(pid)

    client.post(
        "/api/projects",
        json={
            "project_id": pid,
            "project_name": "Governance Testbed",
            "domain": "Medical Devices",
            "description": "Dual-Key verification."
        },
        headers={"X-User-Role": "product_manager"}
    )

    # Ingest Requirement 1
    r1 = client.post(
        "/api/requirements",
        json={
            "id": "REQ-GOV-01",
            "project_id": pid,
            "text": "The infusion pump shall deliver medication within +/- 5% accuracy.",
            "category": "Infusion",
            "status": "FLAGGED_TBD"
        },
        headers={"X-User-Role": "product_manager"}
    )
    assert r1.status_code == 200

    # Ingest Exact Duplicate
    r2 = client.post(
        "/api/requirements",
        json={
            "id": "REQ-GOV-02",
            "project_id": pid,
            "text": "The infusion pump shall deliver medication within +/- 5% accuracy.",
            "category": "Infusion",
            "status": "FLAGGED_TBD"
        },
        headers={"X-User-Role": "product_manager"}
    )
    assert r2.status_code == 200

    # Check Duplicates API
    dup_resp = client.get(f"/api/requirements/duplicates?project_id={pid}")
    assert dup_resp.status_code == 200
    dups = dup_resp.json()
    assert len(dups) >= 1
    assert dups[0]["match_type"] == "EXACT"

    # Score via API
    score_resp = client.get(f"/api/requirements/REQ-GOV-01/score?project_id={pid}")
    assert score_resp.status_code == 200
    assert score_resp.json()["overall"] >= 90.0

    # Step 1: PM sets Provisional Value (🟡 PROVISIONAL_PM)
    pm_sign = client.post(
        f"/api/requirements/REQ-GOV-01/sign-off?project_id={pid}",
        json={
            "action": "provisional_pm",
            "pm_author": "Dr. Sarah PM",
            "pm_target_val": "5.0 mL/hr"
        },
        headers={"X-User-Role": "product_manager"}
    )
    assert pm_sign.status_code == 200
    assert pm_sign.json()["status"] == RequirementStatus.PROVISIONAL_PM

    # Step 2: Lead Systems Engineer Technical Sign-off (🟢 LOCKED_BASELINE)
    eng_sign = client.post(
        f"/api/requirements/REQ-GOV-01/sign-off?project_id={pid}",
        json={
            "action": "lock_baseline",
            "tech_lead_approver": "Marcus Lead Engineer",
            "hardware_rationale": "Stepper motor resolution validated for 0.01 mL steps"
        },
        headers={"X-User-Role": "systems_engineer"}
    )
    assert eng_sign.status_code == 200
    final_req = eng_sign.json()
    assert final_req["status"] == RequirementStatus.LOCKED_BASELINE
    assert final_req["sign_off"]["tech_lead_approver"] == "Marcus Lead Engineer"

    # Executive can now view the locked baseline!
    exec_view = client.get(f"/api/requirements/REQ-GOV-01?project_id={pid}", headers={"X-User-Role": "executive"})
    assert exec_view.status_code == 200

    store.delete_project(pid)


def test_phase_2_conflict_radar_contradictions():
    """Verify Conflict Radar flags direct contradictions and applies consistency deductions."""
    # 1. Contradictory Requirements Test (Telemetry Transmission vs Silence)
    target_req_text = "The device shall transmit cloud telemetry every five seconds during normal operation."
    contradictory_cand = "The device shall make no external network transmissions during normal operation."
    orthogonal_cand = "The battery heater shall activate when ambient temperature drops below 0 degrees Celsius."

    resp = client.post(
        "/api/analysis/conflicts",
        json={
            "target_text": target_req_text,
            "candidate_requirements": [
                {"id": "REQ-CONF-CAND-01", "text": contradictory_cand, "category": "Network"},
                {"id": "REQ-CONF-CAND-02", "text": orthogonal_cand, "category": "Thermal"}
            ]
        }
    )
    assert resp.status_code == 200
    data = resp.json()

    assert data["total_conflicts_found"] == 1
    conflict = data["conflicts"][0]
    assert conflict["conflict_type"] == "Direct Contradiction"
    assert conflict["severity"] == "BLOCKER"
    assert conflict["req_id_b"] == "REQ-CONF-CAND-01"
    assert "transmit" in conflict["conflicting_quote_a"].lower()
    assert "no external" in conflict["conflicting_quote_b"].lower()
    assert len(conflict["explanation"]) > 10
    assert len(conflict["reconciliation_suggestion"]) > 10

    # 2. Rubric Score Impact of Conflict Card
    # Consistency subscore MUST drop to 0.0 with mathematical receipt trace
    score_with_conflict = rubric_engine.calculate_score(target_req_text, conflicts=data["conflicts"])
    assert score_with_conflict.consistency == 0.0
    assert any("Conflict detected" in r for r in score_with_conflict.receipt)
    assert any("REQ-CONF-CAND-01" in r for r in score_with_conflict.receipt)

    # 3. Negative Control: Mutually Compatible Requirements
    clean_resp = client.post(
        "/api/analysis/conflicts",
        json={
            "target_text": "The primary flight display shall refresh artificial horizon attitude indicators at 60 Hz.",
            "candidate_requirements": [
                {"id": "REQ-CLEAN-01", "text": "The cockpit audio module shall sound a warning chime when cabin altitude exceeds 10000 feet.", "category": "Audio"}
            ]
        }
    )
    assert clean_resp.status_code == 200
    assert clean_resp.json()["total_conflicts_found"] == 0
