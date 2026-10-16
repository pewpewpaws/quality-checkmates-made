from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field


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


class RewriteSuggestion(BaseModel):
    original: str = Field(..., description="Source requirement text")
    revised: str = Field(..., description="Strict EARS/ISO formatted text preserving [TBD: ...] tokens")
    rationale: str = Field(..., description="Systems engineering rationale for the rewrite")
    identified_tbds: List[TbdDefault] = Field(
        default_factory=list,
        description="1-click actionable UI chips for PM/Engineer resolution"
    )


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


class RequirementStatement(BaseModel):
    id: str = Field(..., description="Unique requirement ID (e.g., REQ-001)")
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
