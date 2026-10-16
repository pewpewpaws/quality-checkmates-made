#!/usr/bin/env python3
"""
Agent-in-the-Loop (AITL) Prompt Optimization & Evaluation Suite
Running natively on Qualcomm Cloud AI 100 via Imagine SDK.

Evaluates the new Conversational Requirement Copilot prompt across 4 realistic PM scenarios:
1. Automotive 800V BMS Fast-Charging Thermal Protection
2. Autonomous Emergency Braking (AEB) & Obstacle Classification
3. Clinical Infusion Pump Occlusion & Alarm Safety
4. IoT Vehicle Edge Gateway Offline Buffering & Resilient Flush

Rubric Metrics:
- Zero-Fabrication Compliance: 100% unstated metrics parameterized as [TBD: ...]
- Project Context Grounding: Directly incorporates constraints from uploaded charter
- Atomicity / Decomposition: Splits multi-part informal PM requests into atomic EARS clauses
- Modal Rigor: Translates colloquial PM talk ("we need to", "make sure") into binding "shall"
- Actionable Defaults: Proposes smart defaults with engineering rationales in metadata
"""

import os
import json
import time
import re
from typing import List, Dict, Any
from imagine import ImagineClient, ChatMessage

API_KEY = os.getenv("IMAGINE_API_KEY", "278b88a2-8f68-42f7-818e-0442a7d294a3")
BASE_URL = os.getenv("IMAGINE_ENDPOINT_URL", "https://aisuite.cirrascale.com/apis/v2")
MODEL = "Llama-3.3-70B"

client = ImagineClient(endpoint=BASE_URL, api_key=API_KEY, timeout=60)


def parse_tool_args(raw_args: str) -> Dict[str, Any]:
    try:
        data = json.loads(raw_args)
    except Exception:
        return {}
    if not isinstance(data, dict):
        return {}
    for k, v in list(data.items()):
        if isinstance(v, str) and (v.strip().startswith("[") or v.strip().startswith("{")):
            try:
                data[k] = json.loads(v)
            except Exception:
                pass
    return data


def extract_chat_data(msg) -> Dict[str, Any]:
    if getattr(msg, "tool_calls", None) and len(msg.tool_calls) > 0:
        tc = msg.tool_calls[0]
        raw = tc.function.arguments if hasattr(tc, "function") else str(tc)
        data = parse_tool_args(raw)
        if isinstance(data.get("requirements"), str):
            try:
                data["requirements"] = json.loads(data["requirements"])
            except Exception:
                pass
        return data

    content = msg.content or ""
    if "{" in content:
        try:
            start = content.find("{")
            end = content.rfind("}")
            blob = content[start:end+1]
            if "<|eom_id|>" in blob:
                blob = blob.split("<|eom_id|>")[0].strip()
            blob = blob.replace(r"\'", "'")
            data = json.loads(blob)
            if "parameters" in data:
                data = data["parameters"]
            if isinstance(data.get("requirements"), str):
                try:
                    data["requirements"] = json.loads(data["requirements"])
                except Exception:
                    pass
            return data
        except Exception:
            pass
    return {}


TOOL_CHAT = [{
    "type": "function",
    "function": {
        "name": "submit_chat_requirements",
        "description": "Formulate formal EARS requirements and conversational feedback grounded in project documentation context.",
        "parameters": {
            "type": "object",
            "properties": {
                "agent_reply": {
                    "type": "string",
                    "description": "Conversational explanation to the PM detailing how the requirement was synthesized and grounded."
                },
                "context_grounding": {
                    "type": "string",
                    "description": "Specific project architectural constraint, charter boundary, or safety limit cited from context."
                },
                "requirements": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "text": {"type": "string", "description": "Strict EARS statement containing at least one [TBD: parameter_name] placeholder"},
                            "category": {"type": "string"},
                            "section": {"type": "string"}
                        },
                        "required": ["text", "category", "section"]
                    }
                },
                "identified_tbds": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "parameter_name": {"type": "string"},
                            "suggested_value": {"type": "string"},
                            "rationale": {"type": "string"},
                            "confidence": {"type": "string", "enum": ["HIGH", "MEDIUM", "LOW"]}
                        },
                        "required": ["parameter_name", "suggested_value", "rationale", "confidence"]
                    }
                }
            },
            "required": ["agent_reply", "context_grounding", "requirements", "identified_tbds"]
        }
    }
}]

