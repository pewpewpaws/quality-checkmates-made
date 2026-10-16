# Graph Report - Oi-Thon  (2026-10-17)

## Corpus Check
- 51 files · ~38,370 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 459 nodes · 811 edges · 32 communities (29 shown, 3 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 73 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `166c8feb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- run_all_edge_cases_test.py
- schemas.py
- 2. Core Methods
- DocumentParser
- 2. In-Depth Rejection Rationale by Model
- P0 — Core MVP (Must-Have for Base Functionality)
- RequirementStore
- Qualcomm Imagine API Endpoints Reference
- 5. Living Implementation Tracker
- Phase 0.5 Empirical Research & Validation Report
- 4. Judge Q&A Defense Cheat Sheet
- Phase 1: Backend Foundation & Conversational Copilot Findings
- routes_analysis.py
- 3. Critical Safety & Architecture Directives
- 2. The 4 Evaluation Filters
- docs/README.md
- 3. High-Impact Differentiators
- main.py
- Documentation Standards & Continuous Sync Rules
- 1. Feature Priority Breakdown
- Live Hardware Benchmarks (Qualcomm Cloud AI 100)
- extract_chat_data
- Git Commit Workflow Rule
- Requirement Quality Copilot (FastAPI) Backend Endpoints
- UserRole
- Knowledge Graph Usage & Continuous Graphify Sync Rules
- workflows/graphify.md
- backend/__init__.py
- requirements_matrix.md
- sdk/README.md
- LangChain Integration Guide
- Qualcomm Imagine SDK (Python)

## God Nodes (most connected - your core abstractions)
1. `UserRole` - 34 edges
2. `RequirementStore` - 32 edges
3. `QualcommService` - 28 edges
4. `RequirementStatement` - 27 edges
5. `DocumentParser` - 26 edges
6. `RequirementStatus` - 21 edges
7. `ProjectDocumentContext` - 14 edges
8. `ProjectWorkspace` - 14 edges
9. `RewriteSuggestion` - 12 edges
10. `TbdDefault` - 11 edges

## Surprising Connections (you probably didn't know these)
- `test_dual_key_sign_off_flow()` --uses--> `RequirementStatus`  [INFERRED]
  backend/tests/test_api.py → backend/models/schemas.py
- `test_pm_plain_language_chat_interaction()` --uses--> `RequirementStatus`  [INFERRED]
  backend/tests/test_chat_copilot.py → backend/models/schemas.py
- `test_dual_key_separation_of_duties_rbac()` --uses--> `RequirementStatus`  [INFERRED]
  backend/tests/test_rbac_and_workspaces.py → backend/models/schemas.py
- `update_project_context()` --uses--> `ProjectContext`  [INFERRED]
  backend/api/routes_chat.py → backend/models/schemas.py
- `upload_context_document()` --uses--> `ProjectDocumentContext`  [INFERRED]
  backend/api/routes_chat.py → backend/models/schemas.py

## Import Cycles
- None detected.

## Communities (32 total, 3 thin omitted)

### Community 0 - "run_all_edge_cases_test.py"
Cohesion: 0.67
Nodes (6): main(), parse_tool_args(), test_interpretation_duel(), test_smart_rewriter(), test_verification_blueprint(), test_xray_extraction()

### Community 1 - "schemas.py"
Cohesion: 0.10
Nodes (42): ChatMessageItem, ChatRequirementRequest, ChatRequirementResponse, DocumentParseRequest, DocumentParseResponse, DualKeySignOff, DuelCard, InterpretationDuel (+34 more)

### Community 2 - "2. Core Methods"
Cohesion: 0.20
Nodes (10): 1. Client Initialization, 2. Core Methods, 3. Data Transfer Objects (DTOs), 4. Exceptions, `chat(messages, model, tools, ...)`, `chat_stream(messages, ...)`, `embeddings(texts, model)`, `get_available_models_by_type()` (+2 more)

### Community 3 - "DocumentParser"
Cohesion: 0.14
Nodes (22): parse_file(), parse_text(), post, UploadFile, Parse raw text, numbered lists, or REQ-tagged strings into atomic requirement…, Upload and parse CSV, TXT, or PDF requirement documents. Restricted: Executives…, DocumentParser, Parses CSV data containing requirement records. Supports CSVs with or without… (+14 more)

### Community 4 - "2. In-Depth Rejection Rationale by Model"
Cohesion: 0.20
Nodes (9): 1. Executive Summary & Selection Matrix, 2. In-Depth Rejection Rationale by Model, 3. Summary of Selected Duo, A. DeepSeek-R1-Distill-Llama-70B, B. Qwen-QwQ-32B, C. Llama-3.1-70B, D. BAAI/bge-base-en-v1.5 (vs BAAI/bge-large-en-v1.5), E. Legacy Models (`Mistral-7B-Instruct-v0.1`, `Salesforce/xgen-7b-8k-inst`, `core42/jais-30b-chat-v1`) (+1 more)

### Community 5 - "P0 — Core MVP (Must-Have for Base Functionality)"
Cohesion: 0.08
Nodes (24): 10. Verification Blueprint Generator, 11. Dual-Key Governance & Requirement Lifecycle Tracker, 1. Project Vision & Core Principles, 1. Requirement Input & Document Parser, 2. Core Workflow & Architecture, 2. Requirement Quality Scoring Engine (100-Point Audit), 3. Detailed Feature Breakdown & Build Priorities, 3. Requirement X-Ray (Issue Detection) (+16 more)

### Community 6 - "RequirementStore"
Cohesion: 0.15
Nodes (6): ProjectContext, ProjectDocumentContext, ProjectWorkspace, RequirementStatement, High-performance in-memory requirement baseline store with Multi-Project…, RequirementStore

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
Cohesion: 0.22
Nodes (7): 1. Connection & Endpoints, 2. Authentication, 3. Endpoints Overview, Qualcomm Imagine API Reference, 📁 Directory Structure, Documentation Index, ⚡ Quick Navigation

### Community 16 - "3. High-Impact Differentiators"
Cohesion: 0.25
Nodes (7): 1. High-Level Architecture (Compound AI System), 2. Deterministic Scoring Rubric (100 Points), 3. High-Impact Differentiators, A. Interpretation Duel, B. Intent-Locked Change Validation, C. Verification Blueprint Generator, System Architecture & Technical Specifications

### Community 17 - "main.py"
Cohesion: 0.07
Nodes (15): Settings, health_check(), lifespan(), preload_demo_datasets(), get, Verify backend and Qualcomm AI100 cluster connectivity., Preload representative industry requirements for instant 3-minute pitch…, root() (+7 more)

### Community 18 - "Documentation Standards & Continuous Sync Rules"
Cohesion: 0.33
Nodes (5): 1. Documentation-First Mandate, 2. Documentation Mapping Guide, 3. Continuous HACKATHON.md Sync, 4. Documentation Formatting Guidelines, Documentation Standards & Continuous Sync Rules

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

### Community 23 - "Requirement Quality Copilot (FastAPI) Backend Endpoints"
Cohesion: 0.29
Nodes (7): 1. System Health & Qualcomm AI100 Ping, 2. Ingestion & Document Parsing, 3. Multi-Project Workspaces & Context Management, 4. Requirements & Dual-Key Governance (with 3-Tier Enterprise Persona RBAC), 5. AI Quality Pipelines (Qualcomm Cloud AI 100), 6. Conversational Requirement Copilot & Project Context, Requirement Quality Copilot (FastAPI) Backend Endpoints

### Community 24 - "UserRole"
Cohesion: 0.05
Nodes (58): get_user_role(), Extract enterprise persona from X-User-Role header or 'role' query parameter.…, Gate for mutation endpoints: Executives are strictly read-only., Enforce Dual-Key separation of duties: - Product Managers cannot grant…, require_write_permission(), verify_dual_key_role_action(), chat_synthesize_requirements(), get_project_context() (+50 more)

### Community 25 - "Knowledge Graph Usage & Continuous Graphify Sync Rules"
Cohesion: 0.40
Nodes (4): 1. Query-First Architecture Navigation Mandate, 2. Continuous Graph Updating Policy, 3. Graph Integrity & Honesty Rules, Knowledge Graph Usage & Continuous Graphify Sync Rules

### Community 29 - "sdk/README.md"
Cohesion: 0.29
Nodes (4): 1. Why Tool Calling?, 2. Implementation Pattern, 3. Feeding Tool Results Back (Multi-Turn), Tool Calling & Structured Extraction Guide

### Community 30 - "LangChain Integration Guide"
Cohesion: 0.40
Nodes (4): 1. Installation, 2. Using `ChatImagine`, 3. Using `ImagineEmbeddings`, LangChain Integration Guide

### Community 31 - "Qualcomm Imagine SDK (Python)"
Cohesion: 0.40
Nodes (5): 1. Installation via `uv`, 2. Environment Variables & Authentication, 3. SDK Guide Contents, Optional Extras:, Qualcomm Imagine SDK (Python)

## Knowledge Gaps
- **143 isolated node(s):** `1. Zero Sycophancy & Anti-Yes-Man Directive`, `Filter 1: The 3-Minute Stage Pitch Test`, `Filter 2: The Scope-Creep & Deadline Filter`, `Filter 3: The Qualcomm AI 100 Showcase Filter`, `Filter 4: The Real-World Engineering Reality Check` (+138 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 231 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `UserRole` connect `UserRole` to `schemas.py`, `DocumentParser`, `RequirementStore`, `main.py`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `RequirementStatement` connect `RequirementStore` to `UserRole`, `main.py`, `DocumentParser`, `schemas.py`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `QualcommService` connect `schemas.py` to `DocumentParser`, `RequirementStore`, `routes_analysis.py`, `main.py`, `UserRole`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Are the 21 inferred relationships involving `UserRole` (e.g. with `get_user_role()` and `require_write_permission()`) actually correct?**
  _`UserRole` has 21 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `RequirementStore` (e.g. with `DualKeySignOff` and `ProjectContext`) actually correct?**
  _`RequirementStore` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 9 inferred relationships involving `QualcommService` (e.g. with `DuelCard` and `InterpretationDuel`) actually correct?**
  _`QualcommService` has 9 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `RequirementStatement` (e.g. with `create_requirement()` and `update_requirement()`) actually correct?**
  _`RequirementStatement` has 5 INFERRED edges - model-reasoned connections that need verification._