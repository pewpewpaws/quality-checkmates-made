from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from backend.models.schemas import (
    ProjectWorkspace,
    ProjectSummary,
    ProjectCreateRequest,
    ProjectUpdateRequest,
    ProjectLockRequest,
    ProjectDocumentContext,
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
