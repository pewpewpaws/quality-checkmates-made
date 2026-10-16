# Graph Report - Oi-Thon  (2026-10-17)

## Corpus Check
- 48 files · ~34,320 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 397 nodes · 653 edges · 27 communities (23 shown, 3 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 45 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4cc751db`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- run_all_edge_cases_test.py
- schemas.py
- 2. Core Methods
- DocumentParser
- QualcommService
- P0 — Core MVP (Must-Have for Base Functionality)
- RequirementStatement
- Qualcomm Imagine API Endpoints Reference
- 5. Living Implementation Tracker
- Phase 0.5 Empirical Research & Validation Report
- 4. Judge Q&A Defense Cheat Sheet
- Phase 1: Backend Foundation & Conversational Copilot Findings
- routes_analysis.py
- 3. Critical Safety & Architecture Directives
- 2. The 4 Evaluation Filters
- docs/README.md
- main.py
- 1. Feature Priority Breakdown
- Live Hardware Benchmarks (Qualcomm Cloud AI 100)
- extract_chat_data
- Git Commit Workflow Rule
- get_project_context
- Knowledge Graph Usage & Continuous Graphify Sync Rules
- workflows/graphify.md
- backend/__init__.py
- requirements_matrix.md

## God Nodes (most connected - your core abstractions)
1. `QualcommService` - 28 edges
2. `RequirementStatement` - 27 edges
3. `DocumentParser` - 26 edges
4. `RequirementStatus` - 19 edges
5. `RequirementStore` - 19 edges
6. `RewriteSuggestion` - 12 edges
7. `TbdDefault` - 11 edges
8. `ProjectContext` - 11 edges
9. `DualKeySignOff` - 10 edges
10. `parse_file()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `test_dual_key_sign_off_flow()` --uses--> `RequirementStatus`  [INFERRED]
  backend/tests/test_api.py → backend/models/schemas.py
- `parse_text()` --uses--> `DocumentParseRequest`  [INFERRED]
  backend/api/routes_parse.py → backend/models/schemas.py
- `parse_text()` --uses--> `DocumentParseResponse`  [INFERRED]
  backend/api/routes_parse.py → backend/models/schemas.py
- `parse_file()` --uses--> `DocumentParseResponse`  [INFERRED]
  backend/api/routes_parse.py → backend/models/schemas.py
- `dual_key_sign_off()` --uses--> `SignOffActionRequest`  [INFERRED]
  backend/api/routes_requirements.py → backend/models/schemas.py

## Import Cycles
- None detected.

## Communities (27 total, 3 thin omitted)

### Community 0 - "run_all_edge_cases_test.py"
Cohesion: 0.67
Nodes (6): main(), parse_tool_args(), test_interpretation_duel(), test_smart_rewriter(), test_verification_blueprint(), test_xray_extraction()

### Community 1 - "schemas.py"
Cohesion: 0.10
Nodes (33): chat_synthesize_requirements(), post, UploadFile, Set or update project documentation context and engineering safety constraints., Attach an architectural document or charter file (TXT, CSV, PDF, or raw text)…, Conversational Copilot: Product Manager types plain-language…, update_project_context(), upload_context_document() (+25 more)

### Community 2 - "2. Core Methods"
Cohesion: 0.07
Nodes (23): 1. Client Initialization, 2. Core Methods, 3. Data Transfer Objects (DTOs), 4. Exceptions, `chat(messages, model, tools, ...)`, `chat_stream(messages, ...)`, `embeddings(texts, model)`, `get_available_models_by_type()` (+15 more)

### Community 3 - "DocumentParser"
Cohesion: 0.14
Nodes (22): parse_file(), parse_text(), post, UploadFile, Parse raw text, numbered lists, or REQ-tagged strings into atomic requirement…, Upload and parse CSV, TXT, or PDF requirement documents., DocumentParser, Parses CSV data containing requirement records. Supports CSVs with or without… (+14 more)

### Community 4 - "QualcommService"
Cohesion: 0.15
Nodes (16): IssueCard, RewriteSuggestion, TbdDefault, extract_chat_data(), parse_tool_args(), Any, QualcommService, Robustly parse tool call arguments, handling string-encoded nested structures. (+8 more)

### Community 5 - "P0 — Core MVP (Must-Have for Base Functionality)"
Cohesion: 0.08
Nodes (24): 10. Verification Blueprint Generator, 11. Dual-Key Governance & Requirement Lifecycle Tracker, 1. Project Vision & Core Principles, 1. Requirement Input & Document Parser, 2. Core Workflow & Architecture, 2. Requirement Quality Scoring Engine (100-Point Audit), 3. Detailed Feature Breakdown & Build Priorities, 3. Requirement X-Ray (Issue Detection) (+16 more)

### Community 6 - "RequirementStatement"
Cohesion: 0.09
Nodes (19): create_requirement(), delete_requirement(), dual_key_sign_off(), get_requirement(), list_requirements(), get, post, Retrieve all ingested requirements and their current governance states. (+11 more)

### Community 7 - "Qualcomm Imagine API Endpoints Reference"
Cohesion: 0.11
Nodes (19): 1. Healthcheck / Ping, 2. Models Catalog, 3. Chat Completions, 4. Chat with Tool Calling (Function Calling), 5. Embeddings, 6. Reranker, Example Request:, Example Request: (+11 more)

### Community 8 - "5. Living Implementation Tracker"
Cohesion: 0.12
Nodes (16): 1. Project Mission & Hackathon Context, 2. Environment & Tooling Standards, 3. Approved Qualcomm AI Model Assignments, 4. Documentation Mapping & Maintenance Guide, 5. Living Implementation Tracker, AGENTS.md — Development Guidelines & Living Project Tracker, Environment Variables:, Mandatory Operating Rules & Directives: (+8 more)

### Community 9 - "Phase 0.5 Empirical Research & Validation Report"
Cohesion: 0.13
Nodes (14): 1. Executive Summary, 1. X-Ray Issue Extraction (`Llama-3.3-70B` via Native Tool Calling), 2. Model Performance on Qualcomm Cloud AI 100, 2. The Interpretation Duel (`Llama-3.1-8B` $\to$ `Llama-3.3-70B` Cascade), 3. Intent-Locked Smart Rewriter with Smart [TBD] Suggested Defaults (`Llama-3.3-70B` via Tool Calling), 3. The 4 Hardened Production Prompts, 4. Multi-Domain & Edge-Case Findings, 4. Verification Blueprint Generator (`Llama-3.3-70B` via Tool Calling) (+6 more)

### Community 10 - "4. Judge Q&A Defense Cheat Sheet"
Cohesion: 0.13
Nodes (14): 1. The Winning Narrative (The Core Pitch Hook), 2. High-Impact Differentiators (What Sets Us Apart), 3. The 3-Minute Live Pitch & Demo Playbook, 4. Judge Q&A Defense Cheat Sheet, 5. Living Ideas & Unique Angles Log, HACKATHON.md — Pitch Playbook, Differentiators & Judge Strategy, Q1: *"Why can't engineers just use ChatGPT or Claude?"*, Q2: *"How did you utilize Qualcomm Cloud AI 100 hardware?"* (+6 more)

### Community 11 - "Phase 1: Backend Foundation & Conversational Copilot Findings"
Cohesion: 0.14
Nodes (13): 1. Executive Summary, 2.1 Technology Stack & Standards, 2.2 Dual-Key Governance State Machine, 2. Backend Foundation & Architecture, 3.1 Purpose & Workflow, 3.2 The Qualcomm AI100 Tool-Calling Discovery & Resolution, 3.3 Prompt Evolution (PROMPT_V2.0 $\to$ PROMPT_V2.4), 3.4 Empirical AITL Benchmark Scoreboard (+5 more)

### Community 12 - "routes_analysis.py"
Cohesion: 0.31
Nodes (12): AnalysisRequest, analyze_xray(), generate_blueprint(), BaseModel, post, Extract requirement defects and verbatim evidence quotes using Qualcomm AI 100…, Formulate two competing technical interpretations using Qualcomm AI 100…, Generate EARS-compliant rewrite strictly preserving [TBD: ...] placeholders +… (+4 more)

### Community 13 - "3. Critical Safety & Architecture Directives"
Cohesion: 0.18
Nodes (10): 1. Environment & Execution Standards, 1. Strict Zero-Fabrication Directive, 2. Approved Model Roles & Routing, 2. Dual-Key Governance Lifecycle, 3. Critical Safety & Architecture Directives, 3. Evidence-Grounded Quotes, 4. Deterministic Rubric Receipts, 5. Qualcomm Official RAG Architecture (+2 more)

### Community 14 - "2. The 4 Evaluation Filters"
Cohesion: 0.20
Nodes (9): 1. Zero Sycophancy & Anti-Yes-Man Directive, 2. The 4 Evaluation Filters, 3. Required Critique Format, 4. Extreme Brevity & Token Efficiency Mandate, Filter 1: The 3-Minute Stage Pitch Test, Filter 2: The Scope-Creep & Deadline Filter, Filter 3: The Qualcomm AI 100 Showcase Filter, Filter 4: The Real-World Engineering Reality Check (+1 more)

### Community 15 - "docs/README.md"
Cohesion: 0.06
Nodes (29): 1. System Health & Qualcomm AI100 Ping, 2. Ingestion & Document Parsing, 3. Requirements & Dual-Key Governance, 4. AI Quality Pipelines (Qualcomm Cloud AI 100), 5. Conversational Requirement Copilot & Project Context, Requirement Quality Copilot (FastAPI) Backend Endpoints, 1. Connection & Endpoints, 2. Authentication (+21 more)

### Community 17 - "main.py"
Cohesion: 0.12
Nodes (11): Settings, health_check(), lifespan(), preload_demo_datasets(), get, Verify backend and Qualcomm AI100 cluster connectivity., Preload representative industry requirements for instant 3-minute pitch…, root() (+3 more)

### Community 19 - "1. Feature Priority Breakdown"
Cohesion: 0.33
Nodes (5): 1. Feature Priority Breakdown, P0 — Core MVP (Must-Have), P1 — High-Impact Differentiators, P2 — Usability & Lifecycle, PSE-01 Feature Specification & Priorities

### Community 20 - "Live Hardware Benchmarks (Qualcomm Cloud AI 100)"
Cohesion: 0.40
Nodes (4): 1. Summary of Model Test Results, 2. Embedding Discrimination Accuracy Test, 3. Test Scripts, Live Hardware Benchmarks (Qualcomm Cloud AI 100)

### Community 21 - "extract_chat_data"
Cohesion: 0.70
Nodes (4): extract_chat_data(), parse_tool_args(), Any, run_aitl_evaluation()

### Community 22 - "Git Commit Workflow Rule"
Cohesion: 0.50
Nodes (3): 1. Commit After Every Change, 2. STRICT: Never Push (`git push`), Git Commit Workflow Rule

### Community 24 - "get_project_context"
Cohesion: 0.67
Nodes (3): get_project_context(), get, Fetch active project architecture charter, domain, and attached documents.

### Community 25 - "Knowledge Graph Usage & Continuous Graphify Sync Rules"
Cohesion: 0.40
Nodes (4): 1. Query-First Architecture Navigation Mandate, 2. Continuous Graph Updating Policy, 3. Graph Integrity & Honesty Rules, Knowledge Graph Usage & Continuous Graphify Sync Rules

## Knowledge Gaps
- **138 isolated node(s):** `1. Zero Sycophancy & Anti-Yes-Man Directive`, `Filter 1: The 3-Minute Stage Pitch Test`, `Filter 2: The Scope-Creep & Deadline Filter`, `Filter 3: The Qualcomm AI 100 Showcase Filter`, `Filter 4: The Real-World Engineering Reality Check` (+133 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 204 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `RequirementStatement` connect `RequirementStatement` to `schemas.py`, `DocumentParser`, `QualcommService`, `main.py`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `QualcommService` connect `QualcommService` to `schemas.py`, `DocumentParser`, `RequirementStatement`, `routes_analysis.py`, `main.py`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `QualcommService` (e.g. with `DuelCard` and `InterpretationDuel`) actually correct?**
  _`QualcommService` has 9 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `RequirementStatement` (e.g. with `create_requirement()` and `update_requirement()`) actually correct?**
  _`RequirementStatement` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 16 inferred relationships involving `DocumentParser` (e.g. with `parse_file()` and `parse_text()`) actually correct?**
  _`DocumentParser` has 16 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `RequirementStatus` (e.g. with `preload_demo_datasets()` and `DocumentParser`) actually correct?**
  _`RequirementStatus` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `RequirementStore` (e.g. with `DualKeySignOff` and `ProjectContext`) actually correct?**
  _`RequirementStore` has 5 INFERRED edges - model-reasoned connections that need verification._