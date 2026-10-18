import re
import logging
from typing import List, Optional, Tuple, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Query, Response
from backend.models.schemas import (
    RequirementStatement,
    SignOffActionRequest,
    RequirementStatus,
    UserRole,
    SemanticDuplicateMatch,
    ConflictRadarResponse,
    QualityScore,
)
from backend.api.deps import get_user_role, require_write_permission, verify_dual_key_role_action
from backend.services.storage import store
from backend.services.qualcomm_service import QualcommService
from backend.services.rubric_engine import rubric_engine
from backend.services.export_service import export_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/requirements", tags=["Requirements & Dual-Key Governance"])
qualcomm = QualcommService()


@router.get("/export/csv")
async def export_requirements_csv(
    project_id: str = Query("default_project", description="Target project workspace ID"),
    status: Optional[RequirementStatus] = Query(None, description="Optional status filter"),
    user_context: Tuple[UserRole, bool] = Depends(get_user_role)
):
    """
    Export project requirements to RFC 4180 CSV format (Phase 2.5).
    Hierarchical RBAC: Executives are shielded from raw DRAFT or FLAGGED_TBD requirements.
    """
    role, _ = user_context
    reqs = store.get_all(project_id=project_id, role=role)
    if status:
        reqs = [r for r in reqs if r.status == status]
    
    csv_data = export_service.to_csv(reqs)
    filename = f"{project_id}_requirements.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@router.get("/export/pdf")
async def export_requirements_pdf(
    project_id: str = Query("default_project", description="Target project workspace ID"),
    status: Optional[RequirementStatus] = Query(None, description="Optional status filter"),
    user_context: Tuple[UserRole, bool] = Depends(get_user_role)
):
    """
    Export project requirements to a publication-grade structured PDF engineering specification (Phase 2.5).
    Hierarchical RBAC: Executives only receive approved baselines.
    """
    role, _ = user_context
    reqs = store.get_all(project_id=project_id, role=role)
    if status:
        reqs = [r for r in reqs if r.status == status]
    
    workspace = store.get_project(project_id)
    pdf_bytes = export_service.to_pdf(requirements=reqs, project=workspace)
    filename = f"{project_id}_specification.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@router.get("", response_model=List[RequirementStatement])
async def list_requirements(
    project_id: Optional[str] = Query("default_project", description="Project workspace ID"),
    user_context: Tuple[UserRole, bool] = Depends(get_user_role)
):
    """
    Retrieve ingested requirements and their current governance states.
    - Product Managers & Systems Engineers see all states (DRAFT, FLAGGED_TBD, PROVISIONAL_PM, LOCKED_BASELINE).
    - Executives only see PM-Approved (PROVISIONAL_PM 🟡) or Signed-off (LOCKED_BASELINE 🟢) baselines.
    """
    role, _ = user_context
    return store.get_all(project_id=project_id, role=role)


@router.post("", response_model=RequirementStatement)
async def create_requirement(
    req: RequirementStatement,
    allow_duplicate: bool = Query(False, description="Allow duplicate requirement creation (false by default)"),
    auto_enrich: bool = Query(True, description="Automatically enrich new requirements with AI flaw extraction"),
    role: UserRole = Depends(require_write_permission)
):
    """
    Add a new requirement statement.
    Restricted: Executives have read-only access.
    Automatically enriches new requirements using Qualcomm AI 100 flaw extraction and rubric scoring.
    """
    # 1. Automatic AI Processing for new requirements
    if auto_enrich and not req.issues:
        try:
            req.issues = await qualcomm.extract_xray_issues(req.text)
        except Exception as e:
            logger.warning(f"Auto AI X-Ray extraction skipped: {e}")

    if not req.quality_score:
        req.quality_score = rubric_engine.calculate_score(req.text, req.issues)

    # 2. Check TBD parameter state
    tbd_matches = re.findall(r"\[TBD:[^\]]+\]", req.text)
    unbound_tbds = [t for t in tbd_matches if "=" not in t]
    has_pm_value = bool(req.sign_off and req.sign_off.pm_target_val and req.sign_off.pm_target_val.strip())

    if unbound_tbds and not has_pm_value:
        req.status = RequirementStatus.FLAGGED_TBD
    elif req.status in (RequirementStatus.DRAFT, None):
        req.status = RequirementStatus.PROVISIONAL_PM

    try:
        return store.upsert(req, project_id=req.project_id, allow_duplicate=allow_duplicate)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))


