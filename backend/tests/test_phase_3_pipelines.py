"""
Phase 3 AI Feature Pipelines Comprehensive Test Suite
Targeting Qualcomm Cloud AI 100 capabilities:
1. X-Ray Issue Detection with Verbatim Quote Grounding.
2. Interpretation Duel with Contrast Divergence & Cascade.
3. Smart Rewriter with Zero-Fabrication [TBD] and Intent-Lock Validation.
4. Verification Blueprint Generator with Falsifiable Acceptance Criteria.
5. Conflict Radar Contradiction Detection.
6. API Route Integration across /api/analysis endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.models.schemas import (
    RequirementStatement,
    RequirementStatus,
    DiffTokenType,
    IntentLockReport,
    RewriteSuggestion,
    InterpretationDuel,
    VerificationPlan,
)
from backend.services.storage import store
from backend.services.qualcomm_service import QualcommService
from backend.services.intent_lock import IntentLockValidator, intent_lock_validator
from backend.api.routes_analysis import qualcomm as analysis_qualcomm
from backend.api.routes_requirements import qualcomm as req_qualcomm

client = TestClient(app)
analysis_qualcomm.mock_mode = True
req_qualcomm.mock_mode = True


# ==============================================================================
# 1. INTENT-LOCK DETERMINISTIC ENGINE TESTS
# ==============================================================================

def test_intent_lock_preserves_valid_ears_rewrite():
    """Verify that a valid EARS rewrite preserving intent passes Intent-Lock."""
    orig = "The thermal management module should quickly reduce power consumption if temperature is critical."
    revised = "When operating temperature exceeds [TBD: critical_temperature_degC], the thermal management module shall reduce power consumption by [TBD: power_reduction_percent] within [TBD: response_time_ms]."
    
    report = intent_lock_validator.validate(orig, revised)
    assert report.passed is True
    assert report.semantic_drift_detected is False
    assert report.negation_preserved is True
    assert report.modal_verb_preserved is True
    assert report.actor_preserved is True
    assert len(report.drift_warnings) == 0
    assert any(t.token_type == DiffTokenType.TBD_PARAMETERIZED for t in report.diff_tokens)
    assert any(t.token_type == DiffTokenType.MODAL_UPGRADED for t in report.diff_tokens)


def test_intent_lock_detects_dropped_negation():
    """Verify that dropping a negative prohibition ('shall not') triggers critical drift."""
    orig = "The BMS shall not engage high-voltage contactors when insulation resistance is below 500 ohms/volt."
    bad_revised = "When insulation resistance is below [TBD: min_resistance], the BMS shall engage high-voltage contactors."
    
    report = intent_lock_validator.validate(orig, bad_revised)
    assert report.passed is False
    assert report.semantic_drift_detected is True
    assert report.negation_preserved is False
    assert any("POLARITY DRIFT" in w for w in report.drift_warnings)
    assert any(t.token_type == DiffTokenType.NEGATION_DRIFT for t in report.diff_tokens)


def test_intent_lock_detects_introduced_negation():
    """Verify that adding an unauthorized negative restriction triggers drift."""
    orig = "The telemetry unit shall transmit status packets every 100ms."
    bad_revised = "The telemetry unit shall not transmit status packets every [TBD: interval_ms]."
    
    report = intent_lock_validator.validate(orig, bad_revised)
    assert report.passed is False
    assert report.semantic_drift_detected is True
    assert report.negation_preserved is False


def test_intent_lock_detects_modal_demotion():
    """Verify that demoting a binding 'shall' to a weak 'should' or 'may' is flagged."""
    orig = "The flight control module shall maintain pitch angle within safe limits."
    bad_revised = "The flight control module should maintain pitch angle within [TBD: max_pitch_deg]."
    
    report = intent_lock_validator.validate(orig, bad_revised)
    assert report.passed is False
    assert report.semantic_drift_detected is True
    assert report.modal_verb_preserved is False
    assert any("LEGAL BINDING DEMOTION" in w for w in report.drift_warnings)


def test_intent_lock_detects_dropped_contractual_numbers():
    """Verify that removing contractual thresholds without parameterization triggers warning."""
    orig = "The pump shall deliver insulin at 5.0 mL/hr with 99.9% accuracy."
    bad_revised = "The pump shall deliver insulin at the designated rate."
    
    report = intent_lock_validator.validate(orig, bad_revised)
    assert report.thresholds_preserved is False
    assert any("THRESHOLD DROPPED" in w for w in report.drift_warnings)


# ==============================================================================
# 2. X-RAY ISSUE EXTRACTION PIPELINE
# ==============================================================================

def test_xray_pipeline_extracts_and_grounds_issues():
    """Verify X-Ray issue extraction produces strictly grounded evidence quotes."""
    svc = QualcommService(mock_mode=True)
    req_text = "The battery management system shall quickly transmit telemetry as appropriate."
    
    import asyncio
    cards = asyncio.run(svc.extract_xray_issues(req_text))
    assert len(cards) >= 2
    for card in cards:
        assert card.is_grounded is True
        assert card.start_offset is not None
        assert card.end_offset is not None
        assert req_text[card.start_offset:card.end_offset] == card.evidence_quote


# ==============================================================================
# 3. INTERPRETATION DUEL PIPELINE & CONTRAST
# ==============================================================================

def test_interpretation_duel_pipeline_contrast_and_cards():
    """Verify Interpretation Duel generates 2 distinct technical cards and contrast score."""
    svc = QualcommService(mock_mode=True)
    req_text = "The diagnostic logger shall periodically save buffer entries."
    
    import asyncio
    duel = asyncio.run(svc.stage_interpretation_duel(req_text))
    assert duel.card_a is not None
    assert duel.card_b is not None
    assert duel.card_a.title != duel.card_b.title
    assert duel.contrast_score >= 0.5
    assert len(duel.card_a.technical_spec) > 10
    assert len(duel.card_b.technical_spec) > 10


# ==============================================================================
# 4. SMART REWRITER PIPELINE & ZERO-FABRICATION
# ==============================================================================

def test_smart_rewriter_pipeline_intent_lock_and_tbds():
    """Verify Smart Rewriter preserves [TBD] tokens and attaches Intent-Lock report."""
    svc = QualcommService(mock_mode=True)
    req_text = "The telemetry module shall periodically broadcast pack metrics."
    
    import asyncio
    suggestion = asyncio.run(svc.rewrite_with_smart_defaults(req_text))
    assert "[TBD:" in suggestion.revised
    assert len(suggestion.identified_tbds) > 0
    assert suggestion.intent_lock is not None
    assert suggestion.intent_lock.passed is True
    assert suggestion.model_used is not None


# ==============================================================================
# 5. VERIFICATION BLUEPRINT PIPELINE
# ==============================================================================

def test_verification_blueprint_pipeline_criteria():
    """Verify Verification Blueprint generates paired test cases and falsifiable criteria."""
    svc = QualcommService(mock_mode=True)
    req_text = "When current exceeds [TBD: max_current_A], the system shall trip breaker within [TBD: trip_ms]."
    
    import asyncio
    blueprint = asyncio.run(svc.generate_verification_blueprint(req_text))
    assert blueprint.verification_method in ["Test", "Demonstration", "Inspection", "Analysis"]
    assert blueprint.positive_test_case is not None
    assert blueprint.negative_boundary_test_case is not None
    assert "PASS" in blueprint.acceptance_criteria
    assert "FAIL" in blueprint.acceptance_criteria
    assert blueprint.model_used is not None


# ==============================================================================
# 6. API ROUTES INTEGRATION (/api/analysis)
# ==============================================================================

def test_api_analysis_xray_endpoint():
    """Verify POST /api/analysis/xray."""
    resp = client.post(
        "/api/analysis/xray",
        json={"text": "The motor controller shall smoothly accelerate where feasible."}
    )
    assert resp.status_code == 200
    cards = resp.json()
    assert isinstance(cards, list)
    assert len(cards) > 0
    assert "evidence_quote" in cards[0]


def test_api_analysis_duel_endpoint():
    """Verify POST /api/analysis/duel."""
    resp = client.post(
        "/api/analysis/duel",
        json={"text": "The sensor hub should periodically sync telemetry."}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "card_a" in data
    assert "card_b" in data
    assert "contrast_score" in data


def test_api_analysis_rewrite_endpoint():
    """Verify POST /api/analysis/rewrite."""
    resp = client.post(
        "/api/analysis/rewrite",
        json={"text": "The cooling fan should quickly spin up when warm."}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "[TBD:" in data["revised"]
    assert "intent_lock" in data
    assert data["intent_lock"]["passed"] is True


def test_api_analysis_intent_lock_direct_endpoint():
    """Verify POST /api/analysis/intent-lock direct auditing endpoint."""
    # 1. Clean rewrite
    resp = client.post(
        "/api/analysis/intent-lock",
        json={
            "original": "The pump should dispense medicine quickly.",
            "revised": "The pump shall dispense medicine within [TBD: flow_rate_ml_hr]."
        }
    )
    assert resp.status_code == 200
    report = resp.json()
    assert report["passed"] is True
    assert report["semantic_drift_detected"] is False

    # 2. Dropped negation
    resp_drift = client.post(
        "/api/analysis/intent-lock",
        json={
            "original": "The system shall not exceed maximum pressure.",
            "revised": "The system shall exceed [TBD: max_pressure_psi]."
        }
    )
    assert resp_drift.status_code == 200
    drift_report = resp_drift.json()
    assert drift_report["passed"] is False
    assert drift_report["semantic_drift_detected"] is True
    assert len(drift_report["drift_warnings"]) > 0


def test_api_analysis_blueprint_endpoint():
    """Verify POST /api/analysis/blueprint."""
    resp = client.post(
        "/api/analysis/blueprint",
        json={"text": "The flight control computer shall engage backup sensor when primary faults."}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["verification_method"] in ["Test", "Demonstration", "Inspection", "Analysis"]
    assert "positive_test_case" in data
    assert "negative_boundary_test_case" in data
    assert "PASS" in data["acceptance_criteria"]
