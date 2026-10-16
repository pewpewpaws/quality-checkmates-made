from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from typing import Optional
from backend.models.schemas import DocumentParseRequest, DocumentParseResponse, UserRole
from backend.api.deps import require_write_permission
from backend.services.document_parser import DocumentParser
from backend.services.storage import store

router = APIRouter(prefix="/api/parse", tags=["Document Ingestion"])


@router.post("/text", response_model=DocumentParseResponse)
async def parse_text(
    payload: DocumentParseRequest,
    role: UserRole = Depends(require_write_permission)
):
    """
    Parse raw text, numbered lists, or REQ-tagged strings into atomic requirement statements.
    Restricted: Executives have read-only access.
    """
    if not payload.text or not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text payload cannot be empty.")

    category = payload.category or "Functional"
    target_project = payload.project_id or "default_project"
    reqs, format_detected = DocumentParser.parse_text(payload.text, default_category=category)
    for r in reqs:
        r.project_id = target_project
    store.bulk_add(reqs, project_id=target_project)

    return DocumentParseResponse(
        total_parsed=len(reqs),
        requirements=reqs,
        format_detected=format_detected
    )


@router.post("/file", response_model=DocumentParseResponse)
async def parse_file(
    file: UploadFile = File(...),
    category: Optional[str] = Form("Functional"),
    project_id: Optional[str] = Form("default_project"),
    role: UserRole = Depends(require_write_permission)
):
    """
    Upload and parse CSV, TXT, or PDF requirement documents.
    Restricted: Executives have read-only access.
    """
    filename = file.filename or ""
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    category_str = category or "Functional"
    target_project = project_id or "default_project"

    if filename.lower().endswith(".csv"):
        reqs = DocumentParser.parse_csv(content, default_category=category_str)
        format_detected = "csv"
    elif filename.lower().endswith(".pdf"):
        reqs, format_detected = DocumentParser.parse_pdf(content, default_category=category_str)
    else:
        # Default to TXT / Markdown
        text = content.decode("utf-8", errors="replace")
        reqs, format_detected = DocumentParser.parse_text(text, default_category=category_str)

    for r in reqs:
        r.project_id = target_project
    store.bulk_add(reqs, project_id=target_project)

    return DocumentParseResponse(
        total_parsed=len(reqs),
        requirements=reqs,
        format_detected=format_detected
    )