@router.get("/duplicates", response_model=List[Dict[str, Any]])
async def check_duplicate_requirements(
    project_id: str = Query("default_project", description="Target project workspace"),
    threshold: float = Query(0.70, ge=0.5, le=1.0, description="Similarity threshold (0.5 - 1.0)"),
    user_context: Tuple[UserRole, bool] = Depends(get_user_role)
):
    """
    Detect exact and near-duplicate requirement statements within a project workspace (lexical).
    """
    return store.find_duplicates(project_id=project_id, similarity_threshold=threshold)


@router.get("/duplicates/semantic", response_model=List[SemanticDuplicateMatch])
async def check_semantic_duplicate_requirements(
    project_id: str = Query("default_project", description="Target project workspace"),
    threshold: float = Query(0.85, ge=0.5, le=1.0, description="Cosine similarity threshold (0.5 - 1.0)"),
    user_context: Tuple[UserRole, bool] = Depends(get_user_role)
):
    """
    Detect semantically equivalent requirements within a project using dense embeddings (bge-large on Qualcomm AI100).
    """
    reqs = store.list_all(project_id=project_id)
    return await qualcomm.find_semantic_duplicates(reqs, similarity_threshold=threshold)


@router.get("/conflicts", response_model=ConflictRadarResponse)
async def check_project_conflicts(
    project_id: str = Query("default_project", description="Target project workspace"),
    user_context: Tuple[UserRole, bool] = Depends(get_user_role)
):
    """
    Scan all requirements in a project workspace for mutual contradictions using Conflict Radar (Llama-3.3-70B on Qualcomm AI100).
    """
    reqs = store.list_all(project_id=project_id)
    return await qualcomm.detect_project_conflicts(reqs)



@router.get("/{req_id}", response_model=RequirementStatement)
async def get_requirement(
    req_id: str,
    project_id: Optional[str] = Query(None, description="Optional project workspace ID"),
    user_context: Tuple[UserRole, bool] = Depends(get_user_role)
):
    """
    Get single requirement statement by ID.
    Restricted: Executives are shielded from raw DRAFT or FLAGGED_TBD requirements.
    """
    role, _ = user_context
    req = store.get_by_id(req_id, project_id=project_id, role=role)
    if not req:
        # Check if it exists but is shielded from executive view
        raw_req = store.get_by_id(req_id, project_id=project_id, role=UserRole.PRODUCT_MANAGER)
        if raw_req and role == UserRole.EXECUTIVE:
            raise HTTPException(
                status_code=403,
                detail=f"Requirement '{req_id}' is in '{raw_req.status.value}' state and hidden from Executive review."
            )
        raise HTTPException(status_code=404, detail=f"Requirement '{req_id}' not found.")
    return req


@router.get("/{req_id}/score", response_model=QualityScore)
async def get_requirement_quality_score(
    req_id: str,
    project_id: Optional[str] = Query(None, description="Optional project workspace ID"),
    user_context: Tuple[UserRole, bool] = Depends(get_user_role)
):
    """
    Compute and retrieve the deterministic 100-point rubric score for a stored requirement.
    """
    role, _ = user_context
    req = store.get_by_id(req_id, project_id=project_id, role=role)
    if not req:
        raise HTTPException(status_code=404, detail=f"Requirement '{req_id}' not found.")
    
    score = rubric_engine.calculate_score(req.text, issues=req.issues)
    return score


@router.post("/{req_id}/score", response_model=RequirementStatement)
async def recalculate_and_save_score(
    req_id: str,
    project_id: Optional[str] = Query(None, description="Optional project workspace ID"),
    role: UserRole = Depends(require_write_permission)
):
    """
    Recalculate rubric quality score and persist it into the requirement store.
    """
    req = store.get_by_id(req_id, project_id=project_id)
    if not req:
        raise HTTPException(status_code=404, detail=f"Requirement '{req_id}' not found.")
    
    rubric_engine.score_requirement(req)
    store.upsert(req, project_id=req.project_id)
    return req


