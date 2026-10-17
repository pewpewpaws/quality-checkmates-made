from __future__ import annotations
import uuid
from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field


class UserRole(str, Enum):
    PRODUCT_MANAGER = "product_manager"
    SYSTEMS_ENGINEER = "systems_engineer"
    EXECUTIVE = "executive"


class RequirementStatus(str, Enum):
    DRAFT = "DRAFT"
    FLAGGED_TBD = "FLAGGED_TBD"          # 🔴 Found flaws or unstated parameters
    PROVISIONAL_PM = "PROVISIONAL_PM"    # 🟡 PM set provisional value
    LOCKED_BASELINE = "LOCKED_BASELINE"  # 🟢 Tech lead approved, fully verified
    REJECTED = "REJECTED"


class IssueSeverity(str, Enum):
    BLOCKER = "Blocker"
    MAJOR = "Major"
    MINOR = "Minor"


class IssueType(str, Enum):
    AMBIGUITY = "Ambiguity"
    UNVERIFIABILITY = "Unverifiability"
    INCOMPLETENESS = "Incompleteness"
    NON_ATOMIC = "Non-atomic"
    ESCAPE_HATCH = "Escape-hatch"
    OVER_SPECIFICATION = "Over-specification"
    CONSISTENCY = "Consistency"


class DualKeySignOff(BaseModel):
    requirement_id: str
    pm_target_val: Optional[str] = Field(
        None, description="Provisional parameter value entered by Product Manager"
    )
    pm_author: Optional[str] = Field(
        None, description="PM identity who submitted provisional baseline"
    )
    tech_lead_approver: Optional[str] = Field(
        None, description="Lead Systems Engineer who approved technical sign-off"
    )
    hardware_rationale: Optional[str] = Field(
        None, description="Engineering/Hardware justification for approved parameters"
    )
    signed_off_at: Optional[datetime] = Field(
        None, description="Timestamp when baseline was formally locked"
    )
    state: RequirementStatus = Field(
        RequirementStatus.FLAGGED_TBD,
        description="Current dual-key lifecycle state"
    )


class IssueCard(BaseModel):
    issue_type: str = Field(..., description="Classification of requirement defect")
    severity: str = Field(..., description="Blocker, Major, or Minor / HIGH, MEDIUM, LOW")
    evidence_quote: str = Field(..., description="Exact case-sensitive substring from source")
    explanation: str = Field(..., description="Why this constitutes a quality flaw")
    suggested_action: str = Field(..., description="Actionable recommendation to resolve flaw")
    start_offset: Optional[int] = Field(None, description="0-indexed start character index in source text")
    end_offset: Optional[int] = Field(None, description="0-indexed end character index in source text")
    is_grounded: bool = Field(True, description="Whether evidence quote is strictly grounded in source")


class QualityScore(BaseModel):
    overall: float = Field(..., ge=0, le=100, description="Overall rubric quality score (0-100)")
    clarity: float = Field(..., ge=0, le=25, description="Clarity subscore (0-25)")
    verifiability: float = Field(..., ge=0, le=25, description="Verifiability subscore (0-25)")
    completeness: float = Field(..., ge=0, le=20, description="Completeness subscore (0-20)")
    atomicity: float = Field(..., ge=0, le=15, description="Atomicity subscore (0-15)")
    consistency: float = Field(..., ge=0, le=15, description="Consistency subscore (0-15)")
    receipt: List[str] = Field(default_factory=list, description="Mathematical deduction audit trace")


class TbdDefault(BaseModel):
    parameter_name: str = Field(..., description="Identifier matching [TBD: <parameter_name>]")
    suggested_value: str = Field(..., description="Engineering standard default value")
    rationale: str = Field(..., description="Technical rationale citing baseline or standard")
    confidence: Literal["HIGH", "MEDIUM", "LOW"] = Field("MEDIUM", description="Confidence level")


class DiffTokenType(str, Enum):
    PRESERVED = "PRESERVED"
    ADDED = "ADDED"
    REMOVED = "REMOVED"
    TBD_PARAMETERIZED = "TBD_PARAMETERIZED"
    MODAL_UPGRADED = "MODAL_UPGRADED"
    MODAL_DOWNGRADED = "MODAL_DOWNGRADED"
    NEGATION_DRIFT = "NEGATION_DRIFT"


class DiffToken(BaseModel):
    text: str
    token_type: DiffTokenType
    note: Optional[str] = None


class IntentLockReport(BaseModel):
    passed: bool = Field(..., description="True if no critical semantic drift detected")
    semantic_drift_detected: bool = Field(..., description="True if critical intent change was detected")
    drift_warnings: List[str] = Field(default_factory=list, description="Specific drift warning messages")
    negation_preserved: bool = Field(True, description="Whether negative obligations (shall not) are preserved")
    modal_verb_preserved: bool = Field(True, description="Whether modal binding strength was not downgraded")
    actor_preserved: bool = Field(True, description="Whether the actor/system subject is preserved")
    thresholds_preserved: bool = Field(True, description="Whether numerical limits were parameterized rather than dropped")
    diff_tokens: List[DiffToken] = Field(default_factory=list, description="Token-level diff stream for UI diff viewer")
    audit_summary: str = Field(..., description="Human-readable engineering verification summary")