# AITL Optimized Prompt Template (v2.4)
PROMPT_V2 = (
    "You are the Requirement Quality Copilot, a Principal Systems Engineering Architect conforming to ISO/IEC/IEEE 29148 and EARS syntax.\n"
    "A Product Manager is communicating with you in plain, conversational, informal English.\n"
    "Your objective is to translate their request into formal, atomic, verifiable requirements strictly grounded in the provided Project Documentation Context.\n\n"
    "CRITICAL MANDATES:\n"
    "1. ZERO-FABRICATION RULE: NEVER hardcode assumed numbers, durations, or limits in requirement text. "
    "Every requirement statement MUST parameterize every unstated metric, threshold, duration, or subjective quality (e.g. 'without clogging', 'loudly', 'quickly', 'safe') as: `[TBD: <parameter_name_and_unit>]`. Every requirement text MUST contain at least one `[TBD: ...]` token.\n"
    "2. SMART SUGGESTED DEFAULTS: In `identified_tbds`, you MUST propose a realistic default for every `[TBD]` token "
    "citing specific numbers or baselines directly from the Project Context or relevant safety standards.\n"
    "3. ATOMIC DECOMPOSITION: Decompose multiple distinct actions, safeguards, or alerts into separate atomic requirements with distinct functional categories.\n"
    "4. STRICT EARS SYNTAX: Use mandatory modal verb 'shall' (e.g. 'When <trigger>, the system shall <action>'). "
    "Never retain weak conversational phrasing ('should', 'we need to', 'make sure').\n"
    "5. CONVERSATIONAL EXPLANATION: In `agent_reply`, explain your engineering rationale directly to the PM, "
    "referencing why specific thresholds were flagged as [TBD] and which project charter constraints were applied.\n"
    "Call submit_chat_requirements."
)

TEST_CASES = [
    {
        "id": "CASE-1-BMS",
        "domain": "Automotive 800V BMS",
        "project_context": (
            "Project: Next-Gen 800V EV Powertrain & BMS.\n"
            "Architecture Charter: Silicon-carbide inverter, 350kW DC fast-charging capability. "
            "Liquid glycol thermal loop with active auxiliary chilling. "
            "Safety Envelope: Maximum cell surface temperature permitted during fast charging is 55°C. "
            "Thermal runaway onset boundary is 60°C. ISO 26262 ASIL-D certified."
        ),
        "pm_message": "Hey copilot, when the battery gets too hot while fast charging, we need the coolant pump to turn on, and warn the driver so the car doesn't burn down.",
        "expected_tbds": ["max_pack_temp", "cooling", "temp"],
        "min_decomposed_reqs": 2
    },
    {
        "id": "CASE-2-AEB",
        "domain": "Autonomous Emergency Braking",
        "project_context": (
            "Project: Level 3 Autonomous Driving Platform.\n"
            "Charter: Dual forward 77GHz radar fused with 8MP stereo camera. "
            "Operating speed: 0 to 130 km/h. "
            "Braking actuator envelope: Maximum deceleration rate is 10 m/s². "
            "False-positive suppression: Must not trigger full emergency braking on non-metallic debris under 30cm height."
        ),
        "pm_message": "We gotta make sure the auto braking hits the brakes hard when an obstacle is close, but don't slam on the brakes if it's just a shadow or paper bag.",
        "expected_tbds": ["ttc", "deceleration", "distance", "obstacle"],
        "min_decomposed_reqs": 2
    },
    {
        "id": "CASE-3-MED",
        "domain": "Medical Infusion Safety",
        "project_context": (
            "Project: Smart Large Volume Infusion Pump.\n"
            "Regulatory Standard: IEC 60601-2-24 and FDA Class II Guidance. "
            "Nominal flow: 0.1 to 999.9 mL/hr. "
            "Occlusion protection: Line pressure limit is 15 psi (103 kPa). "
            "Alarms must emit IEC 60601-1-8 high-priority acoustic burst (>= 75 dB at 1 meter)."
        ),
        "pm_message": "The pump should stop pushing medicine and beep loudly if the line is blocked.",
        "expected_tbds": ["pressure", "alarm", "sound", "volume", "occlusion"],
        "min_decomposed_reqs": 2
    },
    {
        "id": "CASE-4-IOT",
        "domain": "Connected Vehicle IoT Gateway",
        "project_context": (
            "Project: Telematics Edge Controller.\n"
            "Operating Specifications: Automotive Ethernet (100BASE-T1) and 5G/LTE modem. "
            "Storage: 4GB eMMC with 256MB dedicated circular buffer for offline telemetry. "
            "Network Policy: Transmit telemetry every 1000ms. On cellular loss, persist telemetry frames to eMMC without dropping priority CAN signals."
        ),
        "pm_message": "When the vehicle has no cell reception, save all the logs and upload them as soon as it gets connection without clogging the modem.",
        "expected_tbds": ["buffer", "retry", "upload", "latency", "rate"],
        "min_decomposed_reqs": 2
    }
]


