from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional, List
from backend.models.schemas import (
    ProjectContext,
    ProjectDocumentContext,
    ChatRequirementRequest,
    ChatRequirementResponse,
    RequirementStatement
)
from backend.services.qualcomm_service import QualcommService
from backend.services.document_parser import DocumentParser
from backend.services.storage import store

router = APIRouter(prefix="/api/chat", tags=["Conversational Requirement Copilot"])
qualcomm = QualcommService()


@router.get("/context", response_model=ProjectContext)
async def get_project_context(project_id: str = "default_project"):
    """Fetch active project architecture charter, domain, and attached documents."""
    ctx = store.get_project_context(project_id)
    if not ctx:
        raise HTTPException(status_code=404, detail=f"Project context '{project_id}' not found.")
    return ctx


@router.post("/context", response_model=ProjectContext)
async def update_project_context(payload: ProjectContext):
    """Set or update project documentation context and engineering safety constraints."""
    return store.set_project_context(payload)


@router.post("/context/document", response_model=ProjectContext)
async def upload_context_document(
    title: str = Form(...),
    category: str = Form("Architecture"),
    project_id: str = Form("default_project"),
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None)
):
    """
    Attach an architectural document or charter file (TXT, CSV, PDF, or raw text) to the project context.
    """
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
    return store.add_document_to_context(project_id, doc)


@router.post("/message", response_model=ChatRequirementResponse)
async def chat_synthesize_requirements(payload: ChatRequirementRequest):
    """
    Conversational Copilot: Product Manager types plain-language ideas/requirements.
    Copilot synthesizes formal, EARS-compliant requirements grounded in uploaded project documentation,
    preserving [TBD: ...] placeholders with Smart Suggested Defaults.
    """
    ctx = store.get_project_context(payload.project_id or "default_project")
    context_str = ""
    if ctx:
        doc_summaries = "\n---\n".join([f"[{d.title} ({d.category})]:\n{d.content}" for d in ctx.documents])
        context_str = f"Project: {ctx.project_name}\nDomain: {ctx.domain}\nDescription: {ctx.description}\n\nDocuments:\n{doc_summaries}"

    history_dicts = [{"role": m.role, "content": m.content} for m in payload.conversation_history]
    next_idx = len(store.get_all()) + 1

    agent_reply, reqs, grounding = await qualcomm.generate_requirements_from_chat(
        pm_message=payload.message,
        project_context=context_str,
        conversation_history=history_dicts,
        next_req_index=next_idx
    )

    if payload.save_to_store and reqs:
        store.bulk_add(reqs)

    return ChatRequirementResponse(
        agent_reply=agent_reply,
        generated_requirements=reqs,
        context_grounding=grounding
    )