class RewriteSuggestion(BaseModel):
    original: str = Field(..., description="Source requirement text")
    revised: str = Field(..., description="Strict EARS/ISO formatted text preserving [TBD: ...] tokens")
    rationale: str = Field(..., description="Systems engineering rationale for the rewrite")
    identified_tbds: List[TbdDefault] = Field(
        default_factory=list,
        description="1-click actionable UI chips for PM/Engineer resolution"
    )
    intent_lock: Optional[IntentLockReport] = Field(
        None,
        description="Automated Intent-Lock verification and semantic drift report"
    )
    model_used: Optional[str] = Field(None, description="Qualcomm AI model used for rewrite")
    cascaded: bool = Field(False, description="Whether 8B -> 70B cascade was triggered")


class DuelCard(BaseModel):
    title: str = Field(..., description="Persona or architecture interpretation title")
    stance: str = Field(..., description="Summary stance (e.g., Best-effort vs Guaranteed)")
    technical_spec: str = Field(..., description="Precise technical behavior under this interpretation")
    architectural_impact: str = Field(..., description="Downstream impact on compute, memory, latency, safety")


class InterpretationDuel(BaseModel):
    flaw_quote: str = Field(..., description="Exact ambiguous phrase triggering duel")
    flaw_type: str = Field(..., description="Underlying defect causing ambiguity")
    card_a: DuelCard
    card_b: DuelCard
    contrast_score: float = Field(1.0, description="Divergence score between Card A and B (0.0 to 1.0)")
    model_used: Optional[str] = Field(None, description="Qualcomm AI model used for duel")
    cascaded: bool = Field(False, description="Whether cascade was triggered from 8B to 70B")


class SemanticDuplicateMatch(BaseModel):
    req_id_a: str
    req_id_b: str
    text_a: str
    text_b: str
    similarity_score: float = Field(..., description="Cosine similarity score (0.0 to 1.0)")
    match_type: Literal["EXACT", "NEURAL_SEMANTIC", "LEXICAL_NEAR"]
    explanation: str = Field(..., description="Why these two statements are duplicates")


class ConflictType(str, Enum):
    DIRECT_CONTRADICTION = "Direct Contradiction"
    TIMING_MISMATCH = "Timing Mismatch"
    RESOURCE_CONTENTION = "Resource Contention"
    OPERATIONAL_INCOMPATIBILITY = "Operational Incompatibility"


class RequirementConflictCard(BaseModel):
    req_id_a: str
    req_id_b: str
    conflict_type: str = Field(..., description="Classification of conflict")
    severity: Literal["BLOCKER", "MAJOR", "MINOR"] = "BLOCKER"
    conflicting_quote_a: str = Field(..., description="Quote or obligation from Req A")
    conflicting_quote_b: str = Field(..., description="Quote or obligation from Req B")
    explanation: str = Field(..., description="Detailed systems engineering explanation of the clash")
    reconciliation_suggestion: str = Field(..., description="How to resolve or clarify the conflict")


class ConflictRadarRequest(BaseModel):
    project_id: Optional[str] = "default_project"
    target_req_id: Optional[str] = None
    target_text: Optional[str] = None
    candidate_requirements: Optional[List[RequirementStatement]] = None


class ConflictRadarResponse(BaseModel):
    total_conflicts_found: int
    conflicts: List[RequirementConflictCard]


class TestCase(BaseModel):
    __test__ = False
    name: str = Field(..., description="Test case designation")
    stimulus: str = Field(..., description="Step-by-step inputs or conditions")
    expected_response: str = Field(..., description="Concrete expected behavior")


class VerificationPlan(BaseModel):
    verification_method: Literal["Test", "Demonstration", "Inspection", "Analysis"] = Field(
        ..., description="Standard INCOSE / DO-178C verification method"
    )
    preconditions: List[str] = Field(default_factory=list, description="System state prior to execution")
    positive_test_case: TestCase
    negative_boundary_test_case: TestCase
    acceptance_criteria: Dict[str, str] = Field(
        ..., description="Mathematically falsifiable PASS / FAIL thresholds"
    )
    model_used: Optional[str] = Field(None, description="Qualcomm AI model used for blueprint generation")


