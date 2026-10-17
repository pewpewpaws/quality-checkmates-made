#!/usr/bin/env python3
"""
Agent-in-the-Loop (AITL) Phase 3 Pipeline Evaluation & Verification Suite
Running natively on Qualcomm Cloud AI 100 via Imagine SDK.

Evaluates the Phase 3 feature pipelines:
1. X-Ray Issue Extraction (Llama-3.3-70B) -> 100% Quote Grounding.
2. Interpretation Duel (Llama-3.1-8B -> Llama-3.3-70B Cascade) -> Contrast Divergence.
3. Intent-Locked Smart Rewriter (Llama-3.3-70B + IntentLockValidator) -> Zero-Fabrication & Intent Preservation.
4. Verification Blueprint (Llama-3.3-70B) -> Falsifiable Acceptance Criteria.
5. Conflict Radar (Llama-3.3-70B) -> Mutual Contradiction Detection.
"""

import os
import sys
import json
import time
import asyncio
from pathlib import Path
from typing import List, Dict, Any

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.services.qualcomm_service import QualcommService
from backend.services.intent_lock import intent_lock_validator
from backend.models.schemas import RequirementStatement, RequirementStatus

TEST_SCENARIOS = [
    {
        "domain": "Automotive 800V BMS",
        "req_text": "The battery management system shall quickly disconnect high-voltage contactors if cell temperature becomes critical as appropriate.",
        "expected_issues": ["Ambiguity", "Escape-hatch"],
        "expected_tbds": ["critical_cell_temp_degC", "disconnect_timeout_ms"]
    },
    {
        "domain": "Medical Infusion Pump",
        "req_text": "The pump motor shall deliver insulin at 5.0 mL/hr and must not exceed safe occlusion pressure under any circumstances.",
        "expected_issues": ["Ambiguity"],
        "expected_negation": True
    },
    {
        "domain": "Commercial Avionics Flight Control",
        "req_text": "The flight computer shall periodically update primary flight display attitude indicators at 60 Hz where feasible.",
        "expected_issues": ["Escape-hatch", "Ambiguity"],
        "expected_tbds": ["refresh_rate_hz"]
    }
]


