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
