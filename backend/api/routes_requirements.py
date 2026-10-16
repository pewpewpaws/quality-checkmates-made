from fastapi import APIRouter, HTTPException
from typing import List
from backend.models.schemas import RequirementStatement, SignOffActionRequest
from backend.services.storage import store

router = APIRouter(prefix="/api/requirements", tags=["Requirements & Dual-Key Governance"])


@router.get("", response_model=List[RequirementStatement])
async def list_requirements():
    """Retrieve all ingested requirements and their current governance states."""
    return store.get_all()


@router.post("", response_model=RequirementStatement)
async def create_requirement(req: RequirementStatement):
    """Add a new requirement statement."""
    return store.upsert(req)


@router.get("/{req_id}", response_model=RequirementStatement)
async def get_requirement(req_id: str):
    """Get single requirement statement by ID."""
    req = store.get_by_id(req_id)
    if not req:
        raise HTTPException(status_code=404, detail=f"Requirement '{req_id}' not found.")
    return req


@router.put("/{req_id}", response_model=RequirementStatement)
async def update_requirement(req_id: str, updated: RequirementStatement):
    """Update requirement content."""
    existing = store.get_by_id(req_id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Requirement '{req_id}' not found.")
    updated.id = req_id
    updated.version = existing.version + 1
    return store.upsert(updated)


@router.delete("/{req_id}")
async def delete_requirement(req_id: str):
    """Delete a requirement by ID."""
    success = store.delete(req_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Requirement '{req_id}' not found.")
    return {"status": "deleted", "id": req_id}


@router.post("/{req_id}/sign-off", response_model=RequirementStatement)
async def dual_key_sign_off(req_id: str, payload: SignOffActionRequest):
    """
    Execute Dual-Key Governance lifecycle transitions:
    - provisional_pm: Product Manager specifies provisional parameter value (🟡 PROVISIONAL_PM)
    - lock_baseline: Lead Systems Engineer grants technical sign-off (🟢 LOCKED_BASELINE)
    - flag_tbd: Mark as unverified or requiring refinement (🔴 FLAGGED_TBD)
    - reject: Reject requirement statement
    """
    updated = store.apply_dual_key_transition(
        req_id=req_id,
        action=payload.action,
        pm_author=payload.pm_author,
        pm_target_val=payload.pm_target_val,
        tech_lead_approver=payload.tech_lead_approver,
        hardware_rationale=payload.hardware_rationale,
    )
    if not updated:
        raise HTTPException(status_code=404, detail=f"Requirement '{req_id}' not found.")
    return updated
