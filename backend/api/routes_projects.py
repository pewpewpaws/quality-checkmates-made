from typing import List, Optional, Tuple
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from backend.models.schemas import (
    ProjectWorkspace,
    ProjectSummary,
    ProjectCreateRequest,
    ProjectUpdateRequest,
    ProjectLockRequest,
    ExecutiveCertifyRequest,
    ProjectDocumentContext,
    RequirementStatus,
    UserRole
)
from backend.api.deps import get_user_role, require_write_permission
from backend.services.storage import store

router = APIRouter(prefix="/api/projects", tags=["Multi-Project Workspaces & Context Management"])


@router.get("", response_model=List[ProjectSummary])
async def list_projects():
    """Retrieve all project workspaces with health metrics and sign-off counters."""
    return store.list_projects()


@router.post("", response_model=ProjectWorkspace)
async def create_project(
    payload: ProjectCreateRequest,
    role: UserRole = Depends(require_write_permission)
):
    """
    Create a new isolated project workspace namespace.
    Restricted: Executives cannot create workspaces.
    """
    try:
        return store.create_project(
            project_id=payload.project_id,
            project_name=payload.project_name,
            domain=payload.domain,
            description=payload.description
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{project_id}", response_model=ProjectWorkspace)
async def get_project(project_id: str):
    """Get single project workspace details and attached architecture documents."""
    ws = store.get_project(project_id)
    if not ws:
        raise HTTPException(status_code=404, detail=f"Project workspace '{project_id}' not found.")
    return ws


@router.put("/{project_id}", response_model=ProjectWorkspace)
async def update_project(
    project_id: str,
    payload: ProjectUpdateRequest,
    role: UserRole = Depends(require_write_permission)
):
    """
    Update project workspace metadata.
    Fails if project architecture boundaries are locked (HTTP 423).
    """
    try:
        ws = store.update_project(
            project_id=project_id,
            project_name=payload.project_name,
            domain=payload.domain,
            description=payload.description
        )
        if not ws:
            raise HTTPException(status_code=404, detail=f"Project workspace '{project_id}' not found.")
        return ws
    except ValueError as e:
        raise HTTPException(status_code=423, detail=str(e))


@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    role: UserRole = Depends(require_write_permission)
):
    """Delete project workspace and all contained requirements and documents."""
    deleted = store.delete_project(project_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Project workspace '{project_id}' not found.")
    return {"status": "deleted", "project_id": project_id}


@router.post("/{project_id}/lock", response_model=ProjectWorkspace)
async def toggle_project_lock(
    project_id: str,
    payload: ProjectLockRequest,
    role: UserRole = Depends(require_write_permission)
):
    """
    Lock or unlock project architecture boundaries & safety charter.
    When locked, documents and architecture metadata cannot be modified.
    """
    ws = store.lock_project(
        project_id=project_id,
        is_locked=payload.is_locked,
        locked_by=payload.locked_by or role.value
    )
    if not ws:
        raise HTTPException(status_code=404, detail=f"Project workspace '{project_id}' not found.")
    return ws


# ==========================================
# Document Management within Workspace
# ==========================================

@router.get("/{project_id}/documents", response_model=List[ProjectDocumentContext])
async def list_project_documents(project_id: str):
    """List all architectural charter documents in the workspace."""
    ws = store.get_project(project_id)
    if not ws:
        raise HTTPException(status_code=404, detail=f"Project workspace '{project_id}' not found.")
    return store.get_documents(project_id)


@router.post("/{project_id}/documents", response_model=ProjectWorkspace)
async def add_project_document(
    project_id: str,
    title: str = Form(...),
    category: str = Form("Architecture"),
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
    role: UserRole = Depends(require_write_permission)
):
    """
    Add architecture charter document (file upload or pasted text).
    Fails if project architecture boundaries are locked (HTTP 423).
    """
    ws = store.get_project(project_id)
    if not ws:
        raise HTTPException(status_code=404, detail=f"Project workspace '{project_id}' not found.")
    if ws.is_locked:
        raise HTTPException(
            status_code=423,
            detail=f"Project '{project_id}' architecture boundary is locked. Document modifications are frozen."
        )

    content = ""
    if file:
        file_bytes = await file.read()
        filename = file.filename or ""
        if filename.lower().endswith(".pdf"):
            from pypdf import PdfReader
            import io
            reader = PdfReader(io.BytesIO(file_bytes))
            content = "\n".join([p.extract_text() for p in reader.pages if p.extract_text()])
        else:
            content = file_bytes.decode("utf-8", errors="replace")
    elif text:
        content = text.strip()
    else:
        raise HTTPException(status_code=400, detail="Either 'file' or 'text' must be provided.")

    doc = ProjectDocumentContext(
        title=title,
        content=content,
        category=category
    )
    try:
        return store.add_document(project_id, doc)
    except ValueError as e:
        raise HTTPException(status_code=423, detail=str(e))


@router.delete("/{project_id}/documents/{doc_id}")
async def delete_project_document(
    project_id: str,
    doc_id: str,
    role: UserRole = Depends(require_write_permission)
):
    """
    Delete an architecture charter document from the workspace.
    Fails if project is locked (HTTP 423).
    """
    try:
        deleted = store.delete_document(project_id, doc_id)
        if not deleted:
            raise HTTPException(status_code=404, detail=f"Document '{doc_id}' not found in project '{project_id}'.")
        return {"status": "deleted", "document_id": doc_id, "project_id": project_id}
    except ValueError as e:
        raise HTTPException(status_code=423, detail=str(e))


@router.post("/{project_id}/executive-certify", response_model=ProjectWorkspace)
async def executive_certify_project(
    project_id: str,
    payload: ExecutiveCertifyRequest,
    user_context: Tuple[UserRole, bool] = Depends(get_user_role)
):
    """
    Formally approve and certify the master engineering baseline as Senior Executive / Senior Manager.
    Prerequisite: All requirements in the workspace must be in LOCKED_BASELINE status.
    """
    role, _ = user_context
    if role != UserRole.EXECUTIVE:
        raise HTTPException(status_code=403, detail="Only Senior Executives / Senior Managers can certify the master baseline.")

    ws = store.get_project(project_id)
    if not ws:
        raise HTTPException(status_code=404, detail=f"Project workspace '{project_id}' not found.")

    reqs = store.get_all(project_id)
    if not reqs:
        raise HTTPException(status_code=400, detail="Cannot certify an empty workspace with no requirements.")

    unlocked = [r for r in reqs if r.status != RequirementStatus.LOCKED_BASELINE]
    if unlocked:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot certify baseline: {len(unlocked)} requirement(s) are not yet locked by Lead Systems Engineer ({', '.join(r.id for r in unlocked[:3])})."
        )

    certified_ws = store.certify_project_executive(
        project_id=project_id,
        certified_by=payload.approver_name,
        notes=payload.notes
    )
    return certified_ws