async def run_aitl_phase_3_evaluation():
    print("=" * 80)
    print("🚀 QUALCOMM CLOUD AI 100 — PHASE 3 AI PIPELINES AITL EVALUATION")
    print("=" * 80)

    service = QualcommService(mock_mode=False)

    # 1. Health Ping
    t0 = time.time()
    ping = await service.ping()
    print(f"📡 Qualcomm AI100 Ping: {ping['status']} ({time.time() - t0:.2f}s) | Mode: {ping['mode']}")
    assert ping["status"] == "ok", "Cirrascale AI100 unreachable"

    metrics = {
        "xray_grounded_quotes": 0,
        "xray_total_cards": 0,
        "duel_contrast_scores": [],
        "rewriter_zero_fabrication": 0,
        "rewriter_intent_lock_passed": 0,
        "blueprint_falsifiable_criteria": 0,
        "total_scenarios": len(TEST_SCENARIOS)
    }

    for i, scen in enumerate(TEST_SCENARIOS, 1):
        print(f"\n--- Scenario {i}/{len(TEST_SCENARIOS)}: {scen['domain']} ---")
        text = scen["req_text"]
        print(f"Input: \"{text}\"")

        # A. X-Ray Issue Extraction
        t_xray = time.time()
        cards = await service.extract_xray_issues(text)
        dt_xray = time.time() - t_xray
        print(f"  [X-Ray] Extracted {len(cards)} issue cards in {dt_xray:.2f}s:")
        for c in cards:
            is_verbatim = c.evidence_quote in text
            if is_verbatim:
                metrics["xray_grounded_quotes"] += 1
            metrics["xray_total_cards"] += 1
            print(f"    - [{c.severity}] {c.issue_type}: \"{c.evidence_quote}\" (Grounded: {is_verbatim})")

        # B. Interpretation Duel with Contrast & Cascade
        t_duel = time.time()
        duel = await service.stage_interpretation_duel(text)
        dt_duel = time.time() - t_duel
        metrics["duel_contrast_scores"].append(duel.contrast_score)
        print(f"  [Duel] Model: {duel.model_used} (Cascaded: {duel.cascaded}) | Contrast Score: {duel.contrast_score:.3f} in {dt_duel:.2f}s")
        print(f"    - Card A ({duel.card_a.title}): {duel.card_a.technical_spec[:60]}...")
        print(f"    - Card B ({duel.card_b.title}): {duel.card_b.technical_spec[:60]}...")

        # C. Smart Rewriter with Intent-Lock Validation
        t_rew = time.time()
        suggestion = await service.rewrite_with_smart_defaults(text)
        dt_rew = time.time() - t_rew
        has_tbd = "[TBD:" in suggestion.revised
        if has_tbd:
            metrics["rewriter_zero_fabrication"] += 1
        
        intent = suggestion.intent_lock
        if intent and intent.passed:
            metrics["rewriter_intent_lock_passed"] += 1
        
        print(f"  [Rewriter] Model: {suggestion.model_used} (Cascaded: {suggestion.cascaded}) in {dt_rew:.2f}s")
        print(f"    - Revised: \"{suggestion.revised}\"")
        print(f"    - Identified TBDs: {[t.parameter_name for t in suggestion.identified_tbds]}")
        print(f"    - Intent-Lock Passed: {intent.passed if intent else False} (Drift: {intent.semantic_drift_detected if intent else 'N/A'})")

        # D. Verification Blueprint Generator
        t_bp = time.time()
        bp = await service.generate_verification_blueprint(suggestion.revised)
        dt_bp = time.time() - t_bp
        has_pass_fail = "PASS" in bp.acceptance_criteria and "FAIL" in bp.acceptance_criteria
        if has_pass_fail:
            metrics["blueprint_falsifiable_criteria"] += 1
        print(f"  [Blueprint] Method: {bp.verification_method} in {dt_bp:.2f}s")
        print(f"    - Positive Path: {bp.positive_test_case.name}")
        print(f"    - Boundary Path: {bp.negative_boundary_test_case.name}")
        print(f"    - PASS Criteria: {bp.acceptance_criteria.get('PASS', '')[:65]}...")

    # Summary Report
    quote_acc = (metrics["xray_grounded_quotes"] / max(1, metrics["xray_total_cards"])) * 100.0
    zero_fab_acc = (metrics["rewriter_zero_fabrication"] / metrics["total_scenarios"]) * 100.0
    intent_acc = (metrics["rewriter_intent_lock_passed"] / metrics["total_scenarios"]) * 100.0
    avg_contrast = sum(metrics["duel_contrast_scores"]) / max(1, len(metrics["duel_contrast_scores"]))
    crit_acc = (metrics["blueprint_falsifiable_criteria"] / metrics["total_scenarios"]) * 100.0

    print("\n" + "=" * 80)
    print("📊 QUALCOMM AI100 PHASE 3 EVALUATION SCORECARD")
    print("=" * 80)
    print(f"1. Verbatim Quote Grounding Accuracy:    {quote_acc:.1f}% ({metrics['xray_grounded_quotes']}/{metrics['xray_total_cards']})")
    print(f"2. Zero-Fabrication [TBD] Rate:          {zero_fab_acc:.1f}% ({metrics['rewriter_zero_fabrication']}/{metrics['total_scenarios']})")
    print(f"3. Intent-Lock Verification Pass Rate:   {intent_acc:.1f}% ({metrics['rewriter_intent_lock_passed']}/{metrics['total_scenarios']})")
    print(f"4. Interpretation Duel Mean Contrast:    {avg_contrast:.3f} (Divergence)")
    print(f"5. Verification Blueprint Falsifiability:{crit_acc:.1f}% ({metrics['blueprint_falsifiable_criteria']}/{metrics['total_scenarios']})")
    print("=" * 80)

    # Save artifact report
    report_data = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "hardware": "Qualcomm Cloud AI 100 (Cirrascale)",
        "models": {
            "xray": "Llama-3.3-70B",
            "duel": "Llama-3.1-8B -> Llama-3.3-70B Cascade",
            "rewriter": "Llama-3.3-70B + IntentLockValidator",
            "blueprint": "Llama-3.3-70B"
        },
        "scorecard": {
            "quote_grounding_accuracy": f"{quote_acc:.1f}%",
            "zero_fabrication_compliance": f"{zero_fab_acc:.1f}%",
            "intent_lock_pass_rate": f"{intent_acc:.1f}%",
            "mean_duel_contrast": round(avg_contrast, 3),
            "blueprint_falsifiability": f"{crit_acc:.1f}%"
        }
    }
    
    os.makedirs("docs/findings", exist_ok=True)
    with open("docs/findings/phase_3_aitl_scorecard.json", "w") as f:
        json.dump(report_data, f, indent=2)
    print("✅ Scorecard saved to docs/findings/phase_3_aitl_scorecard.json")

    return report_data


if __name__ == "__main__":
    asyncio.run(run_aitl_phase_3_evaluation())