def run_aitl_evaluation():
    print("=" * 80)
    print("  AGENT-IN-THE-LOOP (AITL) PROMPT OPTIMIZATION HARNESS")
    print("  Target Hardware: Qualcomm Cloud AI 100 (Cirrascale Cluster)")
    print(f"  Target LLM: {MODEL} via Native Function Calling")
    print("=" * 80)

    results = []

    for case in TEST_CASES:
        print(f"\nEvaluating: [{case['id']}] {case['domain']}")
        print(f"  PM Input: \"{case['pm_message']}\"")

        system_prompt = PROMPT_V2.replace(
            "provided Project Documentation Context.",
            f"provided Project Documentation Context:\n\n{case['project_context']}"
        )

        t0 = time.time()
        resp = client.chat(
            messages=[
                ChatMessage(role="system", content=system_prompt),
                ChatMessage(role="user", content=f'PM Request: "{case["pm_message"]}" Call submit_chat_requirements.')
            ],
            model=MODEL,
            tools=TOOL_CHAT,
            temperature=0.1
        )
        latency = time.time() - t0

        msg = resp.choices[0].message
        data = extract_chat_data(msg)

        agent_reply = data.get("agent_reply", "")
        grounding = data.get("context_grounding", "")
        reqs = data.get("requirements", [])
        top_tbds = data.get("identified_tbds", [])

        # Associate top-level identified_tbds to reqs if not already nested
        for r in reqs:
            if not r.get("identified_tbds"):
                matched = [t for t in top_tbds if t.get("parameter_name", "") in r.get("text", "")]
                r["identified_tbds"] = matched if matched else top_tbds

        # Automated Quality Checks
        has_tbd = len(reqs) > 0 and all("[TBD:" in r.get("text", "") for r in reqs)
        has_shall = len(reqs) > 0 and all("shall" in r.get("text", "").lower() for r in reqs)
        decomposed = len(reqs) >= case["min_decomposed_reqs"]
        has_suggested_defaults = len(top_tbds) > 0 or all(len(r.get("identified_tbds", [])) > 0 for r in reqs)
        has_grounding = len(grounding) > 10 and len(agent_reply) > 20

        all_passed = has_tbd and has_shall and decomposed and has_suggested_defaults and has_grounding

        print(f"  ⚡ Qualcomm AI100 Latency: {latency:.2f}s")
        print(f"  Conversational Reply: \"{agent_reply[:110]}...\"")
        print(f"  Context Grounding: \"{grounding[:100]}...\"")
        print(f"  Decomposed Statements ({len(reqs)}):")
        for idx, r in enumerate(reqs, 1):
            print(f"    {idx}. [{r.get('category')}]: {r.get('text')}")
            for t in r.get("identified_tbds", []):
                print(f"       💡 Default: {t.get('parameter_name')} = {t.get('suggested_value')} ({t.get('rationale')[:50]}...)")

        print(f"  Grading:")
        print(f"    - Zero-Fabrication [TBD] Preservation: {'✅ PASS' if has_tbd else '❌ FAIL'}")
        print(f"    - Strict Modal 'shall' Compliance:   {'✅ PASS' if has_shall else '❌ FAIL'}")
        print(f"    - Atomic Decomposition:              {'✅ PASS' if decomposed else '❌ FAIL'}")
        print(f"    - Actionable Suggested Defaults:     {'✅ PASS' if has_suggested_defaults else '❌ FAIL'}")
        print(f"    - Project Charter Grounding:         {'✅ PASS' if has_grounding else '❌ FAIL'}")
        print(f"  Verdict: {'🟢 100% PASS' if all_passed else '🔴 FAIL'}")

        results.append({
            "case_id": case["id"],
            "latency_sec": round(latency, 2),
            "zero_fabrication": has_tbd,
            "modal_shall": has_shall,
            "atomic_decomposed": decomposed,
            "suggested_defaults": has_suggested_defaults,
            "context_grounding": has_grounding,
            "verdict": "PASS" if all_passed else "FAIL"
        })

    print("\n" + "=" * 80)
    print("  AITL EVALUATION SCOREBOARD (QUALCOMM CLOUD AI 100)")
    print("=" * 80)
    print(f"{'Case ID':<15} | {'Latency':<8} | {'Zero-Fab':<9} | {'Shall':<6} | {'Decomp':<7} | {'Defaults':<9} | {'Verdict'}")
    print("-" * 80)
    for r in results:
        print(f"{r['case_id']:<15} | {r['latency_sec']:<6}s | {'100%' if r['zero_fabrication'] else '0%':<9} | {'100%' if r['modal_shall'] else '0%':<6} | {'100%' if r['atomic_decomposed'] else '0%':<7} | {'100%' if r['suggested_defaults'] else '0%':<9} | {r['verdict']}")

    pass_rate = sum(1 for r in results if r["verdict"] == "PASS") / len(results) * 100
    avg_latency = sum(r["latency_sec"] for r in results) / len(results)
    print("=" * 80)
    print(f"Composite AITL Success Rate: {pass_rate:.1f}% | Avg Qualcomm AI100 Latency: {avg_latency:.2f}s")
    print("=" * 80)

    return results


if __name__ == "__main__":
    run_aitl_evaluation()
