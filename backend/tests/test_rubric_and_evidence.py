"""
Unit and integration tests for Deterministic Rubric Scoring Engine & Evidence Validator (Phase 2).
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.models.schemas import IssueCard, RequirementConflictCard, RequirementStatement
from backend.services.evidence_validator import evidence_validator
from backend.services.rubric_engine import rubric_engine
from backend.services.storage import store

client = TestClient(app)


# ==============================================================================
# 1. EVIDENCE VALIDATOR TESTS
# ==============================================================================

def test_evidence_validator_exact_match():
    text = "The battery management system shall disconnect the contactors within 10ms."
    quote = "disconnect the contactors"
    is_grounded, aligned, start, end = evidence_validator.locate_substring(text, quote)
    assert is_grounded is True
    assert aligned == quote
    assert start == 36
    assert end == 61
    assert text[start:end] == quote


def test_evidence_validator_whitespace_and_punctuation():
    text = 'The system shall transmit telemetry "periodically", as needed.'
    quote = '"periodically"'
    is_grounded, aligned, start, end = evidence_validator.locate_substring(text, quote)
    assert is_grounded is True
    assert text[start:end] == aligned

    # Trailing comma in quote
    quote2 = "periodically,"
    is_grounded2, aligned2, start2, end2 = evidence_validator.locate_substring(text, quote2)
    assert is_grounded2 is True
    assert "periodically" in aligned2


def test_evidence_validator_case_insensitive_alignment():
    text = "The Motor Inverter shall switch off within 5ms upon fault detection."
    quote = "motor inverter"
    is_grounded, aligned, start, end = evidence_validator.locate_substring(text, quote)
    assert is_grounded is True
    assert aligned == "Motor Inverter"  # Aligns to source case!
    assert text[start:end] == "Motor Inverter"


def test_evidence_validator_ungrounded_quote():
    text = "The pump shall deliver insulin at 1.0 unit per hour."
    quote = "hallucinated quote not in text"
    is_grounded, _, start, end = evidence_validator.locate_substring(text, quote)
    assert is_grounded is False
    assert start is None
    assert end is None


def test_evidence_validator_card_enrichment():
    text = "The ECU shall log error codes quickly and reliably."
    card = IssueCard(
        issue_type="Ambiguity",
        severity="Major",
        evidence_quote="quickly",
        explanation="Subjective term",
        suggested_action="Specify millisecond bound"
    )
    enriched = evidence_validator.validate_card(card, text)
    assert enriched.is_grounded is True
    assert enriched.start_offset is not None
    assert enriched.end_offset is not None
    assert text[enriched.start_offset:enriched.end_offset] == "quickly"


# ==============================================================================
# 2. DETERMINISTIC RUBRIC SCORING ENGINE TESTS
# ==============================================================================

def test_rubric_engine_perfect_requirement():
    text = "When battery temperature exceeds 55 degrees Celsius, the cooling system shall activate liquid coolant pump at 2500 RPM within 500ms."
    score = rubric_engine.calculate_score(text)
    assert score.overall == 100.0
    assert score.clarity == 25.0
    assert score.verifiability == 25.0
    assert score.completeness == 20.0
    assert score.atomicity == 15.0
    assert score.consistency == 15.0
    assert len(score.receipt) >= 2


def test_rubric_engine_clarity_deductions():
    # Contains subjective 'fast' and escape hatch 'as needed'
    text = "When battery temperature rises, the fan shall spin fast as needed."
    score = rubric_engine.calculate_score(text)
    assert score.clarity < 25.0
    # Expected deductions for 'fast' (-5.0) and 'as needed' (-8.0)
    assert score.clarity <= 12.0
    assert any("fast" in r for r in score.receipt)
    assert any("as needed" in r for r in score.receipt)


def test_rubric_engine_verifiability_deductions():
    # Untestable absolute 'bug-free' and missing quantitative threshold for latency
    text = "The communications module shall provide 100% bug-free latency under normal conditions."
    score = rubric_engine.calculate_score(text)
    assert score.verifiability < 25.0
    assert any("Untestable" in r for r in score.receipt)


def test_rubric_engine_completeness_deductions():
    # Missing modal verb ('shall' or 'must'), and missing trigger for reactive 'disconnect'
    text = "The contactors disconnect immediately upon overcurrent."
    # Wait, 'upon' is a condition trigger! Let's test text completely lacking modal verb and condition:
    text_incomplete = "Immediate contactor disconnect for all battery faults."
    score = rubric_engine.calculate_score(text_incomplete)
    assert score.completeness < 20.0
    assert any("modal verb" in r.lower() for r in score.receipt)


def test_rubric_engine_atomicity_deductions():
    # Multiple 'shall' and 'and also'
    text = "When user presses power, the controller shall start the inverter and also shall initialize the CAN bus."
    score = rubric_engine.calculate_score(text)
    assert score.atomicity < 15.0
    assert any("Multiple modal verbs" in r or "Compound conjunction" in r for r in score.receipt)


def test_rubric_engine_consistency_deductions():
    text = "The device shall transmit telemetry continuously."
    conflict = RequirementConflictCard(
        req_id_a="REQ-001",
        req_id_b="REQ-002",
        conflict_type="Direct Contradiction",
        severity="BLOCKER",
        conflicting_quote_a="transmit telemetry continuously",
        conflicting_quote_b="make no wireless transmissions",
        explanation="Direct clash between continuous transmission and radio silence",
        reconciliation_suggestion="Define scheduled transmission windows"
    )
    score = rubric_engine.calculate_score(text, conflicts=[conflict])
    assert score.consistency == 0.0
    assert any("Conflict detected" in r for r in score.receipt)


def test_rubric_score_bounds_and_clamping():
    # Terrible requirement with tons of flaws
    flawed_text = (
        "The system shall fast and cleanly and also infinitely scale bug-free latency etc as needed "
        "and also shall intuitive seamless disconnect 100% unhackable."
    )
    score = rubric_engine.calculate_score(flawed_text)
    assert 0.0 <= score.overall <= 100.0
    assert 0.0 <= score.clarity <= 25.0
    assert 0.0 <= score.verifiability <= 25.0
    assert 0.0 <= score.completeness <= 20.0
    assert 0.0 <= score.atomicity <= 15.0
    assert 0.0 <= score.consistency <= 15.0


# ==============================================================================
# 3. API ENDPOINTS INTEGRATION
# ==============================================================================

def test_api_score_direct_text():
    resp = client.post(
        "/api/analysis/score",
        json={
            "text": "The BMS shall transmit pack temperature over CAN-FD every 100ms when ignition is ON."
        }
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "overall" in data
    assert "clarity" in data
    assert "receipt" in data
    assert data["overall"] >= 90.0


def test_api_score_stored_requirement():
    pid = "proj-score-test"
    # Create requirement
    create_resp = client.post(
        "/api/requirements",
        json={
            "id": "REQ-SCORE-001",
            "project_id": pid,
            "text": "The system shall be very fast and robust where feasible.",
            "category": "Performance",
            "status": "FLAGGED_TBD"
        },
        headers={"X-User-Role": "product_manager"}
    )
    assert create_resp.status_code == 200

    # Query GET /{req_id}/score
    get_resp = client.get(f"/api/requirements/REQ-SCORE-001/score?project_id={pid}")
    assert get_resp.status_code == 200
    score_data = get_resp.json()
    assert score_data["overall"] <= 85.0
    assert len(score_data["receipt"]) > 0

    # Recalculate & Persist POST /{req_id}/score
    post_resp = client.post(
        f"/api/requirements/REQ-SCORE-001/score?project_id={pid}",
        headers={"X-User-Role": "product_manager"}
    )
    assert post_resp.status_code == 200
    persisted_req = post_resp.json()
    assert persisted_req["quality_score"] is not None
    assert persisted_req["quality_score"]["overall"] == score_data["overall"]

    # Clean up project
    store.delete_project(pid)
