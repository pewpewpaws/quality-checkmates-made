import re
import asyncio
import logging
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from typing import Optional, List
from backend.models.schemas import DocumentParseRequest, DocumentParseResponse, UserRole, RequirementStatus, RequirementStatement
from backend.api.deps import require_write_permission
from backend.services.document_parser import DocumentParser
from backend.services.storage import store
from backend.services.qualcomm_service import QualcommService
from backend.services.rubric_engine import RubricScoringEngine

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/parse", tags=["Document Ingestion"])
qualcomm = QualcommService()
rubric_engine = RubricScoringEngine()


async def enrich_requirement_with_ai(req: RequirementStatement) -> RequirementStatement:
    """Automatically run Qualcomm AI 100 flaw extraction and rubric scoring for newly ingested requirements."""
    if not req.issues:
        try:
            req.issues = await qualcomm.extract_xray_issues(req.text)
        except Exception as e:
            logger.warning(f"Auto AI X-Ray extraction on parse failed for {req.id}: {e}")
            req.issues = []

    if not req.quality_score:
        req.quality_score = rubric_engine.calculate_score(req.text, req.issues)

    tbd_matches = re.findall(r"\[TBD:[^\]]+\]", req.text) or (["[TBD]"] if "[TBD]" in req.text else [])
    unbound_tbds = [t for t in tbd_matches if "=" not in t]
    has_pm_value = bool(req.sign_off and req.sign_off.pm_target_val and req.sign_off.pm_target_val.strip())

    if unbound_tbds and not has_pm_value:
        req.status = RequirementStatus.FLAGGED_TBD
    elif req.status in (RequirementStatus.DRAFT, None):
        req.status = RequirementStatus.PROVISIONAL_PM

    return req


@router.post("/text", response_model=DocumentParseResponse)
async def parse_text(
    payload: DocumentParseRequest,
    role: UserRole = Depends(require_write_permission)
):
    """
    Parse raw text, numbered lists, or REQ-tagged strings into atomic requirement statements.
    Automatically enriches parsed statements with AI flaw extraction and rubric scoring.
    Restricted: Executives have read-only access.
    """
    if not payload.text or not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text payload cannot be empty.")

    category = payload.category or "Functional"
    target_project = payload.project_id or "default_project"
    reqs, format_detected = DocumentParser.parse_text(payload.text, default_category=category)
    for r in reqs:
        r.project_id = target_project

    # Automatic AI processing for parsed requirements
    await asyncio.gather(*[enrich_requirement_with_ai(r) for r in reqs])

    saved = store.bulk_add(reqs, project_id=target_project)

    return DocumentParseResponse(
        total_parsed=len(saved),
        requirements=saved,
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
    Automatically enriches parsed statements with AI flaw extraction and rubric scoring.
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

    # Automatic AI processing for parsed requirements
    await asyncio.gather(*[enrich_requirement_with_ai(r) for r in reqs])

    saved = store.bulk_add(reqs, project_id=target_project)

    return DocumentParseResponse(
        total_parsed=len(saved),
        requirements=saved,
        format_detected=format_detected
    )