@router.put("/{req_id}", response_model=RequirementStatement)
async def update_requirement(
    req_id: str,
    updated: RequirementStatement,
    project_id: Optional[str] = Query(None),
    allow_duplicate: bool = Query(False, description="Allow duplicate requirement update (false by default)"),
    role: UserRole = Depends(require_write_permission)
):
    """
    Update requirement content.
    Restricted: Executives have read-only access.
    Strictly prevents duplicate requirement text by default (HTTP 409).
    """
    existing = store.get_by_id(req_id, project_id=project_id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Requirement '{req_id}' not found.")
    updated.id = req_id
    updated.project_id = existing.project_id
    updated.version = existing.version + 1

    # Dual-Key Governance Enforcement:
    # 1. Unbound [TBD] parameters (without '=') with no pm_target_val -> FLAGGED_TBD (red 🔴).
    # 2. When PM provides or updates a value for TBD ([TBD: param = value]):
    #    keep it strictly as PROVISIONAL_PM (yellow 🟡) so it does not confuse the PM.
    # 3. Only Lead Systems Engineer sign-off can lock baseline (green 🟢).
    tbd_matches = re.findall(r"\[TBD:[^\]]+\]", updated.text) or (["[TBD]"] if "[TBD]" in updated.text else [])
    unbound_tbds = [t for t in tbd_matches if "=" not in t]
    has_pm_value = bool(updated.sign_off and updated.sign_off.pm_target_val and updated.sign_off.pm_target_val.strip())

    text_changed = (updated.text.strip() != existing.text.strip())

    if unbound_tbds and not has_pm_value:
        updated.status = RequirementStatus.FLAGGED_TBD
        if updated.sign_off:
            updated.sign_off.tech_lead_approver = None
            updated.sign_off.hardware_rationale = None
            updated.sign_off.signed_off_at = None
            updated.sign_off.state = RequirementStatus.FLAGGED_TBD
    else:
        # If all TBDs have assigned values (or no TBDs), requirement is strictly PROVISIONAL_PM (yellow)
        # unless it was already LOCKED_BASELINE and the text did not change at all.
        if text_changed or existing.status != RequirementStatus.LOCKED_BASELINE:
            updated.status = RequirementStatus.PROVISIONAL_PM
            if updated.sign_off:
                updated.sign_off.tech_lead_approver = None
                updated.sign_off.hardware_rationale = None
                updated.sign_off.signed_off_at = None
                updated.sign_off.state = RequirementStatus.PROVISIONAL_PM

    # Automatically recompute deterministic rubric score when text changes
    if text_changed:
        updated.quality_score = rubric_engine.calculate_score(updated.text, issues=updated.issues)

    try:
        return store.upsert(updated, project_id=existing.project_id, allow_duplicate=allow_duplicate)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))


@router.delete("/{req_id}")
async def delete_requirement(
    req_id: str,
    project_id: Optional[str] = Query(None),
    role: UserRole = Depends(require_write_permission)
):
    """
    Delete a requirement by ID.
    Restricted: Executives have read-only access.
    """
    success = store.delete(req_id, project_id=project_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Requirement '{req_id}' not found.")
    return {"status": "deleted", "id": req_id}


@router.post("/{req_id}/sign-off", response_model=RequirementStatement)
async def dual_key_sign_off(
    req_id: str,
    payload: SignOffActionRequest,
    project_id: Optional[str] = Query(None),
    user_context: Tuple[UserRole, bool] = Depends(get_user_role)
):
    """
    Execute Dual-Key Governance lifecycle transitions:
    - provisional_pm: Product Manager specifies provisional parameter value (🟡 PROVISIONAL_PM)
    - lock_baseline: Lead Systems Engineer grants technical sign-off (🟢 LOCKED_BASELINE)
    - flag_tbd: Mark as unverified or requiring refinement (🔴 FLAGGED_TBD)
    - reject: Reject requirement statement

    Enterprise RBAC Policy:
    - Executives: 403 Forbidden on all transitions.
    - Product Managers: cannot perform 'lock_baseline' without Systems Engineer sign-off.
    - Systems Engineers: cannot perform 'provisional_pm'.
    """
    verify_dual_key_role_action(payload.action, user_context)

    try:
        updated = store.apply_dual_key_transition(
            req_id=req_id,
            action=payload.action,
            pm_author=payload.pm_author,
            pm_target_val=payload.pm_target_val,
            tech_lead_approver=payload.tech_lead_approver,
            hardware_rationale=payload.hardware_rationale,
            project_id=project_id
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    if not updated:
        raise HTTPException(status_code=404, detail=f"Requirement '{req_id}' not found.")
    return updated


@router.delete("/{req_id}")
async def delete_requirement(
    req_id: str,
    project_id: Optional[str] = Query(None, description="Optional project workspace ID"),
    user_context: Tuple[UserRole, bool] = Depends(get_user_role)
):
    """
    Delete a single requirement statement from the active project workspace.
    Restricted: Executives are read-only.
    """
    role, _ = user_context
    if role == UserRole.EXECUTIVE:
        raise HTTPException(status_code=403, detail="Executive role is strictly read-only.")

    deleted = store.delete(req_id, project_id=project_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Requirement '{req_id}' not found.")
    return {"status": "deleted", "id": req_id}

