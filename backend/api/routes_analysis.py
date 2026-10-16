from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
from backend.models.schemas import (
    IssueCard,
    InterpretationDuel,
    RewriteSuggestion,
    VerificationPlan,
    RequirementStatement,
    SemanticDuplicateMatch,
    ConflictRadarRequest,
    ConflictRadarResponse,
)
from backend.services.qualcomm_service import QualcommService
from backend.services.storage import store

router = APIRouter(prefix="/api/analysis", tags=["Qualcomm AI100 Quality Pipelines"])
qualcomm = QualcommService()


class SemanticDuplicateRequest(BaseModel):
    project_id: Optional[str] = "default_project"
    requirements: Optional[List[RequirementStatement]] = None
    similarity_threshold: float = Field(0.85, ge=0.5, le=1.0)



class AnalysisRequest(BaseModel):
    requirement_id: Optional[str] = Field(None, description="Optional ID of existing requirement in store")
    text: Optional[str] = Field(None, description="Direct text to analyze if requirement_id not provided")


def resolve_text(payload: AnalysisRequest) -> str:
    if payload.requirement_id:
        req = store.get_by_id(payload.requirement_id)
        if not req:
            raise HTTPException(status_code=404, detail=f"Requirement '{payload.requirement_id}' not found.")
        return req.text
    if payload.text and payload.text.strip():
        return payload.text.strip()
    raise HTTPException(status_code=400, detail="Either 'requirement_id' or 'text' must be provided.")


@router.post("/xray", response_model=List[IssueCard])
async def analyze_xray(payload: AnalysisRequest):
    """
    Extract requirement defects and verbatim evidence quotes using Qualcomm AI 100 (Llama-3.3-70B).
    """
    target_text = resolve_text(payload)
    cards = await qualcomm.extract_xray_issues(target_text)

    # If linked to stored requirement, update its issues list
    if payload.requirement_id:
        req = store.get_by_id(payload.requirement_id)
        if req:
            req.issues = cards
            store.upsert(req)

    return cards


@router.post("/duel", response_model=InterpretationDuel)
async def stage_duel(payload: AnalysisRequest):
    """
    Formulate two competing technical interpretations using Qualcomm AI 100 (Llama-3.1-8B).
    """
    target_text = resolve_text(payload)
    duel = await qualcomm.stage_interpretation_duel(target_text)

    if payload.requirement_id:
        req = store.get_by_id(payload.requirement_id)
        if req:
            req.duel = duel
            store.upsert(req)

    return duel


@router.post("/rewrite", response_model=RewriteSuggestion)
async def rewrite_requirement(payload: AnalysisRequest):
    """
    Generate EARS-compliant rewrite strictly preserving [TBD: ...] placeholders + Smart Suggested Defaults.
    """
    target_text = resolve_text(payload)
    suggestion = await qualcomm.rewrite_with_smart_defaults(target_text)

    if payload.requirement_id:
        req = store.get_by_id(payload.requirement_id)
        if req:
            req.rewrite_suggestion = suggestion
            store.upsert(req)

    return suggestion


@router.post("/blueprint", response_model=VerificationPlan)
async def generate_blueprint(payload: AnalysisRequest):
    """
    Generate audit-ready Verification Blueprint test plan and falsifiable criteria (Llama-3.3-70B).
    """
    target_text = resolve_text(payload)
    blueprint = await qualcomm.generate_verification_blueprint(target_text)

    if payload.requirement_id:
        req = store.get_by_id(payload.requirement_id)
        if req:
            req.verification_plan = blueprint
            store.upsert(req)

    return blueprint


@router.post("/conflicts", response_model=ConflictRadarResponse)
async def analyze_conflicts(payload: ConflictRadarRequest):
    """
    Detect logical, timing, or operational contradictions between a requirement and candidate requirements using Llama-3.3-70B.
    """
    candidates = payload.candidate_requirements or []
    target_req = None

    if payload.target_req_id:
        target_req = store.get_by_id(payload.target_req_id, project_id=payload.project_id)
        if not target_req:
            raise HTTPException(status_code=404, detail=f"Target requirement '{payload.target_req_id}' not found.")
    elif payload.target_text:
        target_req = RequirementStatement(
            id="REQ-TARGET",
            text=payload.target_text.strip(),
            category="Target Requirement"
        )
    else:
        raise HTTPException(status_code=400, detail="Either 'target_req_id' or 'target_text' must be provided.")

    if not candidates and payload.project_id:
        all_proj_reqs = store.list_all(project_id=payload.project_id)
        candidates = [r for r in all_proj_reqs if r.id != target_req.id]

    return await qualcomm.detect_conflicts(target_req, candidates)


@router.post("/semantic-duplicates", response_model=List[SemanticDuplicateMatch])
async def analyze_semantic_duplicates(payload: SemanticDuplicateRequest):
    """
    Detect semantically equivalent requirements using BAAI/bge-large-en-v1.5 dense vector embeddings.
    """
    reqs = payload.requirements
    if not reqs and payload.project_id:
        reqs = store.list_all(project_id=payload.project_id)
    if not reqs or len(reqs) < 2:
        return []
    return await qualcomm.find_semantic_duplicates(reqs, similarity_threshold=payload.similarity_threshold)

