import os
from pathlib import Path
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.document_parser import DocumentParser
from backend.services.storage import store

client = TestClient(app)
DOCS_DIR = Path("sample_data/pm_documents")


def test_parse_prd_text_file():
    txt_path = DOCS_DIR / "prd_ev_battery_system.txt"
    assert txt_path.exists(), "PRD text file missing"

    content = txt_path.read_text(encoding="utf-8")
    reqs, fmt = DocumentParser.parse_text(content, default_category="Powertrain BMS")

    assert len(reqs) >= 5
    assert fmt == "numbered_list"
    assert any("[TBD: disconnect_time_ms]" in r.text for r in reqs)
    assert any("monitor all individual cell voltages" in r.text for r in reqs)


def test_parse_jira_csv_export():
    csv_path = DOCS_DIR / "jira_telemetry_export.csv"
    assert csv_path.exists(), "Jira CSV file missing"

    content_bytes = csv_path.read_bytes()
    reqs = DocumentParser.parse_csv(content_bytes, default_category="IoT")

    assert len(reqs) == 5
    assert reqs[0].id == "REQ-IOT-101"
    assert reqs[0].category == "IoT Edge"
    assert reqs[0].section == "Section 3.1"
    assert "buffer telemetry messages" in reqs[0].text
    assert reqs[4].id == "REQ-IOT-105"


def test_parse_medical_pdf_document():
    pdf_path = DOCS_DIR / "medical_pump_srs.pdf"
    assert pdf_path.exists(), "Medical SRS PDF missing"

    content_bytes = pdf_path.read_bytes()
    reqs, fmt = DocumentParser.parse_pdf(content_bytes, default_category="Medical Device")

    assert len(reqs) >= 5
    assert "pdf_" in fmt
    assert any("REQ-MED-01" in r.id for r in reqs)
    assert any("occlusion pressure" in r.text for r in reqs)
    assert any("[TBD: switchover_time_ms]" in r.text for r in reqs)


def test_parse_meeting_notes_file():
    notes_path = DOCS_DIR / "slack_meeting_notes.txt"
    assert notes_path.exists(), "Meeting notes file missing"

    content = notes_path.read_text(encoding="utf-8")
    reqs, fmt = DocumentParser.parse_text(content, default_category="ADAS")

    assert len(reqs) >= 4
    assert any("detect pedestrians within 80 meters" in r.text for r in reqs)
    assert any("haptic lane-drift warning" in r.text for r in reqs)


def test_api_upload_all_pm_file_types():
    # 1. Test CSV Upload via API
    csv_path = DOCS_DIR / "jira_telemetry_export.csv"
    with open(csv_path, "rb") as f:
        resp = client.post(
            "/api/parse/file",
            files={"file": ("jira_telemetry_export.csv", f, "text/csv")},
            data={"category": "IoT Platform"}
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["format_detected"] == "csv"
    assert data["total_parsed"] == 5

    # 2. Test PDF Upload via API
    pdf_path = DOCS_DIR / "medical_pump_srs.pdf"
    with open(pdf_path, "rb") as f:
        resp = client.post(
            "/api/parse/file",
            files={"file": ("medical_pump_srs.pdf", f, "application/pdf")},
            data={"category": "Infusion Safety"}
        )
    assert resp.status_code == 200
    data = resp.json()
    assert "pdf" in data["format_detected"]
    assert data["total_parsed"] >= 5

    # 3. Test TXT PRD Upload via API
    txt_path = DOCS_DIR / "prd_ev_battery_system.txt"
    with open(txt_path, "rb") as f:
        resp = client.post(
            "/api/parse/file",
            files={"file": ("prd_ev_battery_system.txt", f, "text/plain")},
            data={"category": "Powertrain"}
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_parsed"] >= 5

    # Verify requirements were persisted in store
    all_reqs = store.get_all()
    assert len(all_reqs) >= 15
