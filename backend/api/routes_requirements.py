from typing import List, Optional, Tuple
from fastapi import APIRouter, HTTPException, Depends, Query
from backend.models.schemas import RequirementStatement, SignOffActionRequest, UserRole
from backend.api.deps import get_user_role, require_write_permission, verify_dual_key_role_action
from backend.services.storage import store

router = APIRouter(prefix="/api/requirements", tags=["Requirements & Dual-Key Governance"])


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
    role: UserRole = Depends(require_write_permission)
):
    """
    Add a new requirement statement.
    Restricted: Executives have read-only access.
    """
    return store.upsert(req, project_id=req.project_id)


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


@router.put("/{req_id}", response_model=RequirementStatement)
async def update_requirement(
    req_id: str,
    updated: RequirementStatement,
    project_id: Optional[str] = Query(None),
    role: UserRole = Depends(require_write_permission)
):
    """
    Update requirement content.
    Restricted: Executives have read-only access.
    """
    existing = store.get_by_id(req_id, project_id=project_id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Requirement '{req_id}' not found.")
    updated.id = req_id
    updated.project_id = existing.project_id
    updated.version = existing.version + 1
    return store.upsert(updated, project_id=existing.project_id)


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

    updated = store.apply_dual_key_transition(
        req_id=req_id,
        action=payload.action,
        pm_author=payload.pm_author,
        pm_target_val=payload.pm_target_val,
        tech_lead_approver=payload.tech_lead_approver,
        hardware_rationale=payload.hardware_rationale,
        project_id=project_id
    )
    if not updated:
        raise HTTPException(status_code=404, detail=f"Requirement '{req_id}' not found.")
    return updated
