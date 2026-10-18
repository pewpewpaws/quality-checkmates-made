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
    RequirementConflictCard,
    QualityScore,
    IntentLockReport,
)
from backend.services.qualcomm_service import QualcommService
from backend.services.storage import store
from backend.services.rubric_engine import rubric_engine
from backend.services.evidence_validator import evidence_validator
from backend.services.intent_lock import intent_lock_validator

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


class ScoreRequest(BaseModel):
    requirement_id: Optional[str] = Field(None, description="Optional ID of existing requirement in store")
    text: Optional[str] = Field(None, description="Direct text to score if requirement_id not provided")
    issues: Optional[List[IssueCard]] = Field(None, description="Optional pre-extracted issues")
    conflicts: Optional[List[RequirementConflictCard]] = Field(None, description="Optional conflict cards")
    run_xray: bool = Field(False, description="Whether to invoke Qualcomm AI100 X-Ray if issues are not provided")


@router.post("/score", response_model=QualityScore)
async def score_requirement_endpoint(payload: ScoreRequest):
    """
    Deterministic 100-Point Rubric Scoring Engine outside the LLM.
    Returns mathematically itemized deduction receipt across Clarity, Verifiability, Completeness, Atomicity, and Consistency.
    """
    target_text = ""
    target_req = None
    if payload.requirement_id:
        target_req = store.get_by_id(payload.requirement_id)
        if not target_req:
            raise HTTPException(status_code=404, detail=f"Requirement '{payload.requirement_id}' not found.")
        target_text = target_req.text
    elif payload.text and payload.text.strip():
        target_text = payload.text.strip()
    else:
        raise HTTPException(status_code=400, detail="Either 'requirement_id' or 'text' must be provided.")

    issues = payload.issues
    if issues is None and target_req and target_req.issues:
        issues = target_req.issues
    elif issues is None and payload.run_xray:
        issues = await qualcomm.extract_xray_issues(target_text)

    score = rubric_engine.calculate_score(target_text, issues=issues, conflicts=payload.conflicts)

    if target_req:
        target_req.quality_score = score
        if issues and not target_req.issues:
            target_req.issues = issues
        store.upsert(target_req)

    return score


@router.post("/xray", response_model=List[IssueCard])
async def analyze_xray(payload: AnalysisRequest):
    """
    Extract requirement defects and verbatim evidence quotes using Qualcomm AI 100 (Llama-3.3-70B).
    Guarantees 100% evidence grounding outside the LLM and calculates initial rubric quality score.
    """
    target_text = resolve_text(payload)
    cards = await qualcomm.extract_xray_issues(target_text)

    # If linked to stored requirement, update its issues list and auto-compute rubric quality score
    if payload.requirement_id:
        req = store.get_by_id(payload.requirement_id)
        if req:
            req.issues = cards
            rubric_engine.score_requirement(req)
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


class IntentLockRequest(BaseModel):
    original: str = Field(..., description="Original requirement statement")
    revised: str = Field(..., description="Candidate rewritten statement to audit")


@router.post("/intent-lock", response_model=IntentLockReport)
async def validate_intent_lock(payload: IntentLockRequest):
    """
    Deterministic Intent-Lock Semantic Diff Validator outside the LLM.
    Audits polarity/negation flips, modal demotions, actor shifts, dropped thresholds, and token-level diff stream.
    """
    return intent_lock_validator.validate(payload.original, payload.revised)



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

