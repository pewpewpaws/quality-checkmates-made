# Phase 1: Backend Foundation & Conversational Copilot Findings

> **Comprehensive record of Backend Foundation architecture, Dual-Key Governance state machines, Qualcomm Cloud AI 100 SDK integration, and Agent-in-the-Loop (AITL) Conversational Copilot optimization.**

---

## 1. Executive Summary

Phase 1 established the core backend architecture and intelligent pipeline for the **Requirement Quality Copilot (PSE-01)** running on **Qualcomm Cloud AI 100** inference acceleration via Cirrascale. 

Building upon the empirical benchmarks of Phase 0.5, Phase 1 delivered:
1. **Production FastAPI Service & Pydantic v2 Domain Models**: Contractual schema representations for requirements, dual-key sign-offs, X-Ray flaw cards, 100-point rubric scores, and verification blueprints.
2. **Dual-Key Governance State Machine**: Enforces a strict 3-state enterprise lifecycle (`🔴 FLAGGED_TBD` $\to$ `🟡 PROVISIONAL_PM` $\to$ `🟢 LOCKED_BASELINE`) preventing unvetted requirements from reaching downstream engineering.
3. **Multi-Format Ingestion Engine**: Robust parser supporting raw pasted text, numbered lists, REQ-tagged blocks, CSV, TXT, and PDF documents.
4. **Resilient Qualcomm AI 100 Adapter**: Async `ImagineAsyncClient` integration with 60s timeouts and automated fallback mock adapters for live venue pitch resilience.
5. **Conversational Requirement Copilot**: A multi-turn requirements synthesis copilot grounded in uploaded Project Charters, achieving **100.0% AITL Pass Rate** across 4 mission-critical engineering domains.
6. **Complete Test Suite Passing**: 26/26 automated unit tests validating API routes, parsing logic, governance transitions, and copilot extraction.

---

## 2. Backend Foundation & Architecture

### 2.1 Technology Stack & Standards
- **Runtime Environment**: Python 3.11+ managed strictly via `/home/anair/.local/bin/uv`.
- **Framework**: FastAPI (async route handlers).
- **Validation & Serialization**: Pydantic v2 schemas (`RequirementStatement`, `DualKeySignOff`, `IssueCard`, `QualityScore`, `RewriteSuggestion`, `VerificationPlan`).
- **AI Acceleration**: Qualcomm `imagine-sdk` (v0.4.2) connecting to Cirrascale AI100 cluster (`https://aisuite.cirrascale.com/apis/v2`).

### 2.2 Dual-Key Governance State Machine
To bridge the communication and accountability gap between Product Management and Systems Engineering, requirements progress through three strictly governed states:

```mermaid
stateDiagram-v2
    [*] --> FLAGGED_TBD: Ingestion / Generation
    FLAGGED_TBD --> PROVISIONAL_PM: PM accepts/edits target threshold
    PROVISIONAL_PM --> LOCKED_BASELINE: Technical Lead signs off with hardware rationale
    PROVISIONAL_PM --> FLAGGED_TBD: Scope change / New ambiguity
    LOCKED_BASELINE --> PROVISIONAL_PM: Engineering change request
```

1. `🔴 FLAGGED_TBD`: Default state for any newly parsed or synthesized requirement containing unresolved metrics (`[TBD: ...]`).
2. `🟡 PROVISIONAL_PM`: Product Manager has selected or proposed a business/operational target. Not yet approved for implementation.
3. `🟢 LOCKED_BASELINE`: Technical Lead has verified physical/hardware feasibility (e.g. CAN bus bandwidth, sensor latency, thermal envelope) and recorded an auditable sign-off receipt (`DualKeySignOff`). Only `LOCKED_BASELINE` requirements may export to DOORS/Jira or generate test blueprints.

---

## 3. Conversational Copilot & AITL Prompt Optimization

### 3.1 Purpose & Workflow
The Conversational Requirement Copilot allows Product Managers to speak naturally in colloquial English (e.g. *"When the battery gets too hot, make sure we turn on the pump and warn the driver"*). The copilot decomposes informal talk into formal, atomic EARS requirements strictly grounded in uploaded Project Documentation Context (charters, hardware specs, safety envelopes).

### 3.2 The Qualcomm AI100 Tool-Calling Discovery & Resolution
During early iterations of the Conversational Copilot harness on `Llama-3.3-70B`, an unexpected runtime behavior was identified:
- **Symptom**: On multi-part inputs (such as Edge IoT Gateway), the model returned empty tool call arguments (`Function(name='', arguments='{}')`).
- **Root-Cause Analysis**: Deeply nested JSON schemas (array of requirement objects containing nested arrays of TBD parameter objects) exceeded the structured output parsing budget of the Cirrascale tool-calling pipeline.
- **Architectural Solution**: Flattened the function-calling schema (`submit_chat_requirements`) so that `identified_tbds` exists as a top-level array alongside `requirements`, paired with deterministic name-matching in the backend parser.
- **Result**: Immediate elimination of empty tool calls and 100% schema compliance across all domains.

