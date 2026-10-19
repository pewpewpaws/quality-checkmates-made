# Graph Report - Oi-Thon  (2026-10-19)

## Corpus Check
- 96 files · ~105,735 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: .css 5, .csv 3, (none) 2)

## Summary
- 801 nodes · 1827 edges · 36 communities (31 shown, 5 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 169 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9600f350`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- UserRole
- Apple Design
- Deterministic Verification & Test Blueprints
- routes_requirements.py
- run_cirrascale_graphify.py
- Qualcomm AI 100 Engineering Directives
- Document Parsing & Requirement Extraction
- Live Qualcomm Cloud AI 100 Client
- delete_requirement
- Autonomous Vehicle Feature Briefs
- routes_analysis.py
- IssueCard
- RequirementStatement
- StarBorder
- package.json
- schemas.py
- 1. Feature Priority Breakdown
- 2. Multi-Domain Scenario Breakdown
- get_master_test_suite
- Phase 4: Antigravity 2.0 Web Frontend & Executive Certification Screen Findings
- aitl_phase_3_eval.py
- qualcomm_service.py
- 2. Technical Specification & Implementation
- routes_chat.py
- json
- export_service.py
- .oxlintrc.json
- React + Vite
- test_phase_3_pipelines.py
- .extract_xray_issues
- add_project_document
- delete_project
- main.py
- update_requirement
- .client

## God Nodes (most connected - your core abstractions)
1. `RequirementStatement` - 60 edges
2. `QualcommService` - 54 edges
3. `RequirementStore` - 52 edges
4. `RequirementStatus` - 50 edges
5. `UserRole` - 46 edges
6. `DocumentParser` - 35 edges
7. `IssueCard` - 27 edges
8. `StarBorder()` - 25 edges
9. `ProjectWorkspace` - 22 edges
10. `Apple Design` - 21 edges

## Surprising Connections (you probably didn't know these)
- `2.1 X-Ray Issue Extraction (`Llama-3.3-70B`)` --references--> `EvidenceValidator`  [INFERRED]
  docs/findings/phase_3_findings.md → backend/services/evidence_validator.py
- `1. Executive Summary` --references--> `ProjectWorkspace`  [INFERRED]
  docs/findings/phase_1_5_findings.md → backend/models/schemas.py
- `3. Evidence Grounding & Character Span Offsets` --references--> `EvidenceValidator`  [INFERRED]
  docs/findings/phase_2_findings.md → backend/services/evidence_validator.py
- `2.2 Intent-Lock Smart Rewriter (`IntentLockValidator`)` --references--> `IntentLockValidator`  [INFERRED]
  docs/findings/phase_3_findings.md → backend/services/intent_lock.py
- `Medical Pump SRS` --conceptually_related_to--> `Requirement Quality Copilot`  [INFERRED]
  sample_data/pm_documents/medical_pump_srs.pdf → HACKATHON.md

## Import Cycles
- None detected.

## Communities (36 total, 5 thin omitted)

### Community 0 - "UserRole"
Cohesion: 0.16
Nodes (9): check_duplicate_requirements(), check_project_conflicts(), check_semantic_duplicate_requirements(), export_requirements_csv(), export_requirements_pdf(), get_requirement(), get_requirement_quality_score(), list_requirements() (+1 more)

### Community 1 - "Apple Design"
Cohesion: 0.09
Nodes (21): 10. Gesture design details (the "feel" checklist), 11. Frame-level smoothness, 12. Materials & depth — translucency conveys hierarchy, 13. Multimodal feedback — motion + sound + haptics, 14. Reduced motion & accessibility, 15. Typography — optical sizing, tracking, leading, 16. Design foundations — the eight principles, 17. Process (+13 more)

### Community 2 - "Deterministic Verification & Test Blueprints"
Cohesion: 0.07
Nodes (12): ProjectWorkspace, RequirementStore, test_sqlite_write_through_rehydration(), 1. Executive Summary, 2.1 Workspace Data Model, 2.2 Boundary Charter Locking (HTTP 423), 2. Multi-Project Workspace Architecture, 3. Hierarchical Persona-Based RBAC Matrix (+4 more)

### Community 3 - "routes_requirements.py"
Cohesion: 0.21
Nodes (5): get_user_role(), require_write_permission(), verify_dual_key_role_action(), dual_key_sign_off(), recalculate_and_save_score()

### Community 4 - "run_cirrascale_graphify.py"
Cohesion: 0.11
Nodes (11): extract_semantic_chunk(), label_communities_cirrascale(), main(), normalize_id(), parse_tool_call_args(), main(), parse_tool_args(), test_interpretation_duel() (+3 more)

### Community 5 - "Qualcomm AI 100 Engineering Directives"
Cohesion: 0.06
Nodes (41): AGENTS.md — Development Guidelines & Living Project Tracker, Radical Candor & Brutal Idea Evaluation Rule, Git Commit Workflow Rule, Project Standards & Qualcomm AI 100 Engineering Directives, BAAI/bge-large-en-v1.5, Qualcomm Imagine API Endpoints Reference, Phase 0.5 Empirical Research & Validation Report, Phase 1: Backend Foundation & Conversational Copilot Findings (+33 more)

### Community 6 - "Document Parsing & Requirement Extraction"
Cohesion: 0.06
Nodes (26): parse_file(), parse_text(), DocumentParser, test_parse_csv(), test_parse_explicit_req_tags(), test_parse_numbered_list(), test_reject_tool_commentary_and_sanitize_glyphs(), test_phase_0_system_health() (+18 more)

### Community 7 - "Live Qualcomm Cloud AI 100 Client"
Cohesion: 0.10
Nodes (8): live_service(), test_live_chat_copilot_grounded(), test_live_embeddings_bge_large(), test_live_interpretation_duel(), test_live_ping_and_hardware_status(), test_live_smart_rewriter_zero_fabrication(), test_live_verification_blueprint(), test_live_xray_flaw_extraction()

### Community 9 - "Autonomous Vehicle Feature Briefs"
Cohesion: 0.29
Nodes (7): Brake Actuator, Forward Radar, Instrument Cluster, Non-Volatile Crash Recorder, Autonomous Emergency Braking (AEB) Feature Brief, Functional Obligations, Vision Perception Module

### Community 11 - "routes_analysis.py"
Cohesion: 0.15
Nodes (13): AnalysisRequest, analyze_conflicts(), analyze_semantic_duplicates(), analyze_xray(), generate_blueprint(), IntentLockRequest, resolve_text(), rewrite_requirement() (+5 more)

### Community 12 - "IssueCard"
Cohesion: 0.06
Nodes (17): IssueCard, EvidenceValidator, RubricScoringEngine, test_evidence_validator_card_enrichment(), test_no_double_jeopardy_on_substring_and_card_overlap(), test_rubric_engine_consistency_deductions(), 1. Executive Summary, 2. Deterministic Scoring Rubric (100 Points) (+9 more)

### Community 13 - "RequirementStatement"
Cohesion: 0.22
Nodes (7): ConflictRadarResponse, RequirementConflictCard, RequirementStatement, SemanticDuplicateMatch, QualcommService, run_extensive_research(), run_sample_file_audit()

### Community 14 - "StarBorder"
Cohesion: 0.09
Nodes (42): App(), ChatAndIngestTab(), channels(), clamp(), ClickSpark, EASINGS, SHAPES, smoothstep() (+34 more)

### Community 15 - "package.json"
Cohesion: 0.07
Nodes (27): dependencies, gsap, lucide-react, react, react-dom, devDependencies, oxlint, @types/react (+19 more)

### Community 16 - "schemas.py"
Cohesion: 0.09
Nodes (31): ChatMessageItem, ChatRequirementRequest, ChatRequirementResponse, ConflictRadarRequest, ConflictType, DiffTokenType, DocumentParseRequest, DocumentParseResponse (+23 more)

### Community 17 - "1. Feature Priority Breakdown"
Cohesion: 0.33
Nodes (5): 1. Feature Priority Breakdown, P0 — Core MVP (Must-Have), P1 — High-Impact Differentiators, P2 — Usability & Lifecycle, PSE-01 Feature Specification & Priorities

### Community 18 - "2. Multi-Domain Scenario Breakdown"
Cohesion: 0.20
Nodes (9): 1. Executive Summary, 2. Multi-Domain Scenario Breakdown, 3. Key Research Takeaways & Calibrated Thresholds, Extensive Empirical Research Findings: Exact Dupes, Semantic Dupes & Conflict Radar, Scenario 1: Automotive EV Powertrain & BMS (ISO 26262 ASIL-D), Scenario 2: Medical Infusion Pump & Fluidics (IEC 62304 / ISO 14971), Scenario 3: Aerospace Autonomous UAV Flight Controller (DO-178C / DO-254), Scenario 4: Industrial IoT Edge Gateway (IEC 62443 / ISA-95) (+1 more)

### Community 19 - "get_master_test_suite"
Cohesion: 0.22
Nodes (4): get_master_test_suite(), get_project(), list_project_documents(), list_projects()

### Community 20 - "Phase 4: Antigravity 2.0 Web Frontend & Executive Certification Screen Findings"
Cohesion: 0.17
Nodes (11): 1. Executive Summary, 2.1 Technology Stack, 2.2 Design System & Geometry Tokens, 2. Frontend Architecture & Design Tokens, 3.1 60 FPS Iridescent Background Canvas (`GeminiBackground.jsx`), 3.2 1-Click Header Persona Switcher, 3.3 Executive Verification & Certification Screen, 3. Interactive Components & Presentation Features (+3 more)

### Community 21 - "aitl_phase_3_eval.py"
Cohesion: 0.18
Nodes (3): Settings, test_verification_blueprint_pipeline_criteria(), run_aitl_phase_3_evaluation()

### Community 22 - "qualcomm_service.py"
Cohesion: 0.20
Nodes (3): Documentation Standards & Continuous Sync Rules, enrich_requirement_with_ai(), create_requirement()

### Community 23 - "2. Technical Specification & Implementation"
Cohesion: 0.25
Nodes (7): 1. Executive Summary, 2.1 RFC 4180 CSV with UTF-8 BOM, 2.2 Publication-Grade Structured PDF Generation (ReportLab), 2.3 Role-Based Export Filtering, 2. Technical Specification & Implementation, 3. Automated Test Verification, Phase 2.5: Requirement Baseline Export Engine Findings

### Community 24 - "routes_chat.py"
Cohesion: 0.16
Nodes (5): chat_synthesize_requirements(), get_project_context(), update_project_context(), upload_context_document(), ProjectContext

### Community 25 - "json"
Cohesion: 0.43
Nodes (3): extract_chat_data(), parse_tool_args(), run_aitl_evaluation()

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
Cohesion: 0.05
Nodes (23): DiffToken, IntentLockReport, IntentLockValidator, test_api_analysis_blueprint_endpoint(), test_api_analysis_duel_endpoint(), test_api_analysis_intent_lock_direct_endpoint(), test_api_analysis_rewrite_endpoint(), test_api_analysis_xray_endpoint() (+15 more)

### Community 31 - "add_project_document"
Cohesion: 0.18
Nodes (5): add_project_document(), create_project(), executive_certify_project(), toggle_project_lock(), ProjectDocumentContext

### Community 33 - "main.py"
Cohesion: 0.05
Nodes (16): health_check(), init_workspaces(), lifespan(), preload_demo_datasets(), root(), setup_and_teardown_test_database(), test_broke_entrepreneur_toy_company_chat_synthesis(), test_mobile_chip_distribution_and_execution_chat_synthesis() (+8 more)

### Community 37 - ".client"
Cohesion: 0.14
Nodes (3): extract_chat_data(), parse_tool_args(), test_interpretation_duel_pipeline_contrast_and_cards()

## Knowledge Gaps
- **13 isolated node(s):** `@types/react`, `@types/react-dom`, `oxlint`, `Documentation Standards & Continuous Sync Rules`, `Git Commit Workflow Rule` (+8 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 339 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `RequirementStatement` connect `RequirementStatement` to `main.py`, `update_requirement`, `routes_requirements.py`, `Deterministic Verification & Test Blueprints`, `Document Parsing & Requirement Extraction`, `Live Qualcomm Cloud AI 100 Client`, `routes_analysis.py`, `IssueCard`, `schemas.py`, `aitl_phase_3_eval.py`, `qualcomm_service.py`, `routes_chat.py`, `export_service.py`, `test_phase_3_pipelines.py`, `add_project_document`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `RequirementStatement` (e.g. with `analyze_conflicts()` and `SemanticDuplicateRequest`) actually correct?**
  _`RequirementStatement` has 10 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@types/react`, `@types/react-dom`, `oxlint` to the rest of the system?**
  _13 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Apple Design` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Why does `RequirementStatus` connect `schemas.py` to `UserRole`, `main.py`, `update_requirement`, `routes_requirements.py`, `Deterministic Verification & Test Blueprints`, `Document Parsing & Requirement Extraction`, `Live Qualcomm Cloud AI 100 Client`, `RequirementStatement`, `get_master_test_suite`, `aitl_phase_3_eval.py`, `qualcomm_service.py`, `export_service.py`, `test_phase_3_pipelines.py`, `add_project_document`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Are the 14 inferred relationships involving `QualcommService` (e.g. with `ConflictRadarResponse` and `DualKeySignOff`) actually correct?**
  _`QualcommService` has 14 INFERRED edges - model-reasoned connections that need verification._
- **Should `Deterministic Verification & Test Blueprints` be split into smaller, more focused modules?**
  _Cohesion score 0.07003367003367003 - nodes in this community are weakly interconnected._