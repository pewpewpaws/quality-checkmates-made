import io
import csv
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.storage import store

client = TestClient(app)


def test_export_csv_default_project():
    """Verify CSV export contains correct headers and valid records for default project."""
    response = client.get(
        "/api/requirements/export/csv?project_id=default_project",
        headers={"X-User-Role": "product_manager"}
    )
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert "default_project_requirements.csv" in response.headers.get("content-disposition", "")

    csv_text = response.text
    reader = csv.reader(io.StringIO(csv_text))
    rows = list(reader)
    assert len(rows) >= 4  # Header + at least 3 preloaded reqs
    
    headers = rows[0]
    assert "Requirement ID" in headers
    assert "Project ID" in headers
    assert "Requirement Text" in headers
    assert "Status" in headers
    assert "Rubric Score" in headers
    assert "PM Target Value" in headers
    assert "Technical Approver" in headers

    # Verify project isolation
    for r in rows[1:]:
        assert r[1] == "default_project"


def test_export_pdf_default_project():
    """Verify PDF export generates valid binary PDF with PDF signature and headers."""
    response = client.get(
        "/api/requirements/export/pdf?project_id=default_project",
        headers={"X-User-Role": "product_manager"}
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert "default_project_specification.pdf" in response.headers.get("content-disposition", "")
    
    pdf_bytes = response.content
    assert pdf_bytes.startswith(b"%PDF-")
    assert len(pdf_bytes) > 1000  # Non-trivial generated document


def test_export_project_isolation():
    """Verify exporting for proj-flight only returns proj-flight requirements."""
    response_csv = client.get(
        "/api/requirements/export/csv?project_id=proj-flight",
        headers={"X-User-Role": "product_manager"}
    )
    assert response_csv.status_code == 200
    reader = csv.reader(io.StringIO(response_csv.text))
    rows = list(reader)
    assert len(rows) >= 4
    for r in rows[1:]:
        assert r[1] == "proj-flight"
        assert "AERO" in r[0]


def test_export_rbac_executive_filtering():
    """Verify executive role export hides raw FLAGGED_TBD requirements."""
    if not store.get_project("proj-export-rbac"):
        store.create_project(
            project_id="proj-export-rbac",
            project_name="RBAC Export Isolation Test",
            domain="Test",
            description="Testing RBAC visibility"
        )
    from backend.models.schemas import RequirementStatement, RequirementStatus
    store.upsert(RequirementStatement(
        id="REQ-TEST-TBD",
        project_id="proj-export-rbac",
        text="The system shall be fast [TBD: latency_ms].",
        status=RequirementStatus.FLAGGED_TBD
    ))
    store.upsert(RequirementStatement(
        id="REQ-TEST-PROV",
        project_id="proj-export-rbac",
        text="The system shall respond within 50ms provisional.",
        status=RequirementStatus.PROVISIONAL_PM
    ))
    store.upsert(RequirementStatement(
        id="REQ-TEST-LOCK",
        project_id="proj-export-rbac",
        text="The system shall respond within 50ms verified.",
        status=RequirementStatus.LOCKED_BASELINE
    ))

    # Product manager export sees FLAGGED_TBD
    pm_resp = client.get(
        "/api/requirements/export/csv?project_id=proj-export-rbac",
        headers={"X-User-Role": "product_manager"}
    )
    pm_rows = list(csv.reader(io.StringIO(pm_resp.text)))
    pm_req_ids = [r[0] for r in pm_rows[1:]]
    assert "REQ-TEST-TBD" in pm_req_ids

    # Executive export hides FLAGGED_TBD
    exec_resp = client.get(
        "/api/requirements/export/csv?project_id=proj-export-rbac",
        headers={"X-User-Role": "executive"}
    )
    exec_rows = list(csv.reader(io.StringIO(exec_resp.text)))
    exec_req_ids = [r[0] for r in exec_rows[1:]]
    assert "REQ-TEST-TBD" not in exec_req_ids
    assert "REQ-TEST-PROV" in exec_req_ids
    assert "REQ-TEST-LOCK" in exec_req_ids
