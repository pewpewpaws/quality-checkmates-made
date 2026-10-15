# AGENTS.md — Development Guidelines & Living Project Tracker

> **Central operational guide and living implementation tracker for the Requirement Quality Copilot (PSE-01).**  
> *Modular rules are separated under `.agents/rules/`:*
> - [`documentation.md`](file:///home/anair/Desktop/Coding/Oi-Thon/.agents/rules/documentation.md) — Documentation-first policy & mapping guide
> - [`project_standards.md`](file:///home/anair/Desktop/Coding/Oi-Thon/.agents/rules/project_standards.md) — Qualcomm AI 100 directives, zero-fabrication & governance
> - [`brutal_candor.md`](file:///home/anair/Desktop/Coding/Oi-Thon/.agents/rules/brutal_candor.md) — Radical candor & objective evaluation filter for all ideas
> - [`git_workflow.md`](file:///home/anair/Desktop/Coding/Oi-Thon/.agents/rules/git_workflow.md) — Commit-after-every-change policy (Strictly local, no push)

---

## 1. Project Mission & Hackathon Context

> 🏆 **HACKATHON CONTEXT**: This project is built for a competitive AI hackathon targeting **Problem Statement PSE-01 (Requirement Quality Copilot)**, running on **Qualcomm Cloud AI 100** inference acceleration via Cirrascale.

### Hackathon Success Directives:
1. **Pitch-Ready Live Demo (< 3 min)**: The system must execute end-to-end (Document Parse $\to$ Issue X-Ray $\to$ Interpretation Duel $\to$ Rewrite $\to$ Verification Blueprint) in under 3 minutes with zero loading stalls.
2. **High-Impact Differentiators**: Judges look for depth beyond a basic chatbot wrapper. Highlight the **Interpretation Duel** (visual card selector), **Intent-Locked Diff Validator** (semantic safety), and **Deterministic Rubric Receipts**.
3. **Documentation First**: Whenever you implement a new module, endpoint, schema, or algorithm, **you MUST update the relevant documentation in `docs/` or `PROJECT_DOCUMENTATION.md`** in the same turn.
4. **Use `uv` for Everything**: All Python environments, dependencies, and script executions must strictly go through `uv` (`uv venv`, `uv pip install`, `uv run ...`).
5. **Zero Fabrication Policy**: Never invent numbers, boundaries, or operating conditions. In rewrites and extractions, unknown values must strictly remain `[TBD: <parameter>]`.
6. **Deterministic Scoring**: Scores come from a documented 100-point rubric with line-item deduction receipts, never an unexplained model number.
7. **Evidence Grounding**: Issue cards must quote exact source substrings so the frontend can highlight them interactively.
8. **Demo Resilience & Offline Fallback**: Build a mock/cached fallback mode so the application functions flawlessly on stage even if conference Wi-Fi falters.
9. **Continuous HACKATHON.md Sync**: Whenever the user shares unique ideas, architectural insights, pitch angles, or demo suggestions, **you MUST immediately log and update them in `HACKATHON.md`** under the appropriate section (Differentiators, Pitch Playbook, Q&A Defense, or Living Ideas Log).

---

## 2. Environment & Tooling Standards

* **Package & Environment Manager**: `/home/anair/.local/bin/uv`
* **Python Version**: CPython 3.11+ in `.venv`
* **Qualcomm SDK**: `imagine-sdk` (v0.4.2) installed locally via `uv pip install ./imagine_sdk-0.4.2-py3-none-any.whl`
* **Backend**: FastAPI with async handlers (`ImagineAsyncClient` with `timeout=60.0`)
* **Data Schemas**: Pydantic v2 models

### Environment Variables:
```bash
export IMAGINE_API_KEY="278b88a2-8f68-42f7-818e-0442a7d294a3"
export IMAGINE_ENDPOINT_URL="https://aisuite.cirrascale.com/apis/v2"
```

---

## 3. Approved Qualcomm AI Model Assignments

Based on empirical benchmarks on the Cirrascale AI100 cluster:

| Capability | Model | Protocol / Method |
| :--- | :--- | :--- |
| **X-Ray Issue Extraction** | `Llama-3.3-70B` | Tool / Function Calling (`tools` schema) |
| **Conflict Radar** | `Llama-3.3-70B` | Deep logical reasoning |
| **Smart Rewriter** | `Llama-3.3-70B` | Direct generation / Tool Calling (preserves `[TBD]`, zero fabrication) |
| **Interpretation Duel** | `Llama-3.1-8B` $\to$ `Llama-3.3-70B` (Cascade) | 8B fast path (2.2s, 85% cheaper); cascades to 70B if ambiguity is unresolved |
| **Verification Blueprint** | `Llama-3.3-70B` | Test case and acceptance criteria generator |
| **Duplicate Clustering** | `BAAI/bge-large-en-v1.5` | `client.embeddings()` (1024-dim cosine matrix) |



*Note: Do NOT use `DeepSeek-R1-Distill-Llama-70B` (too slow at 20s) or `Qwen-QwQ-32B` (runtime 500 error).*




---

## 4. Documentation Mapping & Maintenance Guide

Keep documentation synchronized in these specific locations:

| Implementation Area | Documentation to Update |
| :--- | :--- |
| **REST Endpoints / Payloads** | [`docs/api/endpoints.md`](file:///home/anair/Desktop/Coding/Oi-Thon/docs/api/endpoints.md) & [`docs/api/openapi.json`](file:///home/anair/Desktop/Coding/Oi-Thon/docs/api/openapi.json) |
| **SDK Usage / Client Wrappers** | [`docs/sdk/client_reference.md`](file:///home/anair/Desktop/Coding/Oi-Thon/docs/sdk/client_reference.md) & [`docs/sdk/tool_calling.md`](file:///home/anair/Desktop/Coding/Oi-Thon/docs/sdk/tool_calling.md) |
| **Rubric Scoring & Math** | [`docs/project/architecture.md`](file:///home/anair/Desktop/Coding/Oi-Thon/docs/project/architecture.md) |
| **Feature Priorities & Milestones** | [`docs/PROJECT_DOCUMENTATION.md`](file:///home/anair/Desktop/Coding/Oi-Thon/docs/PROJECT_DOCUMENTATION.md) & [`AGENTS.md`](file:///home/anair/Desktop/Coding/Oi-Thon/AGENTS.md) |
| **Model Configs / Benchmarks** | [`docs/models/benchmark_results.md`](file:///home/anair/Desktop/Coding/Oi-Thon/docs/models/benchmark_results.md) |
| **Pitch Strategy, Differentiators & Ideas** | [`HACKATHON.md`](file:///home/anair/Desktop/Coding/Oi-Thon/HACKATHON.md) |

---

## 5. Living Implementation Tracker

### ✅ Phase 0: Discovery & Setup (COMPLETED)
- [x] Analyzed problem statement (`Requirement_Quality_Copilot_Feature_Guide.pdf`).
- [x] Tested Qualcomm Imagine API & Imagine SDK connectivity with live API key.
- [x] Benchmarked all active models on Qualcomm AI100 cluster.
- [x] Setup `.venv` using `uv` and installed `imagine_sdk-0.4.2-py3-none-any.whl`.
- [x] Built modular Markdown documentation in `docs/` (`api/`, `sdk/`, `models/`, `project/`, `scripts/`).

---

### ✅ Phase 0.5: Agent-in-the-Loop Prompt Optimization & Evaluation (COMPLETED)
- [x] Curated golden requirement test cases from feature guide (`docs/datasets/golden_requirements.json`).
- [x] Automated grading with evidence grounding checks, [TBD] zero-fabrication checks, and schema validation.
- [x] Optimized and verified prompts on Qualcomm Cloud AI 100:
  - [x] **X-Ray Issue Extraction**: **100% Grounded Quotes**, 85.0% composite score on `Llama-3.3-70B`.
  - [x] **Smart Rewriter**: **100.0% Zero-Fabrication**, strictly preserved all `[TBD]` placeholders in text + provided actionable **Smart Suggested Defaults with Engineering Rationales** on `Llama-3.3-70B`.
  - [x] **Interpretation Duel**: **100.0% Contrast Score**, generated distinct competing meanings on `Llama-3.1-8B` (with special handling for escape hatches).
  - [x] **Verification Blueprint**: **100.0% Verifiable Tests & Falsifiable Pass/Fail Criteria** referencing `[TBD]` thresholds on `Llama-3.3-70B`.
  - [x] **Qualcomm Official RAG Pipeline**: Conformed and verified against Qualcomm's official `rag_with_chromadb` specification using `ImagineEmbeddings` (`BAAI/bge-large-en-v1.5`) + `ChromaDB`.
- [x] Exported verified prompt templates (v2.0) to [`docs/prompts/optimized_prompts.json`](file:///home/anair/Desktop/Coding/Oi-Thon/docs/prompts/optimized_prompts.json).
- [x] Documented full research findings in [`docs/findings/phase_0_5_research_findings.md`](file:///home/anair/Desktop/Coding/Oi-Thon/docs/findings/phase_0_5_research_findings.md).




---

### ⏳ Phase 1: Backend Foundation (CURRENT)
- [ ] Initialize FastAPI project structure (`backend/`).
- [ ] Implement Pydantic v2 schemas:
  - `RequirementStatement` (`id`, `text`, `category`, `section`, `status`: `DRAFT` | `FLAGGED_TBD` 🔴 | `PROVISIONAL_PM` 🟡 | `LOCKED_BASELINE` 🟢 | `REJECTED`)
  - `DualKeySignOff` (`requirement_id`, `pm_target_val`, `pm_author`, `tech_lead_approver`, `hardware_rationale`, `signed_off_at`)
  - `IssueCard` (`issue_type`, `severity`, `evidence_quote`, `explanation`, `action`)
  - `QualityScore` (100-pt breakdown: Clarity, Verifiability, Completeness, Atomicity, Consistency)
  - `RewriteSuggestion` (original, revised, rationale, identified_tbds with suggested defaults)
  - `VerificationPlan` (method, preconditions, test cases, acceptance criteria)
- [ ] Implement `QualcommService` wrapper using `ImagineAsyncClient`:
  - `timeout=60.0`
  - Automatic fallback / mock adapter for offline demos
- [ ] Implement Document Parser (pasted text, CSV, TXT, PDF).
- [ ] Update `docs/api/endpoints.md` with new backend REST endpoints.

---

### ⏳ Phase 2: Deterministic Engine & Vector Clustering
- [ ] Implement 100-Point Rubric Scoring Engine outside the LLM.
- [ ] Implement Evidence Validator (ensure `evidence_quote` is a strict substring of source).
- [ ] Implement Vector Duplicate Detection & Clustering with `bge-large` embeddings + `numpy` cosine similarity.
- [ ] Update `docs/project/architecture.md` with final deduction math.

---

### ⏳ Phase 3: AI Feature Pipelines
- [ ] Connect `Llama-3.3-70B` tool calling for X-Ray issue detection.
- [ ] Implement Conflict Radar (overlap search + contradictory behavior reasoning).
- [ ] Implement Smart Rewriter on `Llama-3.1-8B` with Intent-Lock validation.
- [ ] Implement Interpretation Duel generator (2 competing plausible meanings).
- [ ] Implement Verification Blueprint generator.

---

### ⏳ Phase 4: Modern Web Frontend (Mock-First / Venue-Ready)
- [ ] Setup React + Vite frontend with dark-mode aesthetic.
- [ ] Build Requirement Input & Parser view.
- [ ] Build Dual-Key Governance UI (1-Click Header Persona Switcher: PM Mode 🟡 <-> Lead Engineer Mode 🟢 sign-off).
- [ ] Build X-Ray Issue Cards with clickable evidence highlighting.
- [ ] Build Interpretation Duel selector cards.
- [ ] Build Intent-Locked side-by-side Diff Viewer.
- [ ] Build Verification Blueprint test plan export (JSON/CSV).
- [ ] Build Mock / Live API Adapter toggle (`VITE_API_MODE="MOCK" | "LIVE"`).

---

### ⏳ Phase 5: On-Site Venue Integration & Pitch Polish
- [ ] Wire live Qualcomm Cloud AI 100 backend endpoints to frontend on-site at the venue.
- [ ] Preload realistic sample requirement datasets (IoT Telemetry, Automotive BMS, Medical Device).
- [ ] Verify complete end-to-end user workflow under 3 minutes for live stage presentation.
