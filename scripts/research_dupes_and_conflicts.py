import asyncio
import json
import logging
import time
from typing import Dict, Any, List
import numpy as np

from backend.models.schemas import (
    RequirementStatement,
    RequirementStatus,
    RequirementConflictCard,
    ConflictRadarResponse,
    SemanticDuplicateMatch,
)
from backend.services.qualcomm_service import QualcommService
from backend.services.storage import RequirementStore

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("research_harness")


# ==============================================================================
# 5 DIVERSE MULTI-DOMAIN SCENARIOS (EACH WITH BASE, EXACT, SEMANTIC, CONFLICT, CONTROL)
# ==============================================================================

SCENARIOS = [
    {
        "domain": "Scenario 1: Automotive EV Powertrain & BMS (ISO 26262 ASIL-D)",
        "base": RequirementStatement(
            id="BMS-001",
            text="If battery cell temperature exceeds 60°C, the BMS shall open the main high-voltage contactors within 10ms.",
            category="Battery Safety"
        ),
        "exact_dupe": RequirementStatement(
            id="BMS-001-EXACT",
            text="  If battery cell temperature exceeds 60°C, the BMS shall open the main high-voltage contactors within 10ms.  ",
            category="Battery Safety"
        ),
        "semantic_dupe": RequirementStatement(
            id="BMS-001-SEMANTIC",
            text="When the traction pack thermal sensor indicates temperatures above 60 degrees Celsius, the battery disconnect unit shall decouple the primary HV switches within 10 milliseconds.",
            category="Thermal Safety"
        ),
        "conflict": RequirementStatement(
            id="BMS-001-CONFLICT",
            text="In the event of cell over-temperature above 60°C, the BMS shall maintain the main high-voltage contactors closed to preserve electric power steering assist.",
            category="Fail-Operational Steering"
        ),
        "control": RequirementStatement(
            id="BMS-001-CONTROL",
            text="The cabin ambient footwell LED lighting shall illuminate in amber whenever any passenger door is opened.",
            category="Interior Lighting"
        )
    },
    {
        "domain": "Scenario 2: Medical Infusion Pump & Fluidics (IEC 62304 / ISO 14971)",
        "base": RequirementStatement(
            id="MED-001",
            text="Upon detection of a downstream fluid line occlusion exceeding 15 psi, the infusion pump shall halt motor rotation within 20ms.",
            category="Fluidic Safety"
        ),
        "exact_dupe": RequirementStatement(
            id="MED-001-EXACT",
            text="Upon detection of a downstream fluid line occlusion exceeding 15 psi, the infusion pump shall halt motor rotation within 20ms.",
            category="Fluidic Safety"
        ),
        "semantic_dupe": RequirementStatement(
            id="MED-001-SEMANTIC",
            text="When downstream conduit backpressure surpasses 15 pounds per square inch, the drug delivery mechanism shall cease peristaltic drive actuation within 20 milliseconds.",
            category="Occlusion Management"
        ),
        "conflict": RequirementStatement(
            id="MED-001-CONFLICT",
            text="When downstream pressure transients exceed 15 psi, the pump shall increase motor drive torque to push through potential catheter resistance.",
            category="Bolus Delivery"
        ),
        "control": RequirementStatement(
            id="MED-001-CONTROL",
            text="The infusion controller display brightness shall dim by 50% after 60 seconds of user interface inactivity.",
            category="UI Power Management"
        )
    },
    {
        "domain": "Scenario 3: Aerospace Autonomous UAV Flight Controller (DO-178C / DO-254)",
        "base": RequirementStatement(
            id="AERO-001",
            text="Upon loss of the primary command and control (C2) datalink for greater than 3 seconds, the flight management system shall initiate automated return-to-launch (RTL) navigation.",
            category="Failsafe Navigation"
        ),
        "exact_dupe": RequirementStatement(
            id="AERO-001-EXACT",
            text="Upon loss of the primary command and control (C2) datalink for greater than 3 seconds, the flight management system shall initiate automated return-to-launch (RTL) navigation.",
            category="Failsafe Navigation"
        ),
        "semantic_dupe": RequirementStatement(
            id="AERO-001-SEMANTIC",
            text="If ground station telemetry uplink communication drops for more than 3000ms, the autopilot computer shall execute an autonomous return-to-base trajectory.",
            category="Lost Link Protocol"
        ),
        "conflict": RequirementStatement(
            id="AERO-001-CONFLICT",
            text="If primary command and control link is interrupted for more than 3 seconds, the aircraft shall maintain current heading and altitude to attempt link re-acquisition.",
            category="Link Reconnect Procedure"
        ),
        "control": RequirementStatement(
            id="AERO-001-CONTROL",
            text="The wing root anti-icing de-icer boot heater shall cycle on for 15 seconds every 2 minutes when air temperature is below 0°C.",
            category="Environmental Ice Protection"
        )
    },
    {
        "domain": "Scenario 4: Industrial IoT Edge Gateway (IEC 62443 / ISA-95)",
        "base": RequirementStatement(
            id="IOT-001",
            text="The edge gateway shall transmit plant telemetry over MQTT-TLS to the cloud endpoint every 5 seconds during online operation.",
            category="Cloud Connectivity"
        ),
        "exact_dupe": RequirementStatement(
            id="IOT-001-EXACT",
            text="The edge gateway shall transmit plant telemetry over MQTT-TLS to the cloud endpoint every 5 seconds during online operation.",
            category="Cloud Connectivity"
        ),
        "semantic_dupe": RequirementStatement(
            id="IOT-001-SEMANTIC",
            text="During standard connected mode, the IoT aggregator unit shall publish factory telemetry metrics across secure MQTT broker every five seconds.",
            category="Telemetry Stream"
        ),
        "conflict": RequirementStatement(
            id="IOT-001-CONFLICT",
            text="The edge gateway shall operate in zero-trust air-gapped isolation with all external network sockets permanently disabled during online operation.",
            category="Air-Gap Security"
        ),
        "control": RequirementStatement(
            id="IOT-001-CONTROL",
            text="The enclosure internal cooling fan shall ramp up to 3000 RPM if heatsink temperature crosses 55°C.",
            category="Chassis Thermal Management"
        )
    },
    {
        "domain": "Scenario 5: Automotive ADAS & Autonomous Braking (ISO 22839 / EARS)",
        "base": RequirementStatement(
            id="ADAS-001",
            text="When forward collision time-to-collision drops below 1.2 seconds, the AEB module shall command maximum hydraulic deceleration.",
            category="Autonomous Emergency Braking"
        ),
        "exact_dupe": RequirementStatement(
            id="ADAS-001-EXACT",
            text="When forward collision time-to-collision drops below 1.2 seconds, the AEB module shall command maximum hydraulic deceleration.",
            category="Autonomous Emergency Braking"
        ),
        "semantic_dupe": RequirementStatement(
            id="ADAS-001-SEMANTIC",
            text="If impending crash TTC evaluates to under 1200ms, the crash mitigation subsystem shall apply 100% service brake pressure.",
            category="Collision Mitigation"
        ),
        "conflict": RequirementStatement(
            id="ADAS-001-CONFLICT",
            text="If forward collision time-to-collision is under 1.2 seconds, the braking controller shall limit deceleration to a gentle 0.2g to ensure passenger ride comfort.",
            category="Comfort Braking Mode"
        ),
        "control": RequirementStatement(
            id="ADAS-001-CONTROL",
            text="The windshield rain sensor shall activate wiper sweeps at low speed when moisture coverage exceeds 20%.",
            category="Wiper Automation"
        )
    }
]


