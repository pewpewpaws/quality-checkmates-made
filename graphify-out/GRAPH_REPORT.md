# Graph Report - Oi-Thon  (2026-10-17)

## Corpus Check
- 61 files · ~54,783 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: .csv 3, .example 1, (none) 1)

## Summary
- 517 nodes · 1233 edges · 24 communities (18 shown, 6 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 122 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d1d67ac5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- UserRole
- schemas.py
- Deterministic Verification & Test Blueprints
- main.py
- Graphify Analysis & Reporting
- Qualcomm AI 100 Engineering Directives
- Document Parsing & Requirement Extraction
- Live Qualcomm Cloud AI 100 Client
- Qualcomm AI 100 Defect Analysis
- Autonomous Vehicle Feature Briefs
- schemas.py
- storage.py
- UserRole
- 1. Feature Priority Breakdown
- 2. Multi-Domain Scenario Breakdown
- chat_synthesize_requirements
- dual_key_sign_off
- get_project
- test_rubric_and_evidence.py
- delete_project
- update_project
- get_project_context
- update_requirement

## God Nodes (most connected - your core abstractions)
1. `RequirementStore` - 48 edges
2. `RequirementStatement` - 47 edges
3. `QualcommService` - 44 edges
4. `UserRole` - 41 edges
5. `DocumentParser` - 32 edges
6. `RequirementStatus` - 31 edges
7. `IssueCard` - 24 edges
8. `RequirementConflictCard` - 17 edges
9. `ProjectWorkspace` - 16 edges
10. `ProjectDocumentContext` - 14 edges

## Surprising Connections (you probably didn't know these)
- `Medical Pump SRS` --conceptually_related_to--> `Requirement Quality Copilot`  [INFERRED]
  sample_data/pm_documents/medical_pump_srs.pdf → HACKATHON.md
- `Requirement Quality Copilot Feature Guide` --specifies--> `Requirement Quality Copilot`  [EXTRACTED]
  docs/reference/Requirement_Quality_Copilot_Feature_Guide.pdf → HACKATHON.md
- `run_sample_file_audit()` --uses--> `DocumentParser`  [INFERRED]
  scripts/test_sample_file_audit.py → backend/services/document_parser.py
- `test_dual_key_sign_off_flow()` --uses--> `RequirementStatus`  [INFERRED]
  backend/tests/test_api.py → backend/models/schemas.py
- `test_pm_plain_language_chat_interaction()` --uses--> `RequirementStatus`  [INFERRED]
  backend/tests/test_chat_copilot.py → backend/models/schemas.py

## Import Cycles
- None detected.

## Communities (24 total, 6 thin omitted)

### Community 0 - "UserRole"
Cohesion: 0.15
Nodes (6): check_duplicate_requirements(), check_project_conflicts(), check_semantic_duplicate_requirements(), get_requirement(), get_requirement_quality_score(), list_requirements()

### Community 1 - "schemas.py"
Cohesion: 0.08
Nodes (11): Documentation Standards & Continuous Sync Rules, ConflictRadarResponse, RewriteSuggestion, SemanticDuplicateMatch, TbdDefault, extract_chat_data(), parse_tool_args(), QualcommService (+3 more)

### Community 2 - "Deterministic Verification & Test Blueprints"
Cohesion: 0.12
Nodes (7): ProjectContext, ProjectDocumentContext, ProjectWorkspace, RequirementStatement, RequirementStore, test_sqlite_write_through_rehydration(), test_requirement_statement_creation()

### Community 3 - "main.py"
Cohesion: 0.05
Nodes (12): health_check(), lifespan(), preload_demo_datasets(), root(), test_dual_key_sign_off_flow(), clean_context_test_projects(), clean_test_workspaces(), test_01_requirement_duplication_check_lexical_and_exact() (+4 more)

### Community 4 - "Graphify Analysis & Reporting"
Cohesion: 0.06
Nodes (18): Settings, test_broke_entrepreneur_toy_company_chat_synthesis(), test_mobile_chip_distribution_and_execution_chat_synthesis(), test_pm_plain_language_chat_interaction(), extract_semantic_chunk(), label_communities_cirrascale(), main(), normalize_id() (+10 more)

### Community 5 - "Qualcomm AI 100 Engineering Directives"
Cohesion: 0.06
Nodes (41): AGENTS.md — Development Guidelines & Living Project Tracker, Radical Candor & Brutal Idea Evaluation Rule, Git Commit Workflow Rule, Project Standards & Qualcomm AI 100 Engineering Directives, BAAI/bge-large-en-v1.5, Qualcomm Imagine API Endpoints Reference, Phase 0.5 Empirical Research & Validation Report, Phase 1: Backend Foundation & Conversational Copilot Findings (+33 more)

### Community 6 - "Document Parsing & Requirement Extraction"
Cohesion: 0.07
Nodes (23): parse_file(), DocumentParser, test_parse_csv(), test_parse_explicit_req_tags(), test_parse_numbered_list(), test_phase_0_system_health(), test_phase_1_api_multipart_file_upload(), test_phase_1_chat_copilot_synthesis() (+15 more)

### Community 7 - "Live Qualcomm Cloud AI 100 Client"
Cohesion: 0.10
Nodes (8): live_service(), test_live_chat_copilot_grounded(), test_live_embeddings_bge_large(), test_live_interpretation_duel(), test_live_ping_and_hardware_status(), test_live_smart_rewriter_zero_fabrication(), test_live_verification_blueprint(), test_live_xray_flaw_extraction()

### Community 8 - "Qualcomm AI 100 Defect Analysis"
Cohesion: 0.17
Nodes (11): AnalysisRequest, analyze_conflicts(), analyze_semantic_duplicates(), analyze_xray(), generate_blueprint(), resolve_text(), rewrite_requirement(), score_requirement_endpoint() (+3 more)

### Community 9 - "Autonomous Vehicle Feature Briefs"
Cohesion: 0.29
Nodes (7): Brake Actuator, Forward Radar, Instrument Cluster, Non-Volatile Crash Recorder, Autonomous Emergency Braking (AEB) Feature Brief, Functional Obligations, Vision Perception Module

### Community 11 - "schemas.py"
Cohesion: 0.16
Nodes (22): parse_text(), ChatMessageItem, ChatRequirementRequest, ChatRequirementResponse, ConflictRadarRequest, ConflictType, DocumentParseRequest, DocumentParseResponse (+14 more)

### Community 16 - "UserRole"
Cohesion: 0.25
Nodes (3): add_project_document(), create_project(), toggle_project_lock()

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
Cohesion: 0.19
Nodes (6): verify_dual_key_role_action(), create_requirement(), delete_requirement(), dual_key_sign_off(), recalculate_and_save_score(), UserRole

### Community 21 - "get_project"
Cohesion: 0.29
Nodes (3): get_project(), list_project_documents(), list_projects()

### Community 22 - "test_rubric_and_evidence.py"
Cohesion: 0.08
Nodes (7): IssueCard, QualityScore, RequirementConflictCard, EvidenceValidator, RubricScoringEngine, test_evidence_validator_card_enrichment(), test_rubric_engine_consistency_deductions()

## Knowledge Gaps
- **10 isolated node(s):** `Documentation Standards & Continuous Sync Rules`, `Git Commit Workflow Rule`, `Requirement Quality Copilot Feature Guide`, `Slack Meeting Notes`, `Brake Actuator` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 203 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `RequirementStatement` connect `Deterministic Verification & Test Blueprints` to `schemas.py`, `main.py`, `Document Parsing & Requirement Extraction`, `Live Qualcomm Cloud AI 100 Client`, `Qualcomm AI 100 Defect Analysis`, `schemas.py`, `storage.py`, `dual_key_sign_off`, `test_rubric_and_evidence.py`, `update_requirement`?**
  _High betweenness centrality (0.127) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `RequirementStore` (e.g. with `DualKeySignOff` and `ProjectContext`) actually correct?**
  _`RequirementStore` has 8 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Documentation Standards & Continuous Sync Rules`, `Git Commit Workflow Rule`, `Requirement Quality Copilot Feature Guide` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `schemas.py` be split into smaller, more focused modules?**
  _Cohesion score 0.07982583454281568 - nodes in this community are weakly interconnected._
- **Why does `UserRole` connect `dual_key_sign_off` to `UserRole`, `Deterministic Verification & Test Blueprints`, `main.py`, `Document Parsing & Requirement Extraction`, `schemas.py`, `storage.py`, `UserRole`, `chat_synthesize_requirements`, `delete_project`, `update_project`, `update_requirement`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `RequirementStatement` (e.g. with `analyze_conflicts()` and `SemanticDuplicateRequest`) actually correct?**
  _`RequirementStatement` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Should `Deterministic Verification & Test Blueprints` be split into smaller, more focused modules?**
  _Cohesion score 0.11846689895470383 - nodes in this community are weakly interconnected._