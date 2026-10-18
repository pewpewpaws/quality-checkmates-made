# Graph Report - Oi-Thon  (2026-10-18)

## Corpus Check
- 85 files · ~85,318 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: .csv 3, (none) 2, .css 2)

## Summary
- 727 nodes · 1675 edges · 40 communities (32 shown, 8 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 155 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `20123f02`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- UserRole
- Apple Design
- Deterministic Verification & Test Blueprints
- test_live_duplicates_conflicts.py
- Graphify Analysis & Reporting
- Qualcomm AI 100 Engineering Directives
- Document Parsing & Requirement Extraction
- Live Qualcomm Cloud AI 100 Client
- RequirementStatus
- Autonomous Vehicle Feature Briefs
- routes_analysis.py
- aitl_phase_3_eval.py
- schemas.py
- storage.py
- test_rbac_and_workspaces.py
- UserRole
- 1. Feature Priority Breakdown
- 2. Multi-Domain Scenario Breakdown
- get_project_context
- create_requirement
- get_project
- IssueCard
- delete_project
- QualcommService
- test_api.py
- export_service.py
- delete_requirement
- api.js
- test_phase_3_pipelines.py
- package.json
- qualcomm_service.py
- research_dupes_and_conflicts.py
- .oxlintrc.json
- React + Vite
- storage.py
- main.py
- intent_lock.py
- test_phase_0_to_2_e2e.py

## God Nodes (most connected - your core abstractions)
1. `RequirementStatement` - 58 edges
2. `QualcommService` - 52 edges
3. `RequirementStore` - 50 edges
4. `RequirementStatus` - 45 edges
5. `UserRole` - 43 edges
6. `DocumentParser` - 35 edges
7. `IssueCard` - 27 edges
8. `Apple Design` - 21 edges
9. `ProjectWorkspace` - 19 edges
10. `RubricScoringEngine` - 18 edges

## Surprising Connections (you probably didn't know these)
- `3. Evidence Grounding & Character Span Offsets` --references--> `EvidenceValidator`  [INFERRED]
  docs/findings/phase_2_findings.md → backend/services/evidence_validator.py
- `Medical Pump SRS` --conceptually_related_to--> `Requirement Quality Copilot`  [INFERRED]
  sample_data/pm_documents/medical_pump_srs.pdf → HACKATHON.md
- `1. Executive Summary` --references--> `EvidenceValidator`  [INFERRED]
  docs/findings/phase_2_findings.md → backend/services/evidence_validator.py
- `1. Executive Summary` --references--> `RubricScoringEngine`  [INFERRED]
  docs/findings/phase_2_findings.md → backend/services/rubric_engine.py
- `Requirement Quality Copilot Feature Guide` --specifies--> `Requirement Quality Copilot`  [EXTRACTED]
  docs/reference/Requirement_Quality_Copilot_Feature_Guide.pdf → HACKATHON.md

## Import Cycles
- None detected.

## Communities (40 total, 8 thin omitted)

### Community 0 - "UserRole"
Cohesion: 0.14
Nodes (10): create_project(), check_duplicate_requirements(), check_project_conflicts(), check_semantic_duplicate_requirements(), export_requirements_csv(), export_requirements_pdf(), get_requirement(), get_requirement_quality_score() (+2 more)

### Community 1 - "Apple Design"
Cohesion: 0.09
Nodes (21): 10. Gesture design details (the "feel" checklist), 11. Frame-level smoothness, 12. Materials & depth — translucency conveys hierarchy, 13. Multimodal feedback — motion + sound + haptics, 14. Reduced motion & accessibility, 15. Typography — optical sizing, tracking, leading, 16. Design foundations — the eight principles, 17. Process (+13 more)

### Community 2 - "Deterministic Verification & Test Blueprints"
Cohesion: 0.08
Nodes (9): update_project_context(), upload_context_document(), ProjectContext, ProjectDocumentContext, ProjectWorkspace, RequirementStatement, ExportService, RequirementStore (+1 more)

### Community 3 - "test_live_duplicates_conflicts.py"
Cohesion: 0.20
Nodes (4): clean_test_workspaces(), test_01_requirement_duplication_check_lexical_and_exact(), test_02_semantically_same_requirements_live_bge_embeddings(), test_03_contradictory_requirements_live_conflict_radar()

### Community 4 - "Graphify Analysis & Reporting"
Cohesion: 0.09
Nodes (14): extract_semantic_chunk(), label_communities_cirrascale(), main(), normalize_id(), parse_tool_call_args(), extract_chat_data(), parse_tool_args(), run_aitl_evaluation() (+6 more)

### Community 5 - "Qualcomm AI 100 Engineering Directives"
Cohesion: 0.06
Nodes (41): AGENTS.md — Development Guidelines & Living Project Tracker, Radical Candor & Brutal Idea Evaluation Rule, Git Commit Workflow Rule, Project Standards & Qualcomm AI 100 Engineering Directives, BAAI/bge-large-en-v1.5, Qualcomm Imagine API Endpoints Reference, Phase 0.5 Empirical Research & Validation Report, Phase 1: Backend Foundation & Conversational Copilot Findings (+33 more)

### Community 6 - "Document Parsing & Requirement Extraction"
Cohesion: 0.11
Nodes (19): parse_file(), parse_text(), DocumentParser, test_parse_csv(), test_parse_explicit_req_tags(), test_parse_numbered_list(), test_reject_tool_commentary_and_sanitize_glyphs(), test_phase_1_parse_aerospace_txt() (+11 more)

### Community 7 - "Live Qualcomm Cloud AI 100 Client"
Cohesion: 0.10
Nodes (8): live_service(), test_live_chat_copilot_grounded(), test_live_embeddings_bge_large(), test_live_interpretation_duel(), test_live_ping_and_hardware_status(), test_live_smart_rewriter_zero_fabrication(), test_live_verification_blueprint(), test_live_xray_flaw_extraction()

### Community 8 - "RequirementStatus"
Cohesion: 0.19
Nodes (5): update_requirement(), RequirementStatus, test_broke_entrepreneur_toy_company_chat_synthesis(), test_mobile_chip_distribution_and_execution_chat_synthesis(), test_pm_plain_language_chat_interaction()

### Community 9 - "Autonomous Vehicle Feature Briefs"
Cohesion: 0.29
Nodes (7): Brake Actuator, Forward Radar, Instrument Cluster, Non-Volatile Crash Recorder, Autonomous Emergency Braking (AEB) Feature Brief, Functional Obligations, Vision Perception Module

### Community 11 - "routes_analysis.py"
Cohesion: 0.15
Nodes (13): AnalysisRequest, analyze_conflicts(), analyze_semantic_duplicates(), analyze_xray(), generate_blueprint(), IntentLockRequest, resolve_text(), rewrite_requirement() (+5 more)

### Community 13 - "schemas.py"
Cohesion: 0.13
Nodes (21): preload_demo_datasets(), ChatMessageItem, ChatRequirementRequest, ChatRequirementResponse, ConflictRadarRequest, ConflictType, DocumentParseRequest, DocumentParseResponse (+13 more)

### Community 14 - "storage.py"
Cohesion: 0.29
Nodes (3): get_user_role(), require_write_permission(), enrich_requirement_with_ai()

### Community 15 - "test_rbac_and_workspaces.py"
Cohesion: 0.18
Nodes (3): reset_store_state(), test_dual_key_separation_of_duties_rbac(), test_tbd_resolution_and_provisional_demotion_governance()

### Community 16 - "UserRole"
Cohesion: 0.19
Nodes (3): add_project_document(), toggle_project_lock(), update_project()

### Community 17 - "1. Feature Priority Breakdown"
Cohesion: 0.33
Nodes (5): 1. Feature Priority Breakdown, P0 — Core MVP (Must-Have), P1 — High-Impact Differentiators, P2 — Usability & Lifecycle, PSE-01 Feature Specification & Priorities

### Community 18 - "2. Multi-Domain Scenario Breakdown"
Cohesion: 0.20
Nodes (9): 1. Executive Summary, 2. Multi-Domain Scenario Breakdown, 3. Key Research Takeaways & Calibrated Thresholds, Extensive Empirical Research Findings: Exact Dupes, Semantic Dupes & Conflict Radar, Scenario 1: Automotive EV Powertrain & BMS (ISO 26262 ASIL-D), Scenario 2: Medical Infusion Pump & Fluidics (IEC 62304 / ISO 14971), Scenario 3: Aerospace Autonomous UAV Flight Controller (DO-178C / DO-254), Scenario 4: Industrial IoT Edge Gateway (IEC 62443 / ISA-95) (+1 more)

### Community 20 - "create_requirement"
Cohesion: 0.22
Nodes (4): verify_dual_key_role_action(), create_requirement(), dual_key_sign_off(), recalculate_and_save_score()

### Community 21 - "get_project"
Cohesion: 0.29
Nodes (3): get_project(), list_project_documents(), list_projects()

### Community 22 - "IssueCard"
Cohesion: 0.06
Nodes (20): chat_synthesize_requirements(), IssueCard, QualityScore, RequirementConflictCard, EvidenceValidator, RubricScoringEngine, test_evidence_validator_card_enrichment(), test_no_double_jeopardy_on_substring_and_card_overlap() (+12 more)

### Community 24 - "QualcommService"
Cohesion: 0.14
Nodes (7): RewriteSuggestion, TbdDefault, QualcommService, test_smart_rewriter_pipeline_intent_lock_and_tbds(), test_xray_pipeline_extracts_and_grounds_issues(), test_tbd_preservation_and_defaults(), run_aitl_phase_3_evaluation()

### Community 26 - "export_service.py"
Cohesion: 0.29
Nodes (4): test_export_csv_default_project(), test_export_pdf_default_project(), test_export_project_isolation(), test_export_rbac_executive_filtering()

### Community 28 - "api.js"
Cohesion: 0.13
Nodes (30): App(), ChatTab(), ConflictTab(), DeepInspectorTab(), GeminiBackground(), Header(), IngestTab(), MainStudio() (+22 more)

### Community 29 - "test_phase_3_pipelines.py"
Cohesion: 0.08
Nodes (11): test_api_analysis_blueprint_endpoint(), test_api_analysis_duel_endpoint(), test_api_analysis_intent_lock_direct_endpoint(), test_api_analysis_rewrite_endpoint(), test_api_analysis_xray_endpoint(), test_intent_lock_detects_dropped_contractual_numbers(), test_intent_lock_detects_dropped_negation(), test_intent_lock_detects_introduced_negation() (+3 more)

### Community 30 - "package.json"
Cohesion: 0.08
Nodes (24): dependencies, react, react-dom, devDependencies, oxlint, @types/react, @types/react-dom, vite (+16 more)

### Community 31 - "qualcomm_service.py"
Cohesion: 0.19
Nodes (6): Documentation Standards & Continuous Sync Rules, TestCase, VerificationPlan, extract_chat_data(), parse_tool_args(), test_verification_blueprint_pipeline_criteria()

### Community 32 - "research_dupes_and_conflicts.py"
Cohesion: 0.16
Nodes (4): ConflictRadarResponse, SemanticDuplicateMatch, run_extensive_research(), run_sample_file_audit()

### Community 33 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 34 - "React + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + Vite

### Community 36 - "main.py"
Cohesion: 0.25
Nodes (3): health_check(), lifespan(), root()

### Community 37 - "intent_lock.py"
Cohesion: 0.19
Nodes (4): DiffToken, DiffTokenType, IntentLockReport, IntentLockValidator

### Community 38 - "test_phase_0_to_2_e2e.py"
Cohesion: 0.12
Nodes (7): test_phase_0_system_health(), test_phase_1_api_multipart_file_upload(), test_phase_1_chat_copilot_synthesis(), test_phase_2_conflict_radar_contradictions(), test_phase_2_duplicate_detection_and_dual_key_signoff(), test_phase_2_evidence_validator_offsets(), test_phase_2_rubric_scoring_and_receipts()

## Knowledge Gaps
- **13 isolated node(s):** `@types/react`, `@types/react-dom`, `oxlint`, `Documentation Standards & Continuous Sync Rules`, `Git Commit Workflow Rule` (+8 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 301 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `RequirementStatement` connect `Deterministic Verification & Test Blueprints` to `test_live_duplicates_conflicts.py`, `Document Parsing & Requirement Extraction`, `Live Qualcomm Cloud AI 100 Client`, `RequirementStatus`, `routes_analysis.py`, `aitl_phase_3_eval.py`, `schemas.py`, `storage.py`, `test_rbac_and_workspaces.py`, `create_requirement`, `IssueCard`, `QualcommService`, `export_service.py`, `test_phase_3_pipelines.py`, `qualcomm_service.py`, `research_dupes_and_conflicts.py`, `storage.py`, `main.py`, `export_service.py`?**
  _High betweenness centrality (0.105) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `RequirementStatement` (e.g. with `analyze_conflicts()` and `SemanticDuplicateRequest`) actually correct?**
  _`RequirementStatement` has 10 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@types/react`, `@types/react-dom`, `oxlint` to the rest of the system?**
  _13 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UserRole` be split into smaller, more focused modules?**
  _Cohesion score 0.1368421052631579 - nodes in this community are weakly interconnected._
- **Why does `QualcommService` connect `QualcommService` to `research_dupes_and_conflicts.py`, `Deterministic Verification & Test Blueprints`, `test_live_duplicates_conflicts.py`, `main.py`, `Live Qualcomm Cloud AI 100 Client`, `RequirementStatus`, `routes_analysis.py`, `aitl_phase_3_eval.py`, `schemas.py`, `storage.py`, `IssueCard`, `test_phase_3_pipelines.py`, `qualcomm_service.py`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Are the 13 inferred relationships involving `QualcommService` (e.g. with `ConflictRadarResponse` and `DuelCard`) actually correct?**
  _`QualcommService` has 13 INFERRED edges - model-reasoned connections that need verification._
- **Should `Apple Design` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._