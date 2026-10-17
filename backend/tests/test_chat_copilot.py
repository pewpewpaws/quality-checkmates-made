import os
from pathlib import Path
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.storage import store
from backend.api.routes_chat import qualcomm
from backend.models.schemas import RequirementStatus

client = TestClient(app)
# Ensure deterministic mock mode for fast and resilient unit testing
qualcomm.mock_mode = True


def test_get_initial_project_context():
    resp = client.get("/api/chat/context")
    assert resp.status_code == 200
    data = resp.json()
    assert data["project_id"] == "default_project"
    assert "800V EV" in data["project_name"]
    assert "Automotive" in data["domain"]
    assert len(data["documents"]) >= 1


def test_upload_project_documentation():
    # 1. Upload architectural safety charter via text
    resp = client.post(
        "/api/chat/context/document",
        data={
            "title": "Thermal Management & Fast Charge Spec",
            "category": "Thermal Systems",
            "project_id": "default_project",
            "text": (
                "The 800V battery pack employs dielectric immersion cooling. "
                "During 350kW DC ultra-fast charging, cell surface temperatures must not exceed 55°C. "
                "If temperature exceeds 60°C, immediate thermal runaway mitigation protocols must engage."
            )
        }
    )
    assert resp.status_code == 200
    ctx = resp.json()
    assert any(d["title"] == "Thermal Management & Fast Charge Spec" for d in ctx["documents"])

    # 2. Upload PDF charter via file
    pdf_path = Path("sample_data/pm_documents/medical_pump_srs.pdf")
    if pdf_path.exists():
        with open(pdf_path, "rb") as f:
            pdf_resp = client.post(
                "/api/chat/context/document",
                data={
                    "title": "Clinical Safety Brief",
                    "category": "Regulatory",
                    "project_id": "default_project"
                },
                files={"file": ("medical_pump_srs.pdf", f, "application/pdf")}
            )
        assert pdf_resp.status_code == 200
        pdf_ctx = pdf_resp.json()
        assert any(d["title"] == "Clinical Safety Brief" for d in pdf_ctx["documents"])


def test_pm_plain_language_chat_interaction():
    initial_count = len(store.get_all())

    # PM enters conversational plain-language request
    pm_input = (
        "Hey copilot, when the battery gets too hot while fast charging, "
        "we need the coolant pump to turn on, and warn the driver so the car doesn't burn down."
    )

    resp = client.post(
        "/api/chat/message",
        json={
            "message": pm_input,
            "project_id": "default_project",
            "save_to_store": True,
            "conversation_history": [
                {"role": "user", "content": "What is our fast charging thermal limit?"},
                {"role": "assistant", "content": "According to the project charter, the maximum pack surface temperature is 55°C during 350kW DC fast charging."}
            ]
        }
    )
    assert resp.status_code == 200
    data = resp.json()

    # 1. Check conversational agent response
    assert "agent_reply" in data
    assert len(data["agent_reply"]) > 20
    assert "context_grounding" in data
    assert "800V" in data["context_grounding"] or "Charter" in data["context_grounding"]

    # 2. Check synthesized EARS requirements
    reqs = data["generated_requirements"]
    assert len(reqs) >= 2  # Decomposed into cooling actuation + driver warning
    
    # Requirement 1: Auxiliary coolant flow
    req1 = reqs[0]
    assert "[TBD:" in req1["text"]
    assert "shall activate" in req1["text"].lower() or "shall" in req1["text"].lower()
    assert req1["status"] == RequirementStatus.FLAGGED_TBD
    assert req1["rewrite_suggestion"] is not None
    assert len(req1["rewrite_suggestion"]["identified_tbds"]) >= 1
    # Check smart suggested default grounded in charter
    tbd_names = [t["parameter_name"] for t in req1["rewrite_suggestion"]["identified_tbds"]]
    assert "max_pack_temp_degC" in tbd_names

    # Requirement 2: Driver alert
    req2 = reqs[1]
    assert "[TBD:" in req2["text"]
    assert "shall display" in req2["text"].lower() or "warning" in req2["text"].lower()

    # 3. Check automatic store persistence
    new_count = len(store.get_all())
    assert new_count == initial_count + len(reqs)

    # Verify requirements can be fetched from store
    stored_req = store.get_by_id(req1["id"])
    assert stored_req is not None
    assert stored_req.text == req1["text"]


def test_generic_plain_language_chat_interaction():
    # PM types another requirement thought
    pm_input = "make sure telemetry upload happens whenever the car is parked near home wifi"

    resp = client.post(
        "/api/chat/message",
        json={
            "message": pm_input,
            "project_id": "default_project",
            "save_to_store": True
        }
    )
    assert resp.status_code == 200
    data = resp.json()

    assert len(data["generated_requirements"]) >= 1
    req = data["generated_requirements"][0]
    assert "[TBD:" in req["text"]
    assert "shall" in req["text"].lower()
    assert len(req["rewrite_suggestion"]["identified_tbds"]) >= 1


