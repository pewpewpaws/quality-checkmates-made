# Graph Report - Oi-Thon  (2026-10-17)

## Corpus Check
- 66 files · ~60,169 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: .csv 3, .example 1, (none) 1)

## Summary
- 584 nodes · 1380 edges · 26 communities (19 shown, 7 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 139 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `810f05ab`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- UserRole
- schemas.py
- Deterministic Verification & Test Blueprints
- RequirementStatus
- Graphify Analysis & Reporting
- Qualcomm AI 100 Engineering Directives
- Document Parsing & Requirement Extraction
- Live Qualcomm Cloud AI 100 Client
- Qualcomm AI 100 Defect Analysis
- Autonomous Vehicle Feature Briefs
- test_phase_3_pipelines.py
- QualcommService
- update_requirement
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
- delete_requirement

## God Nodes (most connected - your core abstractions)
1. `QualcommService` - 51 edges
2. `RequirementStatement` - 49 edges
3. `RequirementStore` - 48 edges
4. `UserRole` - 41 edges
5. `RequirementStatus` - 33 edges
6. `DocumentParser` - 32 edges
7. `IssueCard` - 24 edges
8. `RequirementConflictCard` - 17 edges
9. `ProjectWorkspace` - 16 edges
10. `RubricScoringEngine` - 15 edges

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

## Communities (26 total, 7 thin omitted)

### Community 0 - "UserRole"
Cohesion: 0.18
Nodes (7): check_duplicate_requirements(), check_project_conflicts(), check_semantic_duplicate_requirements(), get_requirement(), get_requirement_quality_score(), list_requirements(), UserRole

### Community 1 - "schemas.py"
Cohesion: 0.14
Nodes (23): ChatMessageItem, ChatRequirementRequest, ChatRequirementResponse, ConflictRadarRequest, ConflictType, DocumentParseRequest, DocumentParseResponse, DualKeySignOff (+15 more)

### Community 2 - "Deterministic Verification & Test Blueprints"
Cohesion: 0.11
Nodes (6): ProjectContext, ProjectDocumentContext, ProjectSummary, ProjectWorkspace, RequirementStore, test_sqlite_write_through_rehydration()

### Community 3 - "RequirementStatus"
Cohesion: 0.06
Nodes (13): health_check(), lifespan(), preload_demo_datasets(), root(), RequirementStatus, test_dual_key_sign_off_flow(), test_broke_entrepreneur_toy_company_chat_synthesis(), test_mobile_chip_distribution_and_execution_chat_synthesis() (+5 more)

### Community 4 - "Graphify Analysis & Reporting"
Cohesion: 0.09
Nodes (14): extract_semantic_chunk(), label_communities_cirrascale(), main(), normalize_id(), parse_tool_call_args(), extract_chat_data(), parse_tool_args(), run_aitl_evaluation() (+6 more)

### Community 5 - "Qualcomm AI 100 Engineering Directives"
Cohesion: 0.06
Nodes (41): AGENTS.md — Development Guidelines & Living Project Tracker, Radical Candor & Brutal Idea Evaluation Rule, Git Commit Workflow Rule, Project Standards & Qualcomm AI 100 Engineering Directives, BAAI/bge-large-en-v1.5, Qualcomm Imagine API Endpoints Reference, Phase 0.5 Empirical Research & Validation Report, Phase 1: Backend Foundation & Conversational Copilot Findings (+33 more)

### Community 6 - "Document Parsing & Requirement Extraction"
Cohesion: 0.06
Nodes (25): parse_file(), parse_text(), DocumentParser, test_parse_csv(), test_parse_explicit_req_tags(), test_parse_numbered_list(), test_phase_0_system_health(), test_phase_1_api_multipart_file_upload() (+17 more)

### Community 7 - "Live Qualcomm Cloud AI 100 Client"
Cohesion: 0.10
Nodes (8): live_service(), test_live_chat_copilot_grounded(), test_live_embeddings_bge_large(), test_live_interpretation_duel(), test_live_ping_and_hardware_status(), test_live_smart_rewriter_zero_fabrication(), test_live_verification_blueprint(), test_live_xray_flaw_extraction()

### Community 8 - "Qualcomm AI 100 Defect Analysis"
Cohesion: 0.15
Nodes (13): AnalysisRequest, analyze_conflicts(), analyze_semantic_duplicates(), analyze_xray(), generate_blueprint(), IntentLockRequest, resolve_text(), rewrite_requirement() (+5 more)

### Community 9 - "Autonomous Vehicle Feature Briefs"
Cohesion: 0.29
Nodes (7): Brake Actuator, Forward Radar, Instrument Cluster, Non-Volatile Crash Recorder, Autonomous Emergency Braking (AEB) Feature Brief, Functional Obligations, Vision Perception Module

### Community 11 - "test_phase_3_pipelines.py"
Cohesion: 0.06
Nodes (17): DiffToken, DiffTokenType, IntentLockReport, IntentLockValidator, test_api_analysis_blueprint_endpoint(), test_api_analysis_duel_endpoint(), test_api_analysis_intent_lock_direct_endpoint(), test_api_analysis_rewrite_endpoint() (+9 more)

### Community 12 - "QualcommService"
Cohesion: 0.06
Nodes (17): Documentation Standards & Continuous Sync Rules, Settings, ConflictRadarResponse, RequirementConflictCard, RequirementStatement, SemanticDuplicateMatch, extract_chat_data(), parse_tool_args() (+9 more)

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
Cohesion: 0.22
Nodes (4): verify_dual_key_role_action(), create_requirement(), dual_key_sign_off(), recalculate_and_save_score()

### Community 21 - "get_project"
Cohesion: 0.29
Nodes (3): get_project(), list_project_documents(), list_projects()

### Community 22 - "test_rubric_and_evidence.py"
Cohesion: 0.06
Nodes (16): IssueCard, EvidenceValidator, RubricScoringEngine, test_evidence_validator_card_enrichment(), test_rubric_engine_consistency_deductions(), 1. Executive Summary, 2. Deterministic Scoring Rubric (100 Points), 3. Evidence Grounding & Character Span Offsets (+8 more)

## Knowledge Gaps
- **10 isolated node(s):** `Documentation Standards & Continuous Sync Rules`, `Git Commit Workflow Rule`, `Requirement Quality Copilot Feature Guide`, `Slack Meeting Notes`, `Brake Actuator` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 233 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `RequirementStatement` connect `QualcommService` to `UserRole`, `schemas.py`, `Deterministic Verification & Test Blueprints`, `RequirementStatus`, `Document Parsing & Requirement Extraction`, `Live Qualcomm Cloud AI 100 Client`, `Qualcomm AI 100 Defect Analysis`, `test_phase_3_pipelines.py`, `update_requirement`, `storage.py`, `dual_key_sign_off`, `test_rubric_and_evidence.py`?**
  _High betweenness centrality (0.129) - this node is a cross-community bridge._
- **Are the 13 inferred relationships involving `QualcommService` (e.g. with `ConflictRadarResponse` and `DuelCard`) actually correct?**
  _`QualcommService` has 13 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Documentation Standards & Continuous Sync Rules`, `Git Commit Workflow Rule`, `Requirement Quality Copilot Feature Guide` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `schemas.py` be split into smaller, more focused modules?**
  _Cohesion score 0.13630229419703105 - nodes in this community are weakly interconnected._
- **Why does `QualcommService` connect `QualcommService` to `schemas.py`, `RequirementStatus`, `Live Qualcomm Cloud AI 100 Client`, `Qualcomm AI 100 Defect Analysis`, `test_phase_3_pipelines.py`, `storage.py`, `test_rubric_and_evidence.py`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `RequirementStatement` (e.g. with `analyze_conflicts()` and `SemanticDuplicateRequest`) actually correct?**
  _`RequirementStatement` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Should `Deterministic Verification & Test Blueprints` be split into smaller, more focused modules?**
  _Cohesion score 0.11074197120708748 - nodes in this community are weakly interconnected._