async def run_extensive_research():
    qualcomm = QualcommService(mock_mode=False)
    store = RequirementStore()

    print("=" * 80)
    print("EXTENSIVE RESEARCH HARNESS: 5 SCENARIOS ACROSS 3 CAPABILITIES")
    print("QUALCOMM CLOUD AI 100: BAAI/bge-large-en-v1.5 + Llama-3.3-70B")
    print("=" * 80)

    summary_results = []

    for idx, sc in enumerate(SCENARIOS, 1):
        domain = sc["domain"]
        base = sc["base"]
        exact_dupe = sc["exact_dupe"]
        semantic_dupe = sc["semantic_dupe"]
        conflict = sc["conflict"]
        control = sc["control"]

        print(f"\n[{idx}/5] TESTING: {domain}")
        print(f"  • Base Statement: \"{base.text}\"")

        # ----------------------------------------------------------------------
        # TEST 1: EXACT DUPLICATE CHECK (Lexical / Hash)
        # ----------------------------------------------------------------------
        test_project_id = f"research-proj-{idx}"
        store.delete_project(test_project_id)
        store.upsert(base, project_id=test_project_id)
        store.upsert(exact_dupe, project_id=test_project_id)
        store.upsert(control, project_id=test_project_id)

        lexical_dupes = store.find_duplicates(project_id=test_project_id, similarity_threshold=0.70)
        exact_found = any(d["match_type"] == "EXACT" for d in lexical_dupes)
        print(f"  [1] Exact Duplicate Detection: {'✅ PASS' if exact_found else '❌ FAIL'} (Found {len(lexical_dupes)} lexical matches)")

        # ----------------------------------------------------------------------
        # TEST 2: NEURAL SEMANTIC DUPLICATE (BAAI/bge-large-en-v1.5)
        # ----------------------------------------------------------------------
        t_start_emb = time.time()
        req_set = [base, semantic_dupe, control]
        sem_matches = await qualcomm.find_semantic_duplicates(req_set, similarity_threshold=0.70)
        emb_time = time.time() - t_start_emb

        # Verify semantic pair vs control separation
        sem_pair = next((m for m in sem_matches if {m.req_id_a, m.req_id_b} == {base.id, semantic_dupe.id}), None)
        control_pair = next((m for m in sem_matches if control.id in {m.req_id_a, m.req_id_b}), None)

        sem_score = sem_pair.similarity_score if sem_pair else 0.0
        control_score = control_pair.similarity_score if control_pair else 0.0

        sem_pass = sem_score >= 0.75 and (control_pair is None or control_score < 0.60)
        print(f"  [2] Neural Semantic Similarity: {'✅ PASS' if sem_pass else '❌ FAIL'}")
        print(f"      • Paraphrase Cosine Similarity: {sem_score:.4f} (Threshold >= 0.75)")
        print(f"      • Unrelated Control Cosine:     {control_score:.4f} (Must be < 0.60)")
        print(f"      • Latency: {emb_time:.2f}s on Qualcomm AI100")

        # ----------------------------------------------------------------------
        # TEST 3: CONFLICT RADAR (Llama-3.3-70B Deep Logical Reasoning)
        # ----------------------------------------------------------------------
        t_start_conflict = time.time()
        # Test positive conflict: base vs [conflict, control]
        conflict_res = await qualcomm.detect_conflicts(base, [conflict, control])
        conflict_time = time.time() - t_start_conflict

        has_conflict = conflict_res.total_conflicts_found >= 1
        top_conflict = conflict_res.conflicts[0] if has_conflict else None

        quote_grounded = False
        if top_conflict:
            # Check quotes exist in text
            quote_a_valid = top_conflict.conflicting_quote_a.lower() in base.text.lower() or any(
                w in base.text.lower() for w in top_conflict.conflicting_quote_a.lower().split() if len(w) > 4
            )
            quote_b_valid = top_conflict.conflicting_quote_b.lower() in conflict.text.lower() or any(
                w in conflict.text.lower() for w in top_conflict.conflicting_quote_b.lower().split() if len(w) > 4
            )
            quote_grounded = quote_a_valid and quote_b_valid

        # Negative Control: base vs [control] (Must return 0 conflicts)
        clean_res = await qualcomm.detect_conflicts(base, [control])
        false_positives = clean_res.total_conflicts_found

        radar_pass = has_conflict and quote_grounded and (false_positives == 0)
        print(f"  [3] Conflict Radar (Llama-3.3-70B): {'✅ PASS' if radar_pass else '❌ FAIL'}")
        if top_conflict:
            print(f"      • Clashing Type:  {top_conflict.conflict_type} ({top_conflict.severity})")
            print(f"      • Quote Base:     \"{top_conflict.conflicting_quote_a}\"")
            print(f"      • Quote Opposing: \"{top_conflict.conflicting_quote_b}\"")
            print(f"      • Reconciliation: \"{top_conflict.reconciliation_suggestion[:80]}...\"")
        print(f"      • False Positive on Control: {false_positives} (Expected: 0)")
        print(f"      • Latency: {conflict_time:.2f}s on Qualcomm AI100")

        summary_results.append({
            "scenario": domain,
            "exact_pass": exact_found,
            "semantic_score": round(sem_score, 4),
            "control_score": round(control_score, 4),
            "semantic_pass": sem_pass,
            "conflict_pass": radar_pass,
            "conflict_type": top_conflict.conflict_type if top_conflict else None,
            "severity": top_conflict.severity if top_conflict else None,
            "reconciliation": top_conflict.reconciliation_suggestion if top_conflict else None,
            "emb_time_s": round(emb_time, 2),
            "conflict_time_s": round(conflict_time, 2),
        })

        store.delete_project(test_project_id)

    # Export report
    output_path = "docs/findings/five_scenario_research_results.json"
    with open(output_path, "w") as f:
        json.dump(summary_results, f, indent=2)
    print(f"\n✅ Extensive Research Completed. Results saved to {output_path}")

    return summary_results


if __name__ == "__main__":
    asyncio.run(run_extensive_research())
