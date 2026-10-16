from datetime import datetime
from backend.models.schemas import (
    RequirementStatement,
    RequirementStatus,
    DualKeySignOff,
    IssueCard,
    RewriteSuggestion,
    TbdDefault,
    InterpretationDuel,
    DuelCard,
    VerificationPlan,
    TestCase
)


def test_dual_key_signoff_defaults():
    signoff = DualKeySignOff(requirement_id="REQ-001")
    assert signoff.state == RequirementStatus.FLAGGED_TBD
    assert signoff.pm_target_val is None
    assert signoff.tech_lead_approver is None


def test_requirement_statement_creation():
    req = RequirementStatement(
        id="REQ-001",
        text="The system shall transmit telemetry within [TBD: latency_ms].",
        status=RequirementStatus.DRAFT
    )
    assert req.id == "REQ-001"
    assert req.version == 1
    assert req.status == RequirementStatus.DRAFT


def test_tbd_preservation_and_defaults():
    rewrite = RewriteSuggestion(
        original="The system should send data fast.",
        revised="The system shall transmit data within [TBD: latency_ms].",
        rationale="EARS compliance",
        identified_tbds=[
            TbdDefault(
                parameter_name="latency_ms",
                suggested_value="100 ms",
                rationale="CAN bus cycle baseline",
                confidence="HIGH"
            )
        ]
    )
    assert "[TBD:" in rewrite.revised
    assert len(rewrite.identified_tbds) == 1
    assert rewrite.identified_tbds[0].suggested_value == "100 ms"