def test_broke_entrepreneur_toy_company_chat_synthesis():
    """
    Test edge-case scenario where an aspiring founder with zero capital and an ultra-vague
    raw concept ('I am broke', 'toy company for 10-15yo', 'that's pretty much all the idea')
    prompts the Requirement Quality Copilot.
    
    Verifies that the Copilot:
    1. Acknowledges bootstrap financial realities and demographic boundaries.
    2. Decomposes the vague concept into formal, atomic EARS requirements:
       - Low-BOM manufacturing cost ceiling (protecting bootstrap budget)
       - Target demographic & ergonomic boundaries (10-15 years)
       - Consumer toy safety compliance (ASTM F963 & drop impact)
    3. Strictly enforces the Zero-Fabrication Directive by keeping all numbers as [TBD: ...]
    4. Attaches actionable Smart Suggested Defaults with engineering rationales in metadata chips.
    5. Persists the requirements into project storage under FLAGGED_TBD governance status.
    """
    proj_id = "proj-broke-toy-startup"
    
    # 1. Initialize project workspace
    client.post(
        "/api/projects",
        json={
            "project_id": proj_id,
            "project_name": "Bootstrap Youth Toy Startup",
            "domain": "Consumer Robotics & Youth Hardware",
            "description": "Ultra-low-budget venture targeting 10-15 year old educational toys."
        },
        headers={"X-User-Role": "product_manager"}
    )

    # 2. PM enters raw, ultra-vague, budget-constrained prompt
    vague_pm_input = (
        "Look, I am completely broke and have zero budget, but I want to start a toy company "
        "for 10-15yo kids. That is pretty much all the idea that I have. "
        "Can you make requirements based on that?"
    )

    resp = client.post(
        "/api/chat/message",
        json={
            "message": vague_pm_input,
            "project_id": proj_id,
            "save_to_store": True,
            "conversation_history": [
                {"role": "user", "content": "I want to start a hardware company but I have no money."},
                {"role": "assistant", "content": "I can help structure your concept into modular, low-BOM engineering requirements with parameterized cost ceilings."}
            ]
        },
        headers={"X-User-Role": "product_manager"}
    )
    assert resp.status_code == 200
    data = resp.json()

    # 3. Assert Conversational Agent Explanation
    reply = data["agent_reply"].lower()
    assert "broke" in reply or "budget" in reply or "capital" in reply or "bootstrap" in reply
    assert "10" in reply and "15" in reply
    assert "ears" in reply or "requirements" in reply

    # 4. Assert Atomic Decomposed EARS Requirements
    reqs = data["generated_requirements"]
    assert len(reqs) >= 3, f"Expected at least 3 decomposed requirements, got {len(reqs)}"

    # Requirement 1: BOM Unit Cost Constraint (Protecting Runway)
    cost_req = next((r for r in reqs if "cost" in r["category"].lower() or "manufacturing" in r["category"].lower()), None)
    assert cost_req is not None, "Missing BOM cost ceiling requirement"
    assert "shall" in cost_req["text"].lower()
    assert "[TBD: max_bom_unit_cost_usd]" in cost_req["text"]
    assert cost_req["status"] == RequirementStatus.FLAGGED_TBD
    cost_tbds = {t["parameter_name"]: t for t in cost_req["rewrite_suggestion"]["identified_tbds"]}
    assert "max_bom_unit_cost_usd" in cost_tbds
    assert "$" in cost_tbds["max_bom_unit_cost_usd"]["suggested_value"]

    # Requirement 2: Target Demographic (10-15 Years)
    demo_req = next((r for r in reqs if "demographic" in r["category"].lower() or "ergonomic" in r["category"].lower()), None)
    assert demo_req is not None, "Missing demographic bounding requirement"
    assert "shall" in demo_req["text"].lower()
    assert "[TBD: target_demographic_min_age_years]" in demo_req["text"]
    assert "[TBD: target_demographic_max_age_years]" in demo_req["text"]
    assert demo_req["status"] == RequirementStatus.FLAGGED_TBD
    demo_tbds = {t["parameter_name"]: t for t in demo_req["rewrite_suggestion"]["identified_tbds"]}
    assert demo_tbds["target_demographic_min_age_years"]["suggested_value"] == "10 years"
    assert demo_tbds["target_demographic_max_age_years"]["suggested_value"] == "15 years"

    # Requirement 3: Youth Consumer Safety & Drop Impact
    safety_req = next((r for r in reqs if "safety" in r["category"].lower() or "compliance" in r["category"].lower()), None)
    assert safety_req is not None, "Missing consumer safety requirement"
    assert "shall" in safety_req["text"].lower()
    assert "[TBD: toy_safety_standard]" in safety_req["text"]
    assert "[TBD: drop_test_height_meters]" in safety_req["text"]
    assert safety_req["status"] == RequirementStatus.FLAGGED_TBD
    safety_tbds = {t["parameter_name"]: t for t in safety_req["rewrite_suggestion"]["identified_tbds"]}
    assert "ASTM F963" in safety_tbds["toy_safety_standard"]["suggested_value"]
    assert "m" in safety_tbds["drop_test_height_meters"]["suggested_value"]

    # 5. Check Persistence in Project Store
    stored_reqs = store.get_all(project_id=proj_id)
    assert len(stored_reqs) >= 3
    for r in reqs:
        stored = store.get_by_id(r["id"])
        assert stored is not None
        assert stored.project_id == proj_id
        assert stored.status == RequirementStatus.FLAGGED_TBD
