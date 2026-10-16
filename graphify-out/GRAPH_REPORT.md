# Graph Report - Oi-Thon  (2026-10-17)

## Corpus Check
- 56 files · ~47,131 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: .csv 2, .example 1, (none) 1)

## Summary
- 444 nodes · 1050 edges · 27 communities (18 shown, 9 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 100 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `68bad67c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- routes_requirements.py
- Qualcomm AI 100 SDK & Inference
- Deterministic Verification & Test Blueprints
- main.py
- Graphify Analysis & Reporting
- Qualcomm AI 100 Engineering Directives
- Document Parsing & Requirement Extraction
- Live Qualcomm Cloud AI 100 Client
- Qualcomm AI 100 Defect Analysis
- Autonomous Vehicle Feature Briefs
- test_chat_copilot.py
- test_live_duplicates_conflicts.py
- test_rbac_and_workspaces.py
- storage.py
- test_api.py
- UserRole
- 1. Feature Priority Breakdown
- 2. Multi-Domain Scenario Breakdown
- chat_synthesize_requirements
- dual_key_sign_off
- get_project
- RequirementStatus
- delete_project
- get_project_context
- clean_test_workspaces

## God Nodes (most connected - your core abstractions)
1. `RequirementStore` - 46 edges
2. `RequirementStatement` - 42 edges
3. `QualcommService` - 42 edges
4. `UserRole` - 38 edges
5. `RequirementStatus` - 26 edges
6. `DocumentParser` - 26 edges
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

## Communities (27 total, 9 thin omitted)

### Community 0 - "routes_requirements.py"
Cohesion: 0.14
Nodes (7): check_duplicate_requirements(), check_project_conflicts(), check_semantic_duplicate_requirements(), delete_requirement(), get_requirement(), list_requirements(), update_requirement()

### Community 1 - "Qualcomm AI 100 SDK & Inference"
Cohesion: 0.08
Nodes (30): Documentation Standards & Continuous Sync Rules, ChatMessageItem, ChatRequirementRequest, ChatRequirementResponse, ConflictRadarRequest, ConflictRadarResponse, DocumentParseRequest, DocumentParseResponse (+22 more)

### Community 2 - "Deterministic Verification & Test Blueprints"
Cohesion: 0.12
Nodes (6): ProjectContext, ProjectDocumentContext, ProjectWorkspace, RequirementStatement, RequirementStore, test_sqlite_write_through_rehydration()

### Community 3 - "main.py"
Cohesion: 0.22
Nodes (4): health_check(), lifespan(), preload_demo_datasets(), root()

### Community 4 - "Graphify Analysis & Reporting"
Cohesion: 0.08
Nodes (15): Settings, extract_semantic_chunk(), label_communities_cirrascale(), main(), normalize_id(), parse_tool_call_args(), extract_chat_data(), parse_tool_args() (+7 more)

### Community 5 - "Qualcomm AI 100 Engineering Directives"
Cohesion: 0.06
Nodes (41): AGENTS.md — Development Guidelines & Living Project Tracker, Radical Candor & Brutal Idea Evaluation Rule, Git Commit Workflow Rule, Project Standards & Qualcomm AI 100 Engineering Directives, BAAI/bge-large-en-v1.5, Qualcomm Imagine API Endpoints Reference, Phase 0.5 Empirical Research & Validation Report, Phase 1: Backend Foundation & Conversational Copilot Findings (+33 more)

### Community 6 - "Document Parsing & Requirement Extraction"
Cohesion: 0.13
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

### Community 12 - "test_live_duplicates_conflicts.py"
Cohesion: 0.14
Nodes (4): clean_context_test_projects(), test_01_requirement_duplication_check_lexical_and_exact(), test_02_semantically_same_requirements_live_bge_embeddings(), test_03_contradictory_requirements_live_conflict_radar()

### Community 16 - "UserRole"
Cohesion: 0.20
Nodes (5): add_project_document(), create_project(), toggle_project_lock(), update_project(), UserRole

### Community 17 - "1. Feature Priority Breakdown"
Cohesion: 0.33
Nodes (5): 1. Feature Priority Breakdown, P0 — Core MVP (Must-Have), P1 — High-Impact Differentiators, P2 — Usability & Lifecycle, PSE-01 Feature Specification & Priorities

### Community 18 - "2. Multi-Domain Scenario Breakdown"
Cohesion: 0.20
Nodes (9): 1. Executive Summary, 2. Multi-Domain Scenario Breakdown, 3. Key Research Takeaways & Calibrated Thresholds, Extensive Empirical Research Findings: Exact Dupes, Semantic Dupes & Conflict Radar, Scenario 1: Automotive EV Powertrain & BMS (ISO 26262 ASIL-D), Scenario 2: Medical Infusion Pump & Fluidics (IEC 62304 / ISO 14971), Scenario 3: Aerospace Autonomous UAV Flight Controller (DO-178C / DO-254), Scenario 4: Industrial IoT Edge Gateway (IEC 62443 / ISA-95) (+1 more)

### Community 19 - "chat_synthesize_requirements"
Cohesion: 0.25
Nodes (3): chat_synthesize_requirements(), update_project_context(), upload_context_document()

### Community 20 - "dual_key_sign_off"
Cohesion: 0.29
Nodes (3): verify_dual_key_role_action(), create_requirement(), dual_key_sign_off()

### Community 21 - "get_project"
Cohesion: 0.29
Nodes (3): get_project(), list_project_documents(), list_projects()

### Community 22 - "RequirementStatus"
Cohesion: 0.43
Nodes (5): ConflictType, IssueSeverity, IssueType, RequirementStatus, test_requirement_statement_creation()

## Knowledge Gaps
- **10 isolated node(s):** `Documentation Standards & Continuous Sync Rules`, `Git Commit Workflow Rule`, `Requirement Quality Copilot Feature Guide`, `Slack Meeting Notes`, `Brake Actuator` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 165 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `RequirementStatement` connect `Deterministic Verification & Test Blueprints` to `routes_requirements.py`, `Qualcomm AI 100 SDK & Inference`, `main.py`, `Document Parsing & Requirement Extraction`, `Live Qualcomm Cloud AI 100 Client`, `Qualcomm AI 100 Defect Analysis`, `test_live_duplicates_conflicts.py`, `test_rbac_and_workspaces.py`, `storage.py`, `dual_key_sign_off`, `RequirementStatus`?**
  _High betweenness centrality (0.133) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `RequirementStore` (e.g. with `DualKeySignOff` and `ProjectContext`) actually correct?**
  _`RequirementStore` has 8 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Documentation Standards & Continuous Sync Rules`, `Git Commit Workflow Rule`, `Requirement Quality Copilot Feature Guide` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `routes_requirements.py` be split into smaller, more focused modules?**
  _Cohesion score 0.13725490196078433 - nodes in this community are weakly interconnected._
- **Why does `RequirementStore` connect `Deterministic Verification & Test Blueprints` to `Qualcomm AI 100 SDK & Inference`, `test_rbac_and_workspaces.py`, `storage.py`, `UserRole`, `RequirementStatus`, `.find_duplicates`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `RequirementStatement` (e.g. with `analyze_conflicts()` and `SemanticDuplicateRequest`) actually correct?**
  _`RequirementStatement` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Should `Qualcomm AI 100 SDK & Inference` be split into smaller, more focused modules?**
  _Cohesion score 0.07848944835246205 - nodes in this community are weakly interconnected._