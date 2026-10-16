# Graph Report - Oi-Thon  (2026-10-17)

## Corpus Check
- 53 files · ~44,619 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: .csv 2, .example 1, (none) 1)

## Summary
- 431 nodes · 1015 edges · 18 communities (13 shown, 5 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 95 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d5d7f3b7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Dual-Key Governance & Workspaces
- Qualcomm AI 100 SDK & Inference
- Deterministic Verification & Test Blueprints
- main.py
- Graphify Analysis & Reporting
- Qualcomm AI 100 Engineering Directives
- Document Parsing & Requirement Extraction
- Live Qualcomm Cloud AI 100 Client
- Qualcomm AI 100 Defect Analysis
- Autonomous Vehicle Feature Briefs
- storage.py
- test_live_duplicates_conflicts.py
- test_rbac_and_workspaces.py
- qualcomm_service.py
- test_api.py
- test_context_and_duplicates.py
- 1. Feature Priority Breakdown

## God Nodes (most connected - your core abstractions)
1. `RequirementStore` - 44 edges
2. `RequirementStatement` - 41 edges
3. `QualcommService` - 40 edges
4. `UserRole` - 38 edges
5. `DocumentParser` - 26 edges
6. `RequirementStatus` - 25 edges
7. `ProjectWorkspace` - 16 edges
8. `ProjectDocumentContext` - 14 edges
9. `RewriteSuggestion` - 12 edges
10. `TbdDefault` - 11 edges

## Surprising Connections (you probably didn't know these)
- `Medical Pump SRS` --conceptually_related_to--> `Requirement Quality Copilot`  [INFERRED]
  sample_data/pm_documents/medical_pump_srs.pdf → HACKATHON.md
- `Requirement Quality Copilot Feature Guide` --specifies--> `Requirement Quality Copilot`  [EXTRACTED]
  docs/reference/Requirement_Quality_Copilot_Feature_Guide.pdf → HACKATHON.md
- `test_dual_key_sign_off_flow()` --uses--> `RequirementStatus`  [INFERRED]
  backend/tests/test_api.py → backend/models/schemas.py
- `test_dual_key_separation_of_duties_rbac()` --uses--> `RequirementStatus`  [INFERRED]
  backend/tests/test_rbac_and_workspaces.py → backend/models/schemas.py
- `AGENTS.md — Development Guidelines & Living Project Tracker` --specifies--> `Dual Key Governance`  [EXTRACTED]
  AGENTS.md → .agents/rules/brutal_candor.md

## Import Cycles
- None detected.

## Communities (18 total, 5 thin omitted)

### Community 0 - "Dual-Key Governance & Workspaces"
Cohesion: 0.05
Nodes (26): get_user_role(), require_write_permission(), verify_dual_key_role_action(), chat_synthesize_requirements(), get_project_context(), update_project_context(), upload_context_document(), add_project_document() (+18 more)

### Community 1 - "Qualcomm AI 100 SDK & Inference"
Cohesion: 0.08
Nodes (29): ChatMessageItem, ChatRequirementRequest, ChatRequirementResponse, ConflictRadarRequest, ConflictRadarResponse, ConflictType, DocumentParseRequest, DocumentParseResponse (+21 more)

### Community 2 - "Deterministic Verification & Test Blueprints"
Cohesion: 0.11
Nodes (6): ProjectContext, ProjectDocumentContext, ProjectWorkspace, RequirementStatement, RequirementStore, test_sqlite_write_through_rehydration()

### Community 3 - "main.py"
Cohesion: 0.22
Nodes (4): health_check(), lifespan(), preload_demo_datasets(), root()

### Community 4 - "Graphify Analysis & Reporting"
Cohesion: 0.10
Nodes (14): extract_semantic_chunk(), label_communities_cirrascale(), main(), normalize_id(), parse_tool_call_args(), extract_chat_data(), parse_tool_args(), run_aitl_evaluation() (+6 more)

### Community 5 - "Qualcomm AI 100 Engineering Directives"
Cohesion: 0.06
Nodes (41): AGENTS.md — Development Guidelines & Living Project Tracker, Radical Candor & Brutal Idea Evaluation Rule, Git Commit Workflow Rule, Project Standards & Qualcomm AI 100 Engineering Directives, BAAI/bge-large-en-v1.5, Qualcomm Imagine API Endpoints Reference, Phase 0.5 Empirical Research & Validation Report, Phase 1: Backend Foundation & Conversational Copilot Findings (+33 more)

### Community 6 - "Document Parsing & Requirement Extraction"
Cohesion: 0.12
Nodes (15): parse_file(), parse_text(), DocumentParser, test_parse_csv(), test_parse_explicit_req_tags(), test_parse_numbered_list(), test_parse_bulleted_user_stories_without_numbers(), test_parse_csv_without_ids() (+7 more)

### Community 7 - "Live Qualcomm Cloud AI 100 Client"
Cohesion: 0.10
Nodes (8): live_service(), test_live_chat_copilot_grounded(), test_live_embeddings_bge_large(), test_live_interpretation_duel(), test_live_ping_and_hardware_status(), test_live_smart_rewriter_zero_fabrication(), test_live_verification_blueprint(), test_live_xray_flaw_extraction()

### Community 8 - "Qualcomm AI 100 Defect Analysis"
Cohesion: 0.20
Nodes (9): AnalysisRequest, analyze_conflicts(), analyze_semantic_duplicates(), analyze_xray(), generate_blueprint(), resolve_text(), rewrite_requirement(), SemanticDuplicateRequest (+1 more)

### Community 9 - "Autonomous Vehicle Feature Briefs"
Cohesion: 0.29
Nodes (7): Brake Actuator, Forward Radar, Instrument Cluster, Non-Volatile Crash Recorder, Autonomous Emergency Braking (AEB) Feature Brief, Functional Obligations, Vision Perception Module

### Community 11 - "storage.py"
Cohesion: 0.21
Nodes (5): DualKeySignOff, RequirementStatus, test_pm_plain_language_chat_interaction(), test_dual_key_signoff_defaults(), test_requirement_statement_creation()

### Community 12 - "test_live_duplicates_conflicts.py"
Cohesion: 0.18
Nodes (4): clean_test_workspaces(), test_01_requirement_duplication_check_lexical_and_exact(), test_02_semantically_same_requirements_live_bge_embeddings(), test_03_contradictory_requirements_live_conflict_radar()

### Community 17 - "1. Feature Priority Breakdown"
Cohesion: 0.33
Nodes (5): 1. Feature Priority Breakdown, P0 — Core MVP (Must-Have), P1 — High-Impact Differentiators, P2 — Usability & Lifecycle, PSE-01 Feature Specification & Priorities

## Knowledge Gaps
- **10 isolated node(s):** `Documentation Standards & Continuous Sync Rules`, `Git Commit Workflow Rule`, `Requirement Quality Copilot Feature Guide`, `Slack Meeting Notes`, `Brake Actuator` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 156 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `RequirementStatement` connect `Deterministic Verification & Test Blueprints` to `Dual-Key Governance & Workspaces`, `Qualcomm AI 100 SDK & Inference`, `main.py`, `Document Parsing & Requirement Extraction`, `Live Qualcomm Cloud AI 100 Client`, `Qualcomm AI 100 Defect Analysis`, `storage.py`, `test_live_duplicates_conflicts.py`, `test_rbac_and_workspaces.py`, `qualcomm_service.py`, `test_context_and_duplicates.py`?**
  _High betweenness centrality (0.147) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `RequirementStore` (e.g. with `DualKeySignOff` and `ProjectContext`) actually correct?**
  _`RequirementStore` has 8 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Documentation Standards & Continuous Sync Rules`, `Git Commit Workflow Rule`, `Requirement Quality Copilot Feature Guide` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Dual-Key Governance & Workspaces` be split into smaller, more focused modules?**
  _Cohesion score 0.05070422535211268 - nodes in this community are weakly interconnected._
- **Why does `RequirementStore` connect `Deterministic Verification & Test Blueprints` to `Dual-Key Governance & Workspaces`, `Qualcomm AI 100 SDK & Inference`, `storage.py`, `test_rbac_and_workspaces.py`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `RequirementStatement` (e.g. with `analyze_conflicts()` and `SemanticDuplicateRequest`) actually correct?**
  _`RequirementStatement` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Should `Qualcomm AI 100 SDK & Inference` be split into smaller, more focused modules?**
  _Cohesion score 0.07502131287297528 - nodes in this community are weakly interconnected._