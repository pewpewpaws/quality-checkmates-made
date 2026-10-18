# Graph Report - Oi-Thon  (2026-10-18)

## Corpus Check
- 70 files · ~69,888 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: .csv 3, .example 1, (none) 1)

## Summary
- 649 nodes · 1528 edges · 24 communities (20 shown, 4 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 156 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f72b30d3`
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
- test_phase_0_to_2_e2e.py
- QualcommService
- qualcomm_service.py
- schemas.py
- 1. Feature Priority Breakdown
- 2. Multi-Domain Scenario Breakdown
- IssueCard
- test_context_and_duplicates.py
- export_service.py
- test_phase_3_pipelines.py
- reset_store_state
- main.py

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

## Communities (24 total, 4 thin omitted)

### Community 0 - "UserRole"
Cohesion: 0.07
Nodes (21): get_user_role(), require_write_permission(), verify_dual_key_role_action(), get_project_context(), update_project_context(), upload_context_document(), enrich_requirement_with_ai(), check_duplicate_requirements() (+13 more)

### Community 1 - "Apple Design"
Cohesion: 0.09
Nodes (21): 10. Gesture design details (the "feel" checklist), 11. Frame-level smoothness, 12. Materials & depth — translucency conveys hierarchy, 13. Multimodal feedback — motion + sound + haptics, 14. Reduced motion & accessibility, 15. Typography — optical sizing, tracking, leading, 16. Design foundations — the eight principles, 17. Process (+13 more)

### Community 2 - "Deterministic Verification & Test Blueprints"
Cohesion: 0.08
Nodes (10): ProjectContext, ProjectDocumentContext, ProjectWorkspace, RequirementStatement, ExportService, RequirementStore, test_sqlite_write_through_rehydration(), test_requirement_statement_creation() (+2 more)

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
Cohesion: 0.11
Nodes (7): test_live_chat_copilot_grounded(), test_live_embeddings_bge_large(), test_live_interpretation_duel(), test_live_ping_and_hardware_status(), test_live_smart_rewriter_zero_fabrication(), test_live_verification_blueprint(), test_live_xray_flaw_extraction()

### Community 8 - "RequirementStatus"
Cohesion: 0.14
Nodes (6): RequirementStatus, test_broke_entrepreneur_toy_company_chat_synthesis(), test_mobile_chip_distribution_and_execution_chat_synthesis(), test_pm_plain_language_chat_interaction(), test_dual_key_separation_of_duties_rbac(), test_tbd_resolution_and_provisional_demotion_governance()

### Community 9 - "Autonomous Vehicle Feature Briefs"
Cohesion: 0.29
Nodes (7): Brake Actuator, Forward Radar, Instrument Cluster, Non-Volatile Crash Recorder, Autonomous Emergency Braking (AEB) Feature Brief, Functional Obligations, Vision Perception Module

### Community 11 - "routes_analysis.py"
Cohesion: 0.15
Nodes (13): AnalysisRequest, analyze_conflicts(), analyze_semantic_duplicates(), analyze_xray(), generate_blueprint(), IntentLockRequest, resolve_text(), rewrite_requirement() (+5 more)

### Community 12 - "test_phase_0_to_2_e2e.py"
Cohesion: 0.12
Nodes (7): test_phase_0_system_health(), test_phase_1_api_multipart_file_upload(), test_phase_1_chat_copilot_synthesis(), test_phase_2_conflict_radar_contradictions(), test_phase_2_duplicate_detection_and_dual_key_signoff(), test_phase_2_evidence_validator_offsets(), test_phase_2_rubric_scoring_and_receipts()

### Community 13 - "QualcommService"
Cohesion: 0.08
Nodes (10): ConflictRadarResponse, extract_chat_data(), parse_tool_args(), QualcommService, live_service(), test_interpretation_duel_pipeline_contrast_and_cards(), test_smart_rewriter_pipeline_intent_lock_and_tbds(), test_verification_blueprint_pipeline_criteria() (+2 more)

### Community 16 - "schemas.py"
Cohesion: 0.07
Nodes (35): chat_synthesize_requirements(), add_project_document(), create_project(), delete_project(), delete_project_document(), get_project(), list_project_documents(), list_projects() (+27 more)

### Community 17 - "1. Feature Priority Breakdown"
Cohesion: 0.33
Nodes (5): 1. Feature Priority Breakdown, P0 — Core MVP (Must-Have), P1 — High-Impact Differentiators, P2 — Usability & Lifecycle, PSE-01 Feature Specification & Priorities

### Community 18 - "2. Multi-Domain Scenario Breakdown"
Cohesion: 0.20
Nodes (9): 1. Executive Summary, 2. Multi-Domain Scenario Breakdown, 3. Key Research Takeaways & Calibrated Thresholds, Extensive Empirical Research Findings: Exact Dupes, Semantic Dupes & Conflict Radar, Scenario 1: Automotive EV Powertrain & BMS (ISO 26262 ASIL-D), Scenario 2: Medical Infusion Pump & Fluidics (IEC 62304 / ISO 14971), Scenario 3: Aerospace Autonomous UAV Flight Controller (DO-178C / DO-254), Scenario 4: Industrial IoT Edge Gateway (IEC 62443 / ISA-95) (+1 more)

### Community 22 - "IssueCard"
Cohesion: 0.06
Nodes (18): IssueCard, RequirementConflictCard, EvidenceValidator, RubricScoringEngine, test_evidence_validator_card_enrichment(), test_no_double_jeopardy_on_substring_and_card_overlap(), test_rubric_engine_consistency_deductions(), 1. Executive Summary (+10 more)

### Community 26 - "export_service.py"
Cohesion: 0.17
Nodes (4): test_export_csv_default_project(), test_export_pdf_default_project(), test_export_project_isolation(), test_export_rbac_executive_filtering()

### Community 29 - "test_phase_3_pipelines.py"
Cohesion: 0.07
Nodes (14): DiffToken, DiffTokenType, IntentLockReport, IntentLockValidator, test_api_analysis_blueprint_endpoint(), test_api_analysis_duel_endpoint(), test_api_analysis_intent_lock_direct_endpoint(), test_api_analysis_rewrite_endpoint() (+6 more)

### Community 36 - "main.py"
Cohesion: 0.16
Nodes (5): health_check(), lifespan(), preload_demo_datasets(), root(), setup_and_teardown_test_database()

## Knowledge Gaps
- **10 isolated node(s):** `Documentation Standards & Continuous Sync Rules`, `Git Commit Workflow Rule`, `Requirement Quality Copilot Feature Guide`, `Slack Meeting Notes`, `Brake Actuator` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 275 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `RequirementStatement` connect `Deterministic Verification & Test Blueprints` to `UserRole`, `test_live_duplicates_conflicts.py`, `main.py`, `Document Parsing & Requirement Extraction`, `Live Qualcomm Cloud AI 100 Client`, `RequirementStatus`, `routes_analysis.py`, `QualcommService`, `qualcomm_service.py`, `schemas.py`, `IssueCard`, `test_context_and_duplicates.py`, `export_service.py`, `test_phase_3_pipelines.py`?**
  _High betweenness centrality (0.132) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `RequirementStatement` (e.g. with `analyze_conflicts()` and `SemanticDuplicateRequest`) actually correct?**
  _`RequirementStatement` has 10 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Documentation Standards & Continuous Sync Rules`, `Git Commit Workflow Rule`, `Requirement Quality Copilot Feature Guide` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UserRole` be split into smaller, more focused modules?**
  _Cohesion score 0.06594071385359952 - nodes in this community are weakly interconnected._
- **Why does `QualcommService` connect `QualcommService` to `UserRole`, `Deterministic Verification & Test Blueprints`, `test_live_duplicates_conflicts.py`, `main.py`, `Live Qualcomm Cloud AI 100 Client`, `RequirementStatus`, `routes_analysis.py`, `qualcomm_service.py`, `schemas.py`, `IssueCard`, `test_phase_3_pipelines.py`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Are the 13 inferred relationships involving `QualcommService` (e.g. with `ConflictRadarResponse` and `DuelCard`) actually correct?**
  _`QualcommService` has 13 INFERRED edges - model-reasoned connections that need verification._
- **Should `Apple Design` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._