@router.get("/{project_id}/master-test-suite")
async def get_master_test_suite(
    project_id: str,
    user_context: Tuple[UserRole, bool] = Depends(get_user_role)
):
    """
    Retrieve the synthesized Master Test Case Suite for all LOCKED_BASELINE requirements.
    Accessible exclusively to Executives and Systems Engineers.
    """
    ws = store.get_project(project_id)
    if not ws:
        raise HTTPException(status_code=404, detail=f"Project workspace '{project_id}' not found.")

    reqs = store.get_all(project_id)
    locked_reqs = [r for r in reqs if r.status == RequirementStatus.LOCKED_BASELINE]
    
    test_cases_suite = []
    from backend.api.routes_analysis import qualcomm
    import logging
    log = logging.getLogger(__name__)

    for r in locked_reqs:
        bp = r.verification_plan
        if not bp:
            try:
                bp = await qualcomm.generate_verification_blueprint(r.text)
                r.verification_plan = bp
                store.update(r.id, r, project_id=project_id)
            except Exception as e:
                log.warning(f"Could not synthesize blueprint for {r.id}: {e}")
                continue

        test_cases_suite.append({
            "requirement_id": r.id,
            "statement": r.text,
            "category": r.category or "Functional",
            "section": r.section or "System Safety",
            "pm_target_val": r.sign_off.pm_target_val if r.sign_off else None,
            "technical_approver": r.sign_off.tech_lead_approver if r.sign_off else None,
            "hardware_rationale": r.sign_off.hardware_rationale if r.sign_off else None,
            "signed_off_at": r.sign_off.signed_off_at if r.sign_off else None,
            "verification_method": bp.verification_method,
            "preconditions": bp.preconditions,
            "positive_test_case": bp.positive_test_case.model_dump() if hasattr(bp.positive_test_case, 'model_dump') else bp.positive_test_case,
            "negative_boundary_test_case": bp.negative_boundary_test_case.model_dump() if hasattr(bp.negative_boundary_test_case, 'model_dump') else bp.negative_boundary_test_case,
            "acceptance_criteria": bp.acceptance_criteria,
            "model_used": bp.model_used
        })

    is_all_locked = len(locked_reqs) == len(reqs) and len(reqs) > 0

    return {
        "project_id": project_id,
        "project_name": ws.project_name,
        "domain": ws.domain,
        "is_all_locked": is_all_locked,
        "total_requirements": len(reqs),
        "locked_count": len(locked_reqs),
        "pending_count": len(reqs) - len(locked_reqs),
        "executive_certified": getattr(ws, "executive_certified", False),
        "executive_certified_by": getattr(ws, "executive_certified_by", None),
        "executive_certified_at": getattr(ws, "executive_certified_at", None),
        "executive_notes": getattr(ws, "executive_notes", None),
        "test_suite": test_cases_suite
    }