### 3.3 Prompt Evolution (PROMPT_V2.0 $\to$ PROMPT_V2.4)
The system prompt was iteratively hardened with strict mandates:
1. **Zero-Fabrication Rigor**: Explicitly forbids unquantified subjective terms (e.g., *"beep loudly"*, *"respond quickly"*) in contractual text. All subjective qualities must be parameterized as `[TBD: <parameter_name_and_unit>]`.
2. **Actionable Suggested Defaults**: For each `[TBD]` token, the AI must propose a realistic numerical baseline with engineering rationale grounded in the Project Context or safety standard.
3. **Mandatory Modal Verbs**: Replaces colloquial phrasing (*"we need to"*, *"make sure"*, *"should"*) with binding *"shall"*.

### 3.4 Empirical AITL Benchmark Scoreboard
Evaluated on **Qualcomm Cloud AI 100** cluster (`Llama-3.3-70B`) across 4 diverse engineering domains:

| Scenario ID | Industry Domain | Qualcomm AI100 Latency | Zero-Fabrication (`[TBD]`) | Modal (`shall`) | Atomic Decomp | Smart Defaults | Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`CASE-1-BMS`** | Automotive 800V BMS Thermal Loop | **29.84s** | 100% | 100% | 100% (2 reqs) | 100% | 🟢 **PASS** |
| **`CASE-2-AEB`** | Autonomous Braking & Debris Filtering | **29.59s** | 100% | 100% | 100% (2 reqs) | 100% | 🟢 **PASS** |
| **`CASE-3-MED`** | Clinical Infusion Occlusion Safety | **30.93s** | 100% | 100% | 100% (2 reqs) | 100% | 🟢 **PASS** |
| **`CASE-4-IOT`** | Connected Vehicle Telematics & Buffer | **25.29s** | 100% | 100% | 100% (2 reqs) | 100% | 🟢 **PASS** |
| **Composite** | **All 4 Scenarios** | **28.91s avg** | **100.0%** | **100.0%** | **100.0%** | **100.0%** | 🟢 **100.0% PASS** |

#### Verbatim Example Output (`CASE-1-BMS`):
```text
PM Input: "Hey copilot, when the battery gets too hot while fast charging, we need the coolant pump to turn on, and warn the driver so the car doesn't burn down."
Context Grounding: Safety Envelope: Maximum cell surface temperature permitted during fast charging is 55°C. Thermal runaway onset boundary is 60°C. ISO 26262 ASIL-D.

Decomposed Requirements:
1. [Safety]: When the battery temperature exceeds [TBD: temperature_threshold_degC] during fast charging, the system shall turn on the coolant pump within [TBD: response_time_seconds].
   💡 Default: temperature_threshold_degC = 55 (Based on the project charter's safety envelope)
   💡 Default: response_time_seconds = 5 (Standard automotive thermal loop response limit)
2. [Safety]: When the battery temperature exceeds [TBD: temperature_threshold_degC] during fast charging, the system shall issue a warning to the driver within [TBD: response_time_seconds].
   💡 Default: temperature_threshold_degC = 55 (Based on project charter ASIL-D warning protocol)
```

---

## 4. Test Suite & Validation Receipts

The Phase 1 backend was validated via automated pytest execution:
```bash
/home/anair/.local/bin/uv run pytest backend/tests
```
**Results (26/26 Passing in 1.43s)**:
- `backend/tests/test_api.py` (6 tests): Healthcheck, raw ingestion, sign-off workflow, status filtering, export formats.
- `backend/tests/test_chat_copilot.py` (4 tests): Conversational synthesis, charter context injection, TBD extraction, mock fallback.
- `backend/tests/test_parser.py` (3 tests): Markdown lists, REQ-tagged statements, delimiter handling.
- `backend/tests/test_pm_documents.py` (10 tests): Multi-document CRUD, charter context retrieval, document locking, overwrite guards.
- `backend/tests/test_schemas.py` (3 tests): Pydantic serialization, enum integrity, default validation.

---

## 5. Artifacts & Documentation References

| Artifact | Location | Description |
| :--- | :--- | :--- |
| **Backend Implementation** | [`backend/services/qualcomm_service.py`](file:///home/anair/Desktop/Coding/Oi-Thon/backend/services/qualcomm_service.py) | Qualcomm Cloud AI 100 service wrapper with fallback mock. |
| **AITL Evaluation Harness** | [`testing/aitl_chat_copilot_eval.py`](file:///home/anair/Desktop/Coding/Oi-Thon/testing/aitl_chat_copilot_eval.py) | Automated prompt optimization test harness running live on AI100. |
| **Production Prompts** | [`docs/prompts/optimized_prompts.json`](file:///home/anair/Desktop/Coding/Oi-Thon/docs/prompts/optimized_prompts.json) | Version-controlled prompt library (v2.4). |
| **API Specifications** | [`docs/api/endpoints.md`](file:///home/anair/Desktop/Coding/Oi-Thon/docs/api/endpoints.md) | Exhaustive REST endpoint contracts and payloads. |
| **Living Tracker** | [`AGENTS.md`](file:///home/anair/Desktop/Coding/Oi-Thon/AGENTS.md) | Phase status, directives, and architecture map. |
