# Graph Report - Oi-Thon  (2026-10-19)

## Corpus Check
- 92 files · ~103,231 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: .css 5, .csv 3, (none) 2)

## Summary
- 760 nodes · 1784 edges · 38 communities (29 shown, 9 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 164 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fc0e40d5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- UserRole
- Apple Design
- Deterministic Verification & Test Blueprints
- RequirementStatus
- run_cirrascale_graphify.py
- Qualcomm AI 100 Engineering Directives
- Document Parsing & Requirement Extraction
- Live Qualcomm Cloud AI 100 Client
- delete_requirement
- Autonomous Vehicle Feature Briefs
- routes_analysis.py
- IssueCard
- QualcommService
- StarBorder
- package.json
- models/__init__.py
- 1. Feature Priority Breakdown
- 2. Multi-Domain Scenario Breakdown
- routes_projects.py
- test_phase_0_to_2_e2e.py
- schemas.py
- RequirementStatus
- add_project_document
- routes_chat.py
- test_live_duplicates_conflicts.py
- export_service.py
- .oxlintrc.json
- React + Vite
- test_phase_3_pipelines.py
- main.py
- dual_key_sign_off
- delete_project
- health_check
- clean_context_test_projects
- clean_test_workspaces
- reset_store_state
- update_requirement

## God Nodes (most connected - your core abstractions)
1. `RequirementStatement` - 60 edges
2. `QualcommService` - 54 edges
3. `RequirementStore` - 51 edges
4. `RequirementStatus` - 50 edges
5. `UserRole` - 46 edges
6. `DocumentParser` - 35 edges
7. `IssueCard` - 27 edges
8. `StarBorder()` - 25 edges
9. `Apple Design` - 21 edges
10. `ProjectWorkspace` - 20 edges

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

## Communities (38 total, 9 thin omitted)

### Community 0 - "UserRole"
Cohesion: 0.18
Nodes (7): check_duplicate_requirements(), check_project_conflicts(), check_semantic_duplicate_requirements(), get_requirement(), get_requirement_quality_score(), list_requirements(), UserRole

### Community 1 - "Apple Design"
Cohesion: 0.09
Nodes (21): 10. Gesture design details (the "feel" checklist), 11. Frame-level smoothness, 12. Materials & depth — translucency conveys hierarchy, 13. Multimodal feedback — motion + sound + haptics, 14. Reduced motion & accessibility, 15. Typography — optical sizing, tracking, leading, 16. Design foundations — the eight principles, 17. Process (+13 more)

### Community 2 - "Deterministic Verification & Test Blueprints"
Cohesion: 0.09
Nodes (7): ProjectContext, ProjectDocumentContext, ProjectWorkspace, RequirementStore, test_sqlite_write_through_rehydration(), run_extensive_research(), run_sample_file_audit()

### Community 3 - "RequirementStatus"
Cohesion: 0.14
Nodes (5): preload_demo_datasets(), setup_and_teardown_test_database(), test_broke_entrepreneur_toy_company_chat_synthesis(), test_mobile_chip_distribution_and_execution_chat_synthesis(), test_pm_plain_language_chat_interaction()

### Community 4 - "run_cirrascale_graphify.py"
Cohesion: 0.09
Nodes (15): Settings, extract_semantic_chunk(), label_communities_cirrascale(), main(), normalize_id(), parse_tool_call_args(), extract_chat_data(), parse_tool_args() (+7 more)

### Community 5 - "Qualcomm AI 100 Engineering Directives"
Cohesion: 0.06
Nodes (41): AGENTS.md — Development Guidelines & Living Project Tracker, Radical Candor & Brutal Idea Evaluation Rule, Git Commit Workflow Rule, Project Standards & Qualcomm AI 100 Engineering Directives, BAAI/bge-large-en-v1.5, Qualcomm Imagine API Endpoints Reference, Phase 0.5 Empirical Research & Validation Report, Phase 1: Backend Foundation & Conversational Copilot Findings (+33 more)

### Community 6 - "Document Parsing & Requirement Extraction"
Cohesion: 0.11
Nodes (19): parse_file(), parse_text(), DocumentParser, test_parse_csv(), test_parse_explicit_req_tags(), test_parse_numbered_list(), test_reject_tool_commentary_and_sanitize_glyphs(), test_phase_1_parse_aerospace_txt() (+11 more)

### Community 7 - "Live Qualcomm Cloud AI 100 Client"
Cohesion: 0.11
Nodes (7): test_live_chat_copilot_grounded(), test_live_embeddings_bge_large(), test_live_interpretation_duel(), test_live_ping_and_hardware_status(), test_live_smart_rewriter_zero_fabrication(), test_live_verification_blueprint(), test_live_xray_flaw_extraction()

### Community 9 - "Autonomous Vehicle Feature Briefs"
Cohesion: 0.29
Nodes (7): Brake Actuator, Forward Radar, Instrument Cluster, Non-Volatile Crash Recorder, Autonomous Emergency Braking (AEB) Feature Brief, Functional Obligations, Vision Perception Module

### Community 11 - "routes_analysis.py"
Cohesion: 0.15
Nodes (14): AnalysisRequest, analyze_conflicts(), analyze_semantic_duplicates(), analyze_xray(), generate_blueprint(), IntentLockRequest, resolve_text(), rewrite_requirement() (+6 more)

### Community 12 - "IssueCard"
Cohesion: 0.06
Nodes (19): IssueCard, QualityScore, RequirementConflictCard, EvidenceValidator, RubricScoringEngine, test_evidence_validator_card_enrichment(), test_no_double_jeopardy_on_substring_and_card_overlap(), test_rubric_engine_consistency_deductions() (+11 more)

### Community 13 - "QualcommService"
Cohesion: 0.07
Nodes (15): ConflictRadarResponse, DuelCard, InterpretationDuel, RewriteSuggestion, TbdDefault, extract_chat_data(), parse_tool_args(), QualcommService (+7 more)

### Community 14 - "StarBorder"
Cohesion: 0.09
Nodes (43): App(), ChatAndIngestTab(), channels(), clamp(), ClickSpark, EASINGS, SHAPES, smoothstep() (+35 more)

### Community 15 - "package.json"
Cohesion: 0.07
Nodes (26): dependencies, gsap, lucide-react, react, react-dom, devDependencies, oxlint, @types/react (+18 more)

### Community 16 - "models/__init__.py"
Cohesion: 0.21
Nodes (11): ChatMessageItem, ConflictType, DocumentParseRequest, DocumentParseResponse, ExecutiveCertifyRequest, IssueSeverity, IssueType, ProjectCreateRequest (+3 more)

### Community 17 - "1. Feature Priority Breakdown"
Cohesion: 0.33
Nodes (5): 1. Feature Priority Breakdown, P0 — Core MVP (Must-Have), P1 — High-Impact Differentiators, P2 — Usability & Lifecycle, PSE-01 Feature Specification & Priorities

### Community 18 - "2. Multi-Domain Scenario Breakdown"
Cohesion: 0.20
Nodes (9): 1. Executive Summary, 2. Multi-Domain Scenario Breakdown, 3. Key Research Takeaways & Calibrated Thresholds, Extensive Empirical Research Findings: Exact Dupes, Semantic Dupes & Conflict Radar, Scenario 1: Automotive EV Powertrain & BMS (ISO 26262 ASIL-D), Scenario 2: Medical Infusion Pump & Fluidics (IEC 62304 / ISO 14971), Scenario 3: Aerospace Autonomous UAV Flight Controller (DO-178C / DO-254), Scenario 4: Industrial IoT Edge Gateway (IEC 62443 / ISA-95) (+1 more)

### Community 19 - "routes_projects.py"
Cohesion: 0.16
Nodes (7): get_user_role(), require_write_permission(), get_master_test_suite(), get_project(), list_project_documents(), list_projects(), lifespan()

### Community 20 - "test_phase_0_to_2_e2e.py"
Cohesion: 0.12
Nodes (7): test_phase_0_system_health(), test_phase_1_api_multipart_file_upload(), test_phase_1_chat_copilot_synthesis(), test_phase_2_conflict_radar_contradictions(), test_phase_2_duplicate_detection_and_dual_key_signoff(), test_phase_2_evidence_validator_offsets(), test_phase_2_rubric_scoring_and_receipts()

### Community 21 - "schemas.py"
Cohesion: 0.20
Nodes (5): Documentation Standards & Continuous Sync Rules, enrich_requirement_with_ai(), create_requirement(), RequirementStatement, SemanticDuplicateMatch

### Community 22 - "RequirementStatus"
Cohesion: 0.28
Nodes (9): export_requirements_csv(), export_requirements_pdf(), DualKeySignOff, RequirementStatus, TestCase, VerificationPlan, test_executive_verification_and_certification_lifecycle(), test_dual_key_signoff_defaults() (+1 more)

### Community 23 - "add_project_document"
Cohesion: 0.18
Nodes (5): add_project_document(), create_project(), executive_certify_project(), toggle_project_lock(), ProjectLockRequest

### Community 24 - "routes_chat.py"
Cohesion: 0.19
Nodes (6): chat_synthesize_requirements(), get_project_context(), update_project_context(), upload_context_document(), ChatRequirementRequest, ChatRequirementResponse

### Community 25 - "test_live_duplicates_conflicts.py"
Cohesion: 0.11
Nodes (5): test_01_requirement_duplication_check_lexical_and_exact(), test_02_semantically_same_requirements_live_bge_embeddings(), test_03_contradictory_requirements_live_conflict_radar(), test_dual_key_separation_of_duties_rbac(), test_tbd_resolution_and_provisional_demotion_governance()

### Community 26 - "export_service.py"
Cohesion: 0.11
Nodes (5): ExportService, test_export_csv_default_project(), test_export_pdf_default_project(), test_export_project_isolation(), test_export_rbac_executive_filtering()

### Community 27 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 28 - "React + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + Vite

### Community 29 - "test_phase_3_pipelines.py"
Cohesion: 0.07
Nodes (14): DiffToken, DiffTokenType, IntentLockReport, IntentLockValidator, test_api_analysis_blueprint_endpoint(), test_api_analysis_duel_endpoint(), test_api_analysis_intent_lock_direct_endpoint(), test_api_analysis_rewrite_endpoint() (+6 more)

### Community 31 - "dual_key_sign_off"
Cohesion: 0.18
Nodes (4): verify_dual_key_role_action(), update_project(), dual_key_sign_off(), recalculate_and_save_score()

## Knowledge Gaps
- **13 isolated node(s):** `@types/react`, `@types/react-dom`, `oxlint`, `Documentation Standards & Continuous Sync Rules`, `Git Commit Workflow Rule` (+8 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 313 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `RequirementStatement` connect `schemas.py` to `UserRole`, `Deterministic Verification & Test Blueprints`, `RequirementStatus`, `Document Parsing & Requirement Extraction`, `Live Qualcomm Cloud AI 100 Client`, `update_requirement`, `routes_analysis.py`, `IssueCard`, `QualcommService`, `models/__init__.py`, `RequirementStatus`, `routes_chat.py`, `test_live_duplicates_conflicts.py`, `export_service.py`, `test_phase_3_pipelines.py`, `main.py`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `RequirementStatement` (e.g. with `analyze_conflicts()` and `SemanticDuplicateRequest`) actually correct?**
  _`RequirementStatement` has 10 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@types/react`, `@types/react-dom`, `oxlint` to the rest of the system?**
  _13 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Apple Design` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Why does `RequirementStatus` connect `RequirementStatus` to `Deterministic Verification & Test Blueprints`, `RequirementStatus`, `Document Parsing & Requirement Extraction`, `Live Qualcomm Cloud AI 100 Client`, `update_requirement`, `QualcommService`, `models/__init__.py`, `routes_projects.py`, `test_phase_0_to_2_e2e.py`, `schemas.py`, `add_project_document`, `test_live_duplicates_conflicts.py`, `export_service.py`, `test_phase_3_pipelines.py`, `main.py`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Are the 14 inferred relationships involving `QualcommService` (e.g. with `ConflictRadarResponse` and `DualKeySignOff`) actually correct?**
  _`QualcommService` has 14 INFERRED edges - model-reasoned connections that need verification._
- **Should `Deterministic Verification & Test Blueprints` be split into smaller, more focused modules?**
  _Cohesion score 0.09019607843137255 - nodes in this community are weakly interconnected._