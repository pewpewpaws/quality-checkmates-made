# Graph Report - Oi-Thon  (2026-10-17)

## Corpus Check
- Corpus is ~42,013 words - fits in a single context window. You may not need a graph.

## Summary
- 377 nodes · 894 edges · 11 communities (10 shown, 1 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 87 edges (avg confidence: 0.92)
- Token cost: 23,878 input · 11,968 output

## Community Hubs (Navigation)
- Dual-Key Governance & Workspaces
- Qualcomm AI 100 SDK & Inference
- Deterministic Verification & Test Blueprints
- Qualcomm AI 100 Cluster Connectivity
- Graphify Analysis & Reporting
- Qualcomm AI 100 Engineering Directives
- Document Parsing & Requirement Extraction
- Live Qualcomm Cloud AI 100 Client
- Qualcomm AI 100 Defect Analysis
- Autonomous Vehicle Feature Briefs

## God Nodes (most connected - your core abstractions)
1. `RequirementStore` - 44 edges
2. `UserRole` - 36 edges
3. `RequirementStatement` - 33 edges
4. `QualcommService` - 31 edges
5. `DocumentParser` - 26 edges
6. `RequirementStatus` - 24 edges
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
- `test_pm_plain_language_chat_interaction()` --uses--> `RequirementStatus`  [INFERRED]
  backend/tests/test_chat_copilot.py → backend/models/schemas.py
- `test_dual_key_separation_of_duties_rbac()` --uses--> `RequirementStatus`  [INFERRED]
  backend/tests/test_rbac_and_workspaces.py → backend/models/schemas.py

## Import Cycles
- None detected.

## Communities (11 total, 1 thin omitted)

### Community 0 - "Dual-Key Governance & Workspaces"
Cohesion: 0.05
Nodes (24): get_user_role(), require_write_permission(), verify_dual_key_role_action(), chat_synthesize_requirements(), get_project_context(), update_project_context(), upload_context_document(), add_project_document() (+16 more)

### Community 1 - "Qualcomm AI 100 SDK & Inference"
Cohesion: 0.09
Nodes (28): ChatMessageItem, ChatRequirementRequest, ChatRequirementResponse, DocumentParseRequest, DocumentParseResponse, DualKeySignOff, DuelCard, InterpretationDuel (+20 more)

### Community 2 - "Deterministic Verification & Test Blueprints"
Cohesion: 0.11
Nodes (6): ProjectContext, ProjectDocumentContext, ProjectWorkspace, RequirementStatement, RequirementStore, test_sqlite_write_through_rehydration()

### Community 3 - "Qualcomm AI 100 Cluster Connectivity"
Cohesion: 0.05
Nodes (9): health_check(), lifespan(), preload_demo_datasets(), root(), test_dual_key_sign_off_flow(), test_pm_plain_language_chat_interaction(), clean_context_test_projects(), reset_store_state() (+1 more)

### Community 4 - "Graphify Analysis & Reporting"
Cohesion: 0.10
Nodes (14): extract_semantic_chunk(), label_communities_cirrascale(), main(), normalize_id(), parse_tool_call_args(), extract_chat_data(), parse_tool_args(), run_aitl_evaluation() (+6 more)

### Community 5 - "Qualcomm AI 100 Engineering Directives"
Cohesion: 0.08
Nodes (28): AGENTS.md — Development Guidelines & Living Project Tracker, Radical Candor & Brutal Idea Evaluation Rule, Documentation Standards & Continuous Sync Rules, Git Commit Workflow Rule, Project Standards & Qualcomm AI 100 Engineering Directives, BAAI/bge-large-en-v1.5, Settings, Qualcomm Imagine API Endpoints Reference (+20 more)

### Community 6 - "Document Parsing & Requirement Extraction"
Cohesion: 0.12
Nodes (15): parse_file(), parse_text(), DocumentParser, test_parse_csv(), test_parse_explicit_req_tags(), test_parse_numbered_list(), test_parse_bulleted_user_stories_without_numbers(), test_parse_csv_without_ids() (+7 more)

### Community 7 - "Live Qualcomm Cloud AI 100 Client"
Cohesion: 0.10
Nodes (8): live_service(), test_live_chat_copilot_grounded(), test_live_embeddings_bge_large(), test_live_interpretation_duel(), test_live_ping_and_hardware_status(), test_live_smart_rewriter_zero_fabrication(), test_live_verification_blueprint(), test_live_xray_flaw_extraction()

### Community 8 - "Qualcomm AI 100 Defect Analysis"
Cohesion: 0.27
Nodes (6): AnalysisRequest, analyze_xray(), generate_blueprint(), resolve_text(), rewrite_requirement(), stage_duel()

### Community 9 - "Autonomous Vehicle Feature Briefs"
Cohesion: 0.29
Nodes (7): Brake Actuator, Forward Radar, Instrument Cluster, Non-Volatile Crash Recorder, Autonomous Emergency Braking (AEB) Feature Brief, Functional Obligations, Vision Perception Module

## Knowledge Gaps
- **10 isolated node(s):** `Documentation Standards & Continuous Sync Rules`, `Git Commit Workflow Rule`, `Slack Meeting Notes`, `Requirement Quality Copilot Feature Guide`, `Autonomous Emergency Braking (AEB) Feature Brief` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 132 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `RequirementStatement` connect `Deterministic Verification & Test Blueprints` to `Dual-Key Governance & Workspaces`, `Qualcomm AI 100 SDK & Inference`, `Qualcomm AI 100 Cluster Connectivity`, `Qualcomm AI 100 Engineering Directives`, `Document Parsing & Requirement Extraction`, `Live Qualcomm Cloud AI 100 Client`?**
  _High betweenness centrality (0.129) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `RequirementStore` (e.g. with `DualKeySignOff` and `ProjectContext`) actually correct?**
  _`RequirementStore` has 8 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Documentation Standards & Continuous Sync Rules`, `Git Commit Workflow Rule`, `Slack Meeting Notes` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Dual-Key Governance & Workspaces` be split into smaller, more focused modules?**
  _Cohesion score 0.05217391304347826 - nodes in this community are weakly interconnected._
- **Why does `RequirementStore` connect `Deterministic Verification & Test Blueprints` to `Dual-Key Governance & Workspaces`, `Qualcomm AI 100 SDK & Inference`, `Qualcomm AI 100 Cluster Connectivity`?**
  _High betweenness centrality (0.127) - this node is a cross-community bridge._
- **Are the 22 inferred relationships involving `UserRole` (e.g. with `get_user_role()` and `require_write_permission()`) actually correct?**
  _`UserRole` has 22 INFERRED edges - model-reasoned connections that need verification._
- **Should `Qualcomm AI 100 SDK & Inference` be split into smaller, more focused modules?**
  _Cohesion score 0.08672659968270756 - nodes in this community are weakly interconnected._