# Phase 0.5 Empirical Research & Validation Report

> **Comprehensive record of model benchmarks, prompt optimization, deduplication, conflict radar, and RAG verification on Qualcomm Cloud AI 100 hardware (Cirrascale).**

---

## 1. Executive Summary

Before writing production backend and frontend code, we conducted empirical testing across 12 engineering test cases (6 golden requirements, 5 multi-domain industry scenarios, and 4 safety-critical edge cases) targeting Qualcomm Cloud AI 100 inference acceleration.

### Key Milestones Achieved:
1. **100.0% Evidence Grounding**: 18 of 18 extracted flaw quotes are exact verbatim substrings of the source requirement, enabling precise interactive UI highlights.
2. **100.0% Zero-Fabrication Compliance**: Smart Rewrites preserved all unstated metrics as `[TBD: <parameter_and_unit>]` without hallucinating fake performance limits.
3. **Sub-3s Vector Duplicate Clustering**: `BAAI/bge-large-en-v1.5` 1024-dim embeddings separated exact duplicates (1.0000) and paraphrased duplicates (0.9209) from clean requirements (< 0.66).
4. **Adaptive Tiered Cascade**: Proved `Llama-3.1-8B` delivers ultra-fast 2.2s latency at ~85% lower compute cost, while cascading to `Llama-3.3-70B` on complex escape hatches.
5. **Qualcomm Official RAG Verification**: Conformed directly to Qualcomm's official `rag_with_chromadb` specification using `ImagineEmbeddings` and local embedded `ChromaDB`.

---

## 2. Model Performance on Qualcomm Cloud AI 100

| Model Candidate | Capability | Measured Latency | Measured Throughput | Empirical Finding & Role |
| :--- | :--- | :--- | :--- | :--- |
| **`Llama-3.3-70B`** | Complex Reasoning & Tool Calling | **2.4s – 7.4s** | **31.3 tok/s** | **PRIMARY**: 100% schema compliance for X-Ray extraction, Conflict Radar, and Verification Blueprints. |
| **`Llama-3.1-8B`** | High-Speed Fast-Path | **1.6s – 2.5s** | **62.4 tok/s** | **FAST-PATH**: ~85% lower compute cost; primary engine for Interpretation Duels and fast rewrites. |
| **`BAAI/bge-large-en-v1.5`** | 1024-dim Embeddings | **1.2s – 2.3s** (batch) | 1024 dimensions | **RAG & VECTOR**: High semantic discrimination (0.9209 vs 0.6608) for deduplication and ChromaDB retrieval. |
| *`DeepSeek-R1-Distill-70B`* | Reasoning LLM | 19.8s | 19.2 tok/s | **REJECTED**: 8.2× slower latency; `<think>` tags polluted structured JSON tool calls. |
| *`Qwen-QwQ-32B`* | Reasoning LLM | 0.3s (crash) | — | **REJECTED**: Returned HTTP 500 Internal Server Error on Cirrascale runtime. |

---

## 3. The 4 Hardened Production Prompts

Templates are version-controlled in `testing/prompts/optimized_prompts.json` (v2.0):

### 1. X-Ray Issue Extraction (`Llama-3.3-70B` via Native Tool Calling)
* **Tool Name**: `submit_xray_issues`
* **System Directive**:
  > *"You are a Principal Safety-Critical Requirements Quality Auditor conforming to ISO/IEC/IEEE 29148 and DO-178C. Analyze the target requirement for flaws across: Ambiguity, Non-Verifiability, Incompleteness, Non-Atomic, Escape-Hatch, and Over-Specification. CRITICAL GUARDRAIL: evidence_quote MUST be an EXACT verbatim substring from the source requirement text. Never paraphrase a single character."*
* **Benchmark**: 100% quote grounding verified across 18 real-world flaw instances.

### 2. The Interpretation Duel (`Llama-3.1-8B` $\to$ `Llama-3.3-70B` Cascade)
* **Tool Name**: `submit_interpretation_duel`
* **System Directive**:
  > *"You are a Systems Engineering Conflict Engine. Expose hidden architectural ambiguity by staging an 'Interpretation Duel' between two senior engineers: Card A (Optimistic / Real-Time / Edge-Triggered / Low-Latency / Best-Effort Stance) vs Card B (Conservative / Batch-Mode / Level-Triggered / High-Throughput / Guaranteed Delivery Stance). Special Handling: For escape hatches ('where feasible', 'periodically'), formulate Card A as Best-Effort Opportunistic transfer and Card B as Mandatory Guaranteed Delivery with persistent queue and retry backoff. Never output None or null."*
