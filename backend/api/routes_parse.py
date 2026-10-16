from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
from backend.models.schemas import DocumentParseRequest, DocumentParseResponse
from backend.services.document_parser import DocumentParser
from backend.services.storage import store

router = APIRouter(prefix="/api/parse", tags=["Document Ingestion"])


@router.post("/text", response_model=DocumentParseResponse)
async def parse_text(payload: DocumentParseRequest):
    """
    Parse raw text, numbered lists, or REQ-tagged strings into atomic requirement statements.
    """
    if not payload.text or not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text payload cannot be empty.")

    category = payload.category or "Functional"
    reqs, format_detected = DocumentParser.parse_text(payload.text, default_category=category)
    store.bulk_add(reqs)

    return DocumentParseResponse(
        total_parsed=len(reqs),
        requirements=reqs,
        format_detected=format_detected
    )


@router.post("/file", response_model=DocumentParseResponse)
async def parse_file(
    file: UploadFile = File(...),
    category: Optional[str] = Form("Functional")
):
    """
    Upload and parse CSV, TXT, or PDF requirement documents.
    """
    filename = file.filename or ""
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    category_str = category or "Functional"

    if filename.lower().endswith(".csv"):
        reqs = DocumentParser.parse_csv(content, default_category=category_str)
        format_detected = "csv"
    elif filename.lower().endswith(".pdf"):
        reqs, format_detected = DocumentParser.parse_pdf(content, default_category=category_str)
    else:
        # Default to TXT / Markdown
        text = content.decode("utf-8", errors="replace")
        reqs, format_detected = DocumentParser.parse_text(text, default_category=category_str)

    store.bulk_add(reqs)

    return DocumentParseResponse(
        total_parsed=len(reqs),
        requirements=reqs,
        format_detected=format_detected
    )
