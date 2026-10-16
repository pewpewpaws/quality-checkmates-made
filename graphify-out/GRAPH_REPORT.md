# Graph Report - Oi-Thon  (2026-10-17)

## Corpus Check
- 52 files · ~41,843 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: .csv 2, .example 1, (none) 1)

## Summary
- 550 nodes · 1052 edges · 31 communities (29 shown, 2 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 95 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `966fd801`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Dual-Key Governance & Workspaces
- Qualcomm AI 100 SDK & Inference
- Graphify Config & Settings
- High-Performance Requirement Store
- schemas.py
- Document Parser & Uploader
- Live AI 100 Client & Testing
- Qualcomm AI 100 Analysis & Blueprint
- P0 — Core MVP (Must-Have for Base Functionality)
- Qualcomm Imagine API Endpoints Reference
- 5. Living Implementation Tracker
- Phase 0.5 Empirical Research & Validation Report
- 4. Judge Q&A Defense Cheat Sheet
- Phase 1: Backend Foundation & Conversational Copilot Findings
- 3. Critical Safety & Architecture Directives
- 2. The 4 Evaluation Filters
- 2. In-Depth Rejection Rationale by Model
- 2. Core Methods
- docs/README.md
- 3. High-Impact Differentiators
- Requirement Quality Copilot (FastAPI) Backend Endpoints
- Documentation Standards & Continuous Sync Rules
- 1. Feature Priority Breakdown
- Live Hardware Benchmarks (Qualcomm Cloud AI 100)
- LangChain Integration Guide
- Qualcomm Imagine SDK (Python)
- Tool Calling & Structured Extraction Guide
- Git Commit Workflow Rule
- Documentation Index
- requirements_matrix.md

## God Nodes (most connected - your core abstractions)
1. `RequirementStore` - 44 edges
2. `UserRole` - 36 edges
3. `RequirementStatement` - 36 edges
4. `QualcommService` - 32 edges
5. `DocumentParser` - 26 edges
6. `RequirementStatus` - 24 edges
7. `ProjectWorkspace` - 16 edges
8. `RewriteSuggestion` - 14 edges
9. `ProjectDocumentContext` - 14 edges
10. `DualKeySignOff` - 13 edges

## Surprising Connections (you probably didn't know these)
- `2.2 Dual-Key Governance State Machine` --references--> `DualKeySignOff`  [INFERRED]
  docs/findings/phase_1_findings.md → backend/models/schemas.py
- `2. Ingestion & Document Parsing` --references--> `RequirementStatement`  [INFERRED]
  docs/api/endpoints.md → backend/models/schemas.py
- `✅ Phase 1: Backend Foundation (COMPLETED)` --references--> `RequirementStatement`  [INFERRED]
  AGENTS.md → backend/models/schemas.py
- `2.1 Technology Stack & Standards` --references--> `RequirementStatement`  [INFERRED]
  docs/findings/phase_1_findings.md → backend/models/schemas.py
- `✅ Phase 1: Backend Foundation (COMPLETED)` --references--> `DualKeySignOff`  [INFERRED]
  AGENTS.md → backend/models/schemas.py

## Import Cycles
- None detected.

## Communities (31 total, 2 thin omitted)

### Community 0 - "Dual-Key Governance & Workspaces"
Cohesion: 0.05
Nodes (24): get_user_role(), require_write_permission(), verify_dual_key_role_action(), chat_synthesize_requirements(), get_project_context(), update_project_context(), upload_context_document(), add_project_document() (+16 more)

### Community 1 - "Qualcomm AI 100 SDK & Inference"
Cohesion: 0.06
Nodes (8): health_check(), lifespan(), preload_demo_datasets(), root(), test_dual_key_sign_off_flow(), clean_context_test_projects(), reset_store_state(), test_dual_key_separation_of_duties_rbac()

### Community 2 - "Graphify Config & Settings"
Cohesion: 0.07
Nodes (16): Settings, test_pm_plain_language_chat_interaction(), extract_semantic_chunk(), label_communities_cirrascale(), main(), normalize_id(), parse_tool_call_args(), extract_chat_data() (+8 more)

### Community 3 - "High-Performance Requirement Store"
Cohesion: 0.11
Nodes (6): ProjectContext, ProjectDocumentContext, ProjectWorkspace, RequirementStatement, RequirementStore, test_sqlite_write_through_rehydration()

### Community 4 - "schemas.py"
Cohesion: 0.09
Nodes (30): ✅ Phase 1: Backend Foundation (COMPLETED), ChatMessageItem, ChatRequirementRequest, ChatRequirementResponse, DocumentParseRequest, DocumentParseResponse, DualKeySignOff, DuelCard (+22 more)

### Community 5 - "Document Parser & Uploader"
Cohesion: 0.13
Nodes (15): parse_file(), parse_text(), DocumentParser, test_parse_csv(), test_parse_explicit_req_tags(), test_parse_numbered_list(), test_parse_bulleted_user_stories_without_numbers(), test_parse_csv_without_ids() (+7 more)

### Community 6 - "Live AI 100 Client & Testing"
Cohesion: 0.10
Nodes (8): live_service(), test_live_chat_copilot_grounded(), test_live_embeddings_bge_large(), test_live_interpretation_duel(), test_live_ping_and_hardware_status(), test_live_smart_rewriter_zero_fabrication(), test_live_verification_blueprint(), test_live_xray_flaw_extraction()

### Community 7 - "Qualcomm AI 100 Analysis & Blueprint"
Cohesion: 0.27
Nodes (6): AnalysisRequest, analyze_xray(), generate_blueprint(), resolve_text(), rewrite_requirement(), stage_duel()

### Community 8 - "P0 — Core MVP (Must-Have for Base Functionality)"
Cohesion: 0.08
Nodes (24): 10. Verification Blueprint Generator, 11. Dual-Key Governance & Requirement Lifecycle Tracker, 1. Project Vision & Core Principles, 1. Requirement Input & Document Parser, 2. Core Workflow & Architecture, 2. Requirement Quality Scoring Engine (100-Point Audit), 3. Detailed Feature Breakdown & Build Priorities, 3. Requirement X-Ray (Issue Detection) (+16 more)

### Community 9 - "Qualcomm Imagine API Endpoints Reference"
Cohesion: 0.11
Nodes (19): 1. Healthcheck / Ping, 2. Models Catalog, 3. Chat Completions, 4. Chat with Tool Calling (Function Calling), 5. Embeddings, 6. Reranker, Example Request:, Example Request: (+11 more)

### Community 11 - "5. Living Implementation Tracker"
Cohesion: 0.12
Nodes (15): 1. Project Mission & Hackathon Context, 2. Environment & Tooling Standards, 3. Approved Qualcomm AI Model Assignments, 4. Documentation Mapping & Maintenance Guide, 5. Living Implementation Tracker, AGENTS.md — Development Guidelines & Living Project Tracker, Environment Variables:, Mandatory Operating Rules & Directives: (+7 more)

### Community 12 - "Phase 0.5 Empirical Research & Validation Report"
Cohesion: 0.13
Nodes (14): 1. Executive Summary, 1. X-Ray Issue Extraction (`Llama-3.3-70B` via Native Tool Calling), 2. Model Performance on Qualcomm Cloud AI 100, 2. The Interpretation Duel (`Llama-3.1-8B` $\to$ `Llama-3.3-70B` Cascade), 3. Intent-Locked Smart Rewriter with Smart [TBD] Suggested Defaults (`Llama-3.3-70B` via Tool Calling), 3. The 4 Hardened Production Prompts, 4. Multi-Domain & Edge-Case Findings, 4. Verification Blueprint Generator (`Llama-3.3-70B` via Tool Calling) (+6 more)

### Community 13 - "4. Judge Q&A Defense Cheat Sheet"
Cohesion: 0.13
Nodes (14): 1. The Winning Narrative (The Core Pitch Hook), 2. High-Impact Differentiators (What Sets Us Apart), 3. The 3-Minute Live Pitch & Demo Playbook, 4. Judge Q&A Defense Cheat Sheet, 5. Living Ideas & Unique Angles Log, HACKATHON.md — Pitch Playbook, Differentiators & Judge Strategy, Q1: *"Why can't engineers just use ChatGPT or Claude?"*, Q2: *"How did you utilize Qualcomm Cloud AI 100 hardware?"* (+6 more)

### Community 14 - "Phase 1: Backend Foundation & Conversational Copilot Findings"
Cohesion: 0.15
Nodes (12): 1. Executive Summary, 2.2 Dual-Key Governance State Machine, 2. Backend Foundation & Architecture, 3.1 Purpose & Workflow, 3.2 The Qualcomm AI100 Tool-Calling Discovery & Resolution, 3.3 Prompt Evolution (PROMPT_V2.0 $\to$ PROMPT_V2.4), 3.4 Empirical AITL Benchmark Scoreboard, 3. Conversational Copilot & AITL Prompt Optimization (+4 more)

### Community 15 - "3. Critical Safety & Architecture Directives"
Cohesion: 0.18
Nodes (10): 1. Environment & Execution Standards, 1. Strict Zero-Fabrication Directive, 2. Approved Model Roles & Routing, 2. Dual-Key Governance Lifecycle, 3. Critical Safety & Architecture Directives, 3. Evidence-Grounded Quotes, 4. Deterministic Rubric Receipts, 5. Qualcomm Official RAG Architecture (+2 more)

### Community 16 - "2. The 4 Evaluation Filters"
Cohesion: 0.20
Nodes (9): 1. Zero Sycophancy & Anti-Yes-Man Directive, 2. The 4 Evaluation Filters, 3. Required Critique Format, 4. Extreme Brevity & Token Efficiency Mandate, Filter 1: The 3-Minute Stage Pitch Test, Filter 2: The Scope-Creep & Deadline Filter, Filter 3: The Qualcomm AI 100 Showcase Filter, Filter 4: The Real-World Engineering Reality Check (+1 more)

### Community 17 - "2. In-Depth Rejection Rationale by Model"
Cohesion: 0.20
Nodes (9): 1. Executive Summary & Selection Matrix, 2. In-Depth Rejection Rationale by Model, 3. Summary of Selected Duo, A. DeepSeek-R1-Distill-Llama-70B, B. Qwen-QwQ-32B, C. Llama-3.1-70B, D. BAAI/bge-base-en-v1.5 (vs BAAI/bge-large-en-v1.5), E. Legacy Models (`Mistral-7B-Instruct-v0.1`, `Salesforce/xgen-7b-8k-inst`, `core42/jais-30b-chat-v1`) (+1 more)

### Community 18 - "2. Core Methods"
Cohesion: 0.20
Nodes (10): 1. Client Initialization, 2. Core Methods, 3. Data Transfer Objects (DTOs), 4. Exceptions, `chat(messages, model, tools, ...)`, `chat_stream(messages, ...)`, `embeddings(texts, model)`, `get_available_models_by_type()` (+2 more)

### Community 19 - "docs/README.md"
Cohesion: 0.28
Nodes (4): 1. Connection & Endpoints, 2. Authentication, 3. Endpoints Overview, Qualcomm Imagine API Reference

### Community 20 - "3. High-Impact Differentiators"
Cohesion: 0.25
Nodes (7): 1. High-Level Architecture (Compound AI System), 2. Deterministic Scoring Rubric (100 Points), 3. High-Impact Differentiators, A. Interpretation Duel, B. Intent-Locked Change Validation, C. Verification Blueprint Generator, System Architecture & Technical Specifications

### Community 21 - "Requirement Quality Copilot (FastAPI) Backend Endpoints"
Cohesion: 0.29
Nodes (7): 1. System Health & Qualcomm AI100 Ping, 2. Ingestion & Document Parsing, 3. Multi-Project Workspaces & Context Management, 4. Requirements & Dual-Key Governance (with 3-Tier Enterprise Persona RBAC), 5. AI Quality Pipelines (Qualcomm Cloud AI 100), 6. Conversational Requirement Copilot & Project Context, Requirement Quality Copilot (FastAPI) Backend Endpoints

### Community 22 - "Documentation Standards & Continuous Sync Rules"
Cohesion: 0.33
Nodes (5): 1. Documentation-First Mandate, 2. Documentation Mapping Guide, 3. Continuous HACKATHON.md Sync, 4. Documentation Formatting Guidelines, Documentation Standards & Continuous Sync Rules

### Community 23 - "1. Feature Priority Breakdown"
Cohesion: 0.33
Nodes (5): 1. Feature Priority Breakdown, P0 — Core MVP (Must-Have), P1 — High-Impact Differentiators, P2 — Usability & Lifecycle, PSE-01 Feature Specification & Priorities

### Community 24 - "Live Hardware Benchmarks (Qualcomm Cloud AI 100)"
Cohesion: 0.40
Nodes (4): 1. Summary of Model Test Results, 2. Embedding Discrimination Accuracy Test, 3. Test Scripts, Live Hardware Benchmarks (Qualcomm Cloud AI 100)

### Community 25 - "LangChain Integration Guide"
Cohesion: 0.40
Nodes (4): 1. Installation, 2. Using `ChatImagine`, 3. Using `ImagineEmbeddings`, LangChain Integration Guide

### Community 26 - "Qualcomm Imagine SDK (Python)"
Cohesion: 0.40
Nodes (5): 1. Installation via `uv`, 2. Environment Variables & Authentication, 3. SDK Guide Contents, Optional Extras:, Qualcomm Imagine SDK (Python)

### Community 27 - "Tool Calling & Structured Extraction Guide"
Cohesion: 0.40
Nodes (4): 1. Why Tool Calling?, 2. Implementation Pattern, 3. Feeding Tool Results Back (Multi-Turn), Tool Calling & Structured Extraction Guide

### Community 28 - "Git Commit Workflow Rule"
Cohesion: 0.50
Nodes (3): 1. Commit After Every Change, 2. STRICT: Never Push (`git push`), Git Commit Workflow Rule

### Community 29 - "Documentation Index"
Cohesion: 0.67
Nodes (3): 📁 Directory Structure, Documentation Index, ⚡ Quick Navigation

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `RequirementStatement` connect `High-Performance Requirement Store` to `Dual-Key Governance & Workspaces`, `Qualcomm AI 100 SDK & Inference`, `schemas.py`, `Document Parser & Uploader`, `Live AI 100 Client & Testing`, `Requirement Quality Copilot (FastAPI) Backend Endpoints`?**
  _High betweenness centrality (0.341) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `RequirementStore` (e.g. with `DualKeySignOff` and `ProjectContext`) actually correct?**
  _`RequirementStore` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Should `Dual-Key Governance & Workspaces` be split into smaller, more focused modules?**
  _Cohesion score 0.05217391304347826 - nodes in this community are weakly interconnected._
- **Why does `Requirement Quality Copilot (FastAPI) Backend Endpoints` connect `Requirement Quality Copilot (FastAPI) Backend Endpoints` to `docs/README.md`?**
  _High betweenness centrality (0.258) - this node is a cross-community bridge._
- **Are the 22 inferred relationships involving `UserRole` (e.g. with `get_user_role()` and `require_write_permission()`) actually correct?**
  _`UserRole` has 22 INFERRED edges - model-reasoned connections that need verification._
- **Should `Qualcomm AI 100 SDK & Inference` be split into smaller, more focused modules?**
  _Cohesion score 0.06349206349206349 - nodes in this community are weakly interconnected._
- **Why does `2. Ingestion & Document Parsing` connect `Requirement Quality Copilot (FastAPI) Backend Endpoints` to `High-Performance Requirement Store`?**
  _High betweenness centrality (0.257) - this node is a cross-community bridge._