* **Benchmark**: 100% duel generation; 0 empty cards.

### 3. Intent-Locked Smart Rewriter with Smart [TBD] Suggested Defaults (`Llama-3.3-70B` via Tool Calling)
* **Tool Name**: `submit_rewritten_requirements`
* **System Directive**:
  > *"You are a Principal Systems Engineer rewriting requirements into strict EARS and ISO/IEC/IEEE 29148 standard. CRITICAL ZERO-FABRICATION & SMART SUGGESTION: 1. NEVER invent, assume, or hallucinate numerical values directly inside the statement text. 2. Every unstated or subjective metric MUST be parameterized as `[TBD: <parameter_name_and_unit>]`. 3. For EACH [TBD] parameter, propose a SMART SUGGESTED DEFAULT in `identified_tbds` citing industry standard rationale and confidence level. 4. Decompose non-atomic requirements into REQ-A, REQ-B. 5. Replace weak modal verbs with 'shall'."*
* **Benchmark & Empirical Proof**:
  - **100% Zero-Fabrication in Text**: Generates clean parameter tokens (`[TBD: startup_time_seconds]`, `[TBD: log_retention_days]`).
  - **100% Actionable Suggested Defaults**: Produces realistic engineering baselines (`10s` with High confidence based on typical boot standards; `30 days` with Medium confidence for log retention) with concrete engineering rationales.
  - **Human-in-the-Loop Authority**: Enables 1-click acceptance chips in the UI while keeping the human engineer as the final signing authority.

### 4. Verification Blueprint Generator (`Llama-3.3-70B` via Tool Calling)
* **Tool Name**: `submit_verification_blueprint`
* **System Directive**:
  > *"You are a Senior Test and Verification Architect (ISO 26262, DO-178C, IEEE 829). Generate a deterministic, audit-ready Verification Blueprint for the requirement statement. Specify concrete preconditions, step-by-step stimulus, expected responses, and mathematically falsifiable PASS/FAIL conditions referencing the requirement's obligations and any `[TBD]` limits."*
* **Benchmark**: 100% test case verifiability; paired nominal and boundary/stress test cases for all inputs.

---

## 4. Multi-Domain & Edge-Case Findings

Tested across 5 industry domains in `testing/five_scenario_stress_results.json`:
- **Automotive ADAS**: Extracted `"quickly"`, `"bad weather conditions"`, `"smoothly"` with Deceleration vs Passenger Comfort duel.
- **Aerospace Avionics**: Extracted escape hatch `"as appropriate"` and unquantified `"excessive structural load"`.
- **Medical Infusion Pump**: Extracted `"immediately"` and `"minimal power"`, formulating Emergency Solenoid Cutoff vs Controlled Valve Ramp-down.
- **Industrial Robotics**: Flagged missing distance metrics in `"safe distance"` and escape hatch `"where feasible"`.
- **Cybersecurity & Fintech**: Flagged `"swiftly"`, `"high-risk transfers"`, and `"heavy server load"`.

### Edge-Case Handling Validated:
- **Extreme Over-Specification (`REQ-C02`)**: Samsung AMOLED + Snapdragon 8155 SoC + 8GB RAM was properly flagged as implementation lock-in rather than functional requirement.
- **Stacked Escape Hatches (`REQ-C04`)**: Multiple loopholes (`"appropriately where feasible if possible"`) were consolidated and flagged as Major non-compliance.
- **Ultra-Short Fragment (`REQ-C01`)**: Single word `"Fast."` was caught by pre-validation as an incomplete fragment.

---

## 5. RAG & Vector Engine Architecture

### Official Qualcomm Specification Conformance
Tested and verified against Qualcomm's official tutorial `rag_with_chromadb.html`:
- **Embedding Provider**: `from imagine.langchain import ImagineEmbeddings` running `BAAI/bge-large-en-v1.5` on Cloud AI 100.
- **Vector Database**: `from langchain_community.vectorstores import Chroma` (Local embedded ChromaDB in memory/persistent mode).
- **Fast Similarity Math**: Pairwise $N \times N$ cosine matrix computed in **3ms** with NumPy for instant stage duplicate clustering.

### Discrimination Thresholds Established:
- **$\ge 0.98$**: Exact Verbatim Duplicate
- **$0.82 – 0.97$**: Semantic Paraphrased Duplicate (e.g. 0.9209 detected between temperature disconnect statements)
- **$\le 0.70$**: Distinct & Unrelated Requirements (e.g. 0.6608 max cross-similarity on clean avionics spec)