class RequirementStatement(BaseModel):
    id: str = Field(..., description="Unique requirement ID (e.g., REQ-001)")
    project_id: str = Field(default="default_project", description="Associated Project Workspace ID")
    text: str = Field(..., description="Source or rewritten requirement text")
    category: Optional[str] = Field(None, description="Functional domain or category")
    section: Optional[str] = Field(None, description="Source document section or module")
    status: RequirementStatus = Field(
        RequirementStatus.DRAFT,
        description="Dual-key lifecycle state"
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    version: int = Field(1, description="Iteration version counter")
    quality_score: Optional[QualityScore] = None
    issues: List[IssueCard] = Field(default_factory=list)
    rewrite_suggestion: Optional[RewriteSuggestion] = None
    duel: Optional[InterpretationDuel] = None
    verification_plan: Optional[VerificationPlan] = None
    sign_off: Optional[DualKeySignOff] = None


class DocumentParseRequest(BaseModel):
    text: Optional[str] = Field(None, description="Raw text or markdown content to parse")
    category: Optional[str] = Field(None, description="Optional default category for parsed items")
    project_id: Optional[str] = Field("default_project", description="Target project workspace ID")


class DocumentParseResponse(BaseModel):
    total_parsed: int
    requirements: List[RequirementStatement]
    format_detected: str = Field(..., description="Identified format (plain_text, numbered_list, csv, pdf)")


class SignOffActionRequest(BaseModel):
    action: Literal["provisional_pm", "lock_baseline", "flag_tbd", "reject"]
    pm_author: Optional[str] = None
    pm_target_val: Optional[str] = None
    tech_lead_approver: Optional[str] = None
    hardware_rationale: Optional[str] = None


class ProjectDocumentContext(BaseModel):
    id: str = Field(default_factory=lambda: f"DOC-{uuid.uuid4().hex[:6].upper()}", description="Unique document ID")
    title: str = Field(..., description="Document name or section title")
    content: str = Field(..., description="Full text or architectural overview")
    category: str = Field("General", description="System domain or engineering domain")
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    version: int = Field(1, description="Document revision counter")


class ProjectWorkspace(BaseModel):
    project_id: str = Field(..., description="Unique workspace identifier slug, e.g. 'proj-ev-bms'")
    project_name: str = Field(..., description="Project designation, e.g. 'Next-Gen 800V EV BMS'")
    domain: str = Field(..., description="Industry domain, e.g. 'Automotive Powertrain', 'Medical Device'")
    description: str = Field(..., description="High-level engineering summary and safety constraints")
    is_locked: bool = Field(False, description="Whether architecture charter and boundaries are frozen")
    locked_at: Optional[datetime] = Field(None, description="Timestamp when architecture was locked")
    locked_by: Optional[str] = Field(None, description="Persona or user who locked the project")
    documents: List[ProjectDocumentContext] = Field(default_factory=list, description="Attached project architecture documents")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ProjectCreateRequest(BaseModel):
    project_id: str = Field(..., description="Unique project slug (alphanumeric, hyphens, underscores)")
    project_name: str = Field(..., description="Human-readable project title")
    domain: str = Field(..., description="Industry or engineering domain")
    description: str = Field(..., description="High-level architectural description and constraints")


class ProjectUpdateRequest(BaseModel):
    project_name: Optional[str] = None
    domain: Optional[str] = None
    description: Optional[str] = None


class ProjectLockRequest(BaseModel):
    is_locked: bool = Field(..., description="True to lock, False to unlock")
    locked_by: Optional[str] = Field(None, description="User/Persona requesting the lock state change")


class ProjectSummary(BaseModel):
    project_id: str
    project_name: str
    domain: str
    description: str
    is_locked: bool
    total_requirements: int
    locked_baseline_count: int
    provisional_pm_count: int
    flagged_tbd_count: int
    total_documents: int
    created_at: datetime
    updated_at: datetime


class ProjectContext(BaseModel):
    project_id: str = Field(default="default_project", description="Active project ID")
    project_name: str = Field(..., description="Project designation, e.g. 'Next-Gen 800V EV BMS'")
    domain: str = Field(..., description="Industry domain, e.g. 'Automotive Powertrain', 'Medical Device'")
    description: str = Field(..., description="High-level engineering summary and safety constraints")
    documents: List[ProjectDocumentContext] = Field(default_factory=list)
    is_locked: bool = Field(False, description="Whether project boundaries are locked")


class ChatMessageItem(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class ChatRequirementRequest(BaseModel):
    message: str = Field(..., description="Plain-language requirement thought or request from PM")
    project_id: Optional[str] = Field("default_project", description="Target project context ID")
    conversation_history: List[ChatMessageItem] = Field(default_factory=list)
    save_to_store: bool = Field(True, description="Whether to automatically register generated requirements into the active store")


class ChatRequirementResponse(BaseModel):
    agent_reply: str = Field(..., description="Conversational explanation and engineering feedback from Copilot")
    generated_requirements: List[RequirementStatement] = Field(default_factory=list, description="Formal EARS requirements synthesized from PM input")
    context_grounding: str = Field(..., description="Reference to project architectural constraints used")
