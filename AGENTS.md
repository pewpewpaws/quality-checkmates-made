# AGENTS.md — Development Guidelines & Living Project Tracker

> **Central operational guide and living implementation tracker for the Requirement Quality Copilot (PSE-01).**  
> *Modular rules are separated under `.agents/rules/`:*
> - [`documentation.md`](file:///home/anair/Desktop/Coding/Oi-Thon/.agents/rules/documentation.md) — Documentation-first policy & mapping guide
> - [`project_standards.md`](file:///home/anair/Desktop/Coding/Oi-Thon/.agents/rules/project_standards.md) — Qualcomm AI 100 directives, zero-fabrication & governance
> - [`brutal_candor.md`](file:///home/anair/Desktop/Coding/Oi-Thon/.agents/rules/brutal_candor.md) — Radical candor & objective evaluation filter for all ideas
> - [`git_workflow.md`](file:///home/anair/Desktop/Coding/Oi-Thon/.agents/rules/git_workflow.md) — Commit-after-every-change policy (Strictly local, no push)
> - [`graphify.md`](file:///home/anair/Desktop/Coding/Oi-Thon/.agents/rules/graphify.md) — Knowledge graph usage & continuous graph update policy

---

## 1. Project Mission & Hackathon Context

> 🏆 **HACKATHON CONTEXT**: This project is built for a competitive AI hackathon targeting **Problem Statement PSE-01 (Requirement Quality Copilot)**, running on **Qualcomm Cloud AI 100** inference acceleration via Cirrascale.

### Mandatory Operating Rules & Directives:

1. **Brutal Candor & Anti-Yes-Man Policy**:
   - Zero sycophancy. Never praise an idea just to be agreeable. Treat all proposals as a ruthless Principal Systems Architect & Hackathon Judge.
   - Screen every idea through the 4 Filters: 3-Min Stage Pitch Test, Scope-Creep & Deadline Filter, Qualcomm AI100 Showcase Filter, and Real-World Safety Engineering Reality.
   - Deliver verdicts upfront (🟢 `HIGH IMPACT`, 🟡 `PIVOT REQUIRED`, 🔴 `REJECT`).
   - **Extreme Brevity & Token Efficiency**: Strictly 3-5 punchy bullets maximum. No essays, no lectures, no boilerplate explanations. Prioritize code and execution over commentary.

2. **Git Commit Workflow (Local Commits Only — STRICTLY NEVER PUSH)**:
   - Commit after every completed task or meaningful change using conventional commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`).
   - **STRICT CONSTRAINT: NEVER run `git push` under any circumstances.** All commits remain local.

3. **Documentation-First & Continuous HACKATHON.md Sync**:
   - Whenever an endpoint, schema, or algorithm is added/modified, update the relevant file in `docs/` in the exact same turn.
   - Whenever the user shares an idea, architectural angle, or demo concept, immediately log it in [`HACKATHON.md`](file:///home/anair/Desktop/Coding/Oi-Thon/HACKATHON.md).

4. **Strict `uv` Execution**:
   - All environments, package installs, and python executions must strictly use `/home/anair/.local/bin/uv` (`uv run ...`, `uv pip ...`). Never invoke bare system `pip` or `python`.

5. **Strict Zero-Fabrication Directive**:
   - Never invent, assume, or hardcode numerical values, durations, or limits directly inside requirement text.
   - Unstated or ambiguous metrics must remain `[TBD: <parameter_name_and_unit>]`.
   - Propose **Smart Suggested Defaults** with engineering rationales in metadata (`identified_tbds`) as 1-click UI chips, but never bake them into contractual requirement statements.

6. **Dual-Key Governance & Executive Verification Gate**:
   - Requirements follow a 3-state lifecycle: `🔴 FLAGGED_TBD` $\to$ `🟡 PROVISIONAL_PM` $\to$ `🟢 LOCKED_BASELINE`.
   - UI features a 1-click Header Persona Switcher (`👔 Product Manager` $\longleftrightarrow$ `🛠️ Lead Systems Engineer` $\longleftrightarrow$ `🎖️ Executive`).
   - Unapproved drafts and unquantified `[TBD]` placeholders are strictly shielded from Executive view.
   - Upon Technical Sign-off by the Lead Systems Engineer (`LOCKED_BASELINE`), an executable **Verification Blueprint** (system preconditions, paired nominal/boundary test cases, and falsifiable PASS/FAIL acceptance criteria) is automatically synthesized and bound to the requirement.
   - Only `LOCKED_BASELINE` requirements with validated Verification Blueprints reach the Executive lens and become eligible for publication-grade PDF/CSV export.

7. **Verbatim Evidence Grounding & Deterministic Receipts**:
   - Flaw cards must quote exact, case-sensitive substrings (`evidence_quote`) from source text for interactive UI highlighting.
   - 100-point rubric scores are calculated outside the LLM with itemized mathematical receipts.

8. **Pitch-Ready Live Demo (< 3 min) & Offline Fallback**:
   - Full flow must execute in under 3 minutes.
   - Maintain a mock/cached fallback adapter in `backend/` for stage resilience.

9. **Knowledge Graph Usage & Continuous Graphify Sync**:
   - **Query-First Architecture Navigation**: Before modifying cross-cutting code, tracing data flows, or investigating dependencies, always consult the knowledge graph (`graphify-out/graph.json`) via graphify MCP tools (`query_graph`, `shortest_path`, `get_node`, `god_nodes`) or CLI (`graphify query "<question>"`). Avoid blind brute-force file scanning.
   - **Continuous Zero-Cost Sync**: After adding or modifying code, models, or schemas in a session, immediately run `graphify update .` to keep `graphify-out/graph.json`, `graphify-out/graph.html`, and `graphify-out/GRAPH_REPORT.md` synchronized via AST re-extraction (0 token cost).

---

## 2. Environment & Tooling Standards

* **Package & Environment Manager**: `/home/anair/.local/bin/uv`
* **Python Version**: CPython 3.11+ in `.venv`
* **Qualcomm SDK**: `imagine-sdk` (v0.4.2) installed locally via `uv pip install ./libs/imagine_sdk-0.4.2-py3-none-any.whl`
* **Backend**: FastAPI with async handlers (`ImagineAsyncClient` with `timeout=60.0`)
* **Data Schemas**: Pydantic v2 models

### Environment Variables:
```bash
export IMAGINE_API_KEY="278b88a2-8f68-42f7-818e-0442a7d294a3"
export IMAGINE_ENDPOINT_URL="https://aisuite.cirrascale.com/apis/v2"
```

### 2.1 Quickstart & Development Run Instructions

#### 1. Backend Server (FastAPI on Port 8000)
Run from repository root using `uv`:
```bash
/home/anair/.local/bin/uv run uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
- **API Root**: `http://127.0.0.1:8000`
- **Swagger Docs**: `http://127.0.0.1:8000/docs`
- **Health Check**: `http://127.0.0.1:8000/health`

#### 2. Frontend Development Server (Vite + React on Port 5173)
Run from `frontend/` directory (or use `--prefix`):
```bash
cd frontend && npm run dev
# or from root:
npm --prefix frontend run dev
```
- **Web UI**: `http://localhost:5173`
- **Reverse Proxy**: Vite automatically proxies `/api/*` requests to `http://127.0.0.1:8000`.

#### 3. Full Stack Verification
- Run tests: `/home/anair/.local/bin/uv run pytest backend/tests/`
- Build frontend: `npm --prefix frontend run build`

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
| **Empirical Research & Phase Findings** | [`docs/findings/phase_0_5_research_findings.md`](file:///home/anair/Desktop/Coding/Oi-Thon/docs/findings/phase_0_5_research_findings.md), [`docs/findings/phase_1_findings.md`](file:///home/anair/Desktop/Coding/Oi-Thon/docs/findings/phase_1_findings.md), & [`docs/findings/phase_2_findings.md`](file:///home/anair/Desktop/Coding/Oi-Thon/docs/findings/phase_2_findings.md) |
| **Pitch Strategy, Differentiators & Ideas** | [`HACKATHON.md`](file:///home/anair/Desktop/Coding/Oi-Thon/HACKATHON.md) |
| **Code Architecture & Dependency Graph** | [`graphify-out/graph.json`](file:///home/anair/Desktop/Coding/Oi-Thon/graphify-out/graph.json) & [`graphify-out/GRAPH_REPORT.md`](file:///home/anair/Desktop/Coding/Oi-Thon/graphify-out/GRAPH_REPORT.md) via `graphify update .` |

---

## 5. Living Implementation Tracker

### ✅ Phase 0: Discovery & Setup (COMPLETED)
- [x] Analyzed problem statement (`docs/reference/Requirement_Quality_Copilot_Feature_Guide.pdf`).
- [x] Tested Qualcomm Imagine API & Imagine SDK connectivity with live API key.
- [x] Benchmarked all active models on Qualcomm AI100 cluster.
- [x] Setup `.venv` using `uv` and installed `libs/imagine_sdk-0.4.2-py3-none-any.whl`.
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
  - [x] **Conversational Requirement Copilot**: **100.0% AITL Success Rate** across all 4 multi-domain scenarios (BMS, AEB, Med Pump, IoT Gateway) with strict EARS modal syntax, zero-fabrication `[TBD]` preservation, and top-level schema compatibility on `Llama-3.3-70B`.
- [x] Exported verified prompt templates (v2.4) to [`docs/prompts/optimized_prompts.json`](file:///home/anair/Desktop/Coding/Oi-Thon/docs/prompts/optimized_prompts.json).
- [x] Documented full research findings in [`docs/findings/phase_0_5_research_findings.md`](file:///home/anair/Desktop/Coding/Oi-Thon/docs/findings/phase_0_5_research_findings.md).




---

### ✅ Phase 1: Backend Foundation (COMPLETED)
- [x] Initialized FastAPI project structure (`backend/`).
- [x] Implemented Pydantic v2 schemas:
  - `RequirementStatement` (`id`, `text`, `category`, `section`, `status`: `DRAFT` | `FLAGGED_TBD` 🔴 | `PROVISIONAL_PM` 🟡 | `LOCKED_BASELINE` 🟢 | `REJECTED`)
  - `DualKeySignOff` (`requirement_id`, `pm_target_val`, `pm_author`, `tech_lead_approver`, `hardware_rationale`, `signed_off_at`)
  - `IssueCard` (`issue_type`, `severity`, `evidence_quote`, `explanation`, `action`)
  - `QualityScore` (100-pt breakdown: Clarity, Verifiability, Completeness, Atomicity, Consistency)
  - `RewriteSuggestion` (original, revised, rationale, identified_tbds with suggested defaults)
  - `VerificationPlan` (method, preconditions, test cases, acceptance criteria)
- [x] Implemented `QualcommService` wrapper using `ImagineAsyncClient`:
  - `timeout=60.0`
  - Automatic fallback / mock adapter for offline demos
- [x] Implemented Document Parser (pasted text, numbered lists, REQ tags, CSV, TXT, PDF).
- [x] Created Dual-Key Governance state store & REST routes.
- [x] Verified complete backend test suite (26/26 passing across all endpoints, parsers, and governance schemas).
- [x] Integrated Conversational Requirement Copilot grounded in uploaded Project Context with 100.0% AITL validation.
- [x] Updated `docs/api/endpoints.md` with new backend REST endpoints.
- [x] Documented complete architecture & benchmarks in [`docs/findings/phase_1_findings.md`](file:///home/anair/Desktop/Coding/Oi-Thon/docs/findings/phase_1_findings.md).

---

### ✅ Phase 1.5: Multi-Project Workspaces & Hierarchical Executive RBAC (COMPLETED)
- [x] Implemented Multi-Project Store Namespaces (`projects: Dict[str, ProjectWorkspace]`) isolating context, documents, and requirement IDs per project.
- [x] Implemented Manual Project Context CRUD & Boundary Locking (`/api/projects` endpoints, documents CRUD, architecture charter freezing with HTTP 423 enforcement).
- [x] Implemented 3-Tier Enterprise Persona Filter:
  - 👔 `Product Manager`: Unrestricted authoring across all states (`DRAFT`, `FLAGGED_TBD`, `PROVISIONAL_PM`, `LOCKED_BASELINE`).
  - 🛠️ `Lead Systems Engineer`: Technical sign-off gate (`PROVISIONAL_PM` $\to$ `LOCKED_BASELINE`).
  - 🎖️ `Senior Manager / Executive`: Strict read-only lens restricted exclusively to PM-Approved (`PROVISIONAL_PM` 🟡) or Signed-off (`LOCKED_BASELINE` 🟢) documents, shielding leadership from raw drafts.
- [x] Implemented SQLite write-through persistence layer (`backend/data/quality_copilot.db`) with zero-mock live execution.
- [x] Added automated test suite verifying cross-project isolation, executive visibility shielding, and dual-key RBAC separation of duties (31/31 passing tests).

---

### ✅ Phase 2: Deterministic Engine & Vector Clustering (COMPLETED)
- [x] Implemented 100-Point Rubric Scoring Engine outside the LLM (`RubricScoringEngine`) across Clarity (25), Verifiability (25), Completeness (20), Atomicity (15), Consistency (15).
- [x] Implemented Evidence Validator (`EvidenceValidator`) guaranteeing exact case-sensitive substring grounding and 0-indexed character offsets (`start_offset`, `end_offset`).
- [x] Implemented Itemized Mathematical Deduction Receipts (`receipt: List[str]`) for every evaluation.
- [x] Implemented Exact Hash & Lexical Jaccard Duplicate Detection (`store.find_duplicates`).
- [x] Implemented Vector Duplicate Detection & Neural Semantic Clustering with `bge-large` embeddings + `numpy` cosine similarity.
- [x] Added REST endpoints (`POST /api/analysis/score`, `GET/POST /api/requirements/{id}/score`).
- [x] Updated `docs/project/architecture.md` with final deduction math and receipt structure.
- [x] Verified complete unit and integration test suite (50/50 tests passing).

---

### ✅ Phase 3: AI Feature Pipelines (COMPLETED)
- [x] Connected `Llama-3.3-70B` tool calling for X-Ray issue detection with 100% evidence quote grounding and 0-indexed character offsets (`evidence_validator`).
- [x] Implemented Conflict Radar on `Llama-3.3-70B` (overlap search + contradictory behavior reasoning via `TOOL_CONFLICT_RADAR`).
- [x] Implemented Smart Rewriter with Intent-Lock validation (`IntentLockValidator` outside the LLM: polarity preservation, modal binding rigor, threshold parameterization, token diff stream).
- [x] Implemented Interpretation Duel generator with contrast divergence scoring ($1.0 - \text{sim}(A, B)$) and automated `Llama-3.1-8B` $\to$ `Llama-3.3-70B` cascade.
- [x] Implemented Verification Blueprint generator on `Llama-3.3-70B` (preconditions, paired nominal/boundary test cases, falsifiable PASS/FAIL acceptance criteria).
- [x] Added REST routes for all Phase 3 AI pipelines (`/api/analysis/xray`, `/api/analysis/duel`, `/api/analysis/rewrite`, `/api/analysis/intent-lock`, `/api/analysis/blueprint`, `/api/analysis/conflicts`).
- [x] Verified full unit, integration, and AITL test suites across Qualcomm Cloud AI 100 live hardware.

---

### ✅ Phase 2.5: Requirement Baseline Export Engine (COMPLETED)
- [x] Implemented RFC 4180 CSV export with UTF-8 BOM (`ExportService.to_csv`).
- [x] Implemented publication-grade structured engineering specification PDF generator with ReportLab (`ExportService.to_pdf`).
- [x] Added REST endpoints: `GET /api/requirements/export/csv` and `GET /api/requirements/export/pdf`.
- [x] Integrated Hierarchical RBAC visibility shielding (Executive role shields raw drafts and unapproved TBDs).
- [x] Preloaded distinct isolated demo projects (`default_project`, `proj-flight`, `proj-med`) with domain architecture charters, dual-key sign-offs, and rubric scores.
- [x] Added automated test suite (`backend/tests/test_export.py`) verifying CSV headers, PDF signatures, project isolation, and RBAC filters (4/4 passing).

---

### ✅ Phase 4: Antigravity 2.0 Web Frontend (COMPLETED)
- [x] Setup React + Vite frontend with Antigravity 2.0 dark-mode glassmorphic aesthetic and Squircle geometry (`.squircle-xs`, `.squircle-sm`, `.squircle-md`, `.squircle-lg`, `.squircle-pill`).
- [x] Built interactive 60 FPS Google Gemini mobile fluid iridescent background canvas (`GeminiBackground.jsx`) with organic harmonic breathing and pointer-reactive spring physics.
- [x] Built Collapsible Left Sidebar (`Sidebar.jsx`) with isolated project requirement trees, live search, and status filtering (`All`, `🔴 TBD`, `🟡 Provisional`, `🟢 Locked`).
- [x] Built 1-Click Header Persona Switcher (`Header.jsx`) (`👔 PM` $\longleftrightarrow$ `🛠️ Lead Systems Engineer` $\longleftrightarrow$ `🎖️ Executive`) with live RBAC visibility shielding.
- [x] Built 1-Click Export Menu (`Header.jsx`) triggering server-side CSV and publication-grade structured PDF downloads.
- [x] Built Mock / Live API Adapter toggle (`Cloud AI100` $\longleftrightarrow$ `Offline Stage`).
- [x] Built Executive-Only Master Test Cases & Baseline Certification Screen (`ExecutiveVerificationTab.jsx`):
  - Baseline Integrity Shield / Gatekeeper when requirements are pending Lead Systems Engineer technical lock.
  - Qualcomm AI 100 synthesized Master Test Suite with paired nominal positive & boundary stress test cases, preconditions, and falsifiable acceptance criteria upon 100% `LOCKED_BASELINE`.
  - Senior Executive formal baseline certification deck with approver signature, release directives, and gold certification seal.
  - Integrated with REST endpoints `GET /api/projects/{id}/master-test-suite` and `POST /api/projects/{id}/executive-certify`.

---

### ⏳ Phase 5: On-Site Venue Integration & Pitch Polish
- [ ] Wire live Qualcomm Cloud AI 100 backend endpoints to frontend on-site at the venue.
- [ ] Preload realistic sample requirement datasets (IoT Telemetry, Automotive BMS, Medical Device).
- [ ] Verify complete end-to-end user workflow under 3 minutes for live stage presentation.
