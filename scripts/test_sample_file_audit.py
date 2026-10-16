import asyncio
import json
import logging
import time
from pathlib import Path
from backend.services.document_parser import DocumentParser
from backend.services.qualcomm_service import QualcommService
from backend.services.storage import RequirementStore
from backend.models.schemas import RequirementStatement

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("sample_audit")


async def run_sample_file_audit():
    qualcomm = QualcommService(mock_mode=False)
    store = RequirementStore()

    print("=" * 80)
    print("LIVE AUDIT TEST: SAMPLE SPECIFICATION DOCUMENTS")
    print("TESTING: EXACT DUPES, NEURAL SEMANTIC DUPES, CONFLICT RADAR")
    print("QUALCOMM CLOUD AI 100: BAAI/bge-large-en-v1.5 + Llama-3.3-70B")
    print("=" * 80)

    # ==========================================================================
    # FILE 1: REWRITTEN PRD EV BATTERY SYSTEM (sample_data/pm_documents/prd_ev_battery_system.txt)
    # ==========================================================================
    file1_path = Path("sample_data/pm_documents/prd_ev_battery_system.txt")
    print(f"\n[FILE 1] Ingesting and Auditing: {file1_path}")
    raw_text1 = file1_path.read_text(encoding="utf-8")
    reqs1, fmt1 = DocumentParser.parse_text(raw_text1, default_category="Powertrain BMS")
    print(f"  • Extracted {len(reqs1)} requirements (Format: {fmt1})")

    pid1 = "audit-ev-bms"
    store.delete_project(pid1)
    for r in reqs1:
        store.upsert(r, project_id=pid1)

    # 1. Exact Duplicate Test
    lexical_dupes1 = store.find_duplicates(project_id=pid1, similarity_threshold=0.70)
    exact_matches1 = [d for d in lexical_dupes1 if d["match_type"] == "EXACT"]
    print(f"  [1] Exact Duplicate Check: Found {len(exact_matches1)} exact collision(s)")
    for em in exact_matches1:
        print(f"      • Collision: {em['req_id_a']} <-> {em['req_id_b']}")
    assert len(exact_matches1) >= 1, "Expected at least 1 exact duplicate in PRD"

    # 2. Neural Semantic Duplicate Test (bge-large)
    sem_matches1 = await qualcomm.find_semantic_duplicates(reqs1, similarity_threshold=0.75)
    print(f"  [2] Neural Semantic Check: Found {len(sem_matches1)} semantic duplicate cluster(s)")
    for sm in sem_matches1:
        print(f"      • Match: {sm.req_id_a} <-> {sm.req_id_b} (Score: {sm.similarity_score:.4f})")
        print(f"        Explanation: {sm.explanation}")
    assert len(sem_matches1) >= 1, "Expected at least 1 semantic duplicate in PRD"

    # 3. Conflict Radar (Llama-3.3-70B)
    print(f"  [3] Conflict Radar Scanning for Contradictions...")
    # Target Req 3 (crash disconnect) vs Req 8 (crash keep closed)
    req_crash_open = next(r for r in reqs1 if "disconnect high voltage" in r.text)
    req_crash_closed = next(r for r in reqs1 if "remain energized and closed" in r.text)
    req_control = next(r for r in reqs1 if "cabin ambient footwell" in r.text)

    conflict_res1 = await qualcomm.detect_conflicts(req_crash_open, [req_crash_closed, req_control])
    print(f"      • Contradictions Detected: {conflict_res1.total_conflicts_found}")
    for c in conflict_res1.conflicts:
        print(f"        - Type:     {c.conflict_type} ({c.severity})")
        print(f"        - Quote A:  \"{c.conflicting_quote_a}\"")
        print(f"        - Quote B:  \"{c.conflicting_quote_b}\"")
        print(f"        - Suggestion: {c.reconciliation_suggestion[:80]}...")
    assert conflict_res1.total_conflicts_found >= 1, "Expected contactor crash conflict detected"
    assert conflict_res1.conflicts[0].severity == "BLOCKER"

    # ==========================================================================
    # FILE 2: QUALITY STRESS SAMPLE (sample_data/pm_documents/quality_stress_sample.txt)
    # ==========================================================================
    file2_path = Path("sample_data/pm_documents/quality_stress_sample.txt")
    print(f"\n[FILE 2] Ingesting and Auditing: {file2_path}")
    raw_text2 = file2_path.read_text(encoding="utf-8")
    reqs2, fmt2 = DocumentParser.parse_text(raw_text2, default_category="Avionics")
    print(f"  • Extracted {len(reqs2)} requirements (Format: {fmt2})")

    pid2 = "audit-avionics"
    store.delete_project(pid2)
    for r in reqs2:
        store.upsert(r, project_id=pid2)

    # 1. Exact Duplicate Test
    lexical_dupes2 = store.find_duplicates(project_id=pid2, similarity_threshold=0.70)
    exact_matches2 = [d for d in lexical_dupes2 if d["match_type"] == "EXACT"]
    print(f"  [1] Exact Duplicate Check: Found {len(exact_matches2)} exact collision(s)")
    for em in exact_matches2:
        print(f"      • Collision: {em['req_id_a']} <-> {em['req_id_b']}")
    assert len(exact_matches2) >= 1, "Expected exact duplicate between REQ-NAV-001 and REQ-NAV-003"

    # 2. Neural Semantic Duplicate Test (bge-large)
    sem_matches2 = await qualcomm.find_semantic_duplicates(reqs2, similarity_threshold=0.75)
    print(f"  [2] Neural Semantic Check: Found {len(sem_matches2)} semantic duplicate cluster(s)")
    for sm in sem_matches2:
        print(f"      • Match: {sm.req_id_a} <-> {sm.req_id_b} (Score: {sm.similarity_score:.4f}, Type: {sm.match_type})")
    assert len(sem_matches2) >= 2, "Expected at least 2 semantic duplicates in avionics sample"

    # 3. Conflict Radar (Llama-3.3-70B)
    print(f"  [3] Conflict Radar Scanning for Contradictions...")
    # Power voltage shed vs power keep full continuous
    req_pwr_shed = next(r for r in reqs2 if r.id == "REQ-PWR-002")
    req_pwr_keep = next(r for r in reqs2 if r.id == "REQ-PWR-003")
    req_pwr_ctrl = next(r for r in reqs2 if r.id == "REQ-ENV-001")

    conflict_res2 = await qualcomm.detect_conflicts(req_pwr_shed, [req_pwr_keep, req_pwr_ctrl])
    print(f"      • Contradictions Detected: {conflict_res2.total_conflicts_found}")
    for c in conflict_res2.conflicts:
        print(f"        - Clashing IDs: {c.req_id_a} <-> {c.req_id_b}")
        print(f"        - Type:         {c.conflict_type} ({c.severity})")
        print(f"        - Quote A:      \"{c.conflicting_quote_a}\"")
        print(f"        - Quote B:      \"{c.conflicting_quote_b}\"")
        print(f"        - Resolution:   {c.reconciliation_suggestion[:80]}...")
    assert conflict_res2.total_conflicts_found >= 1, "Expected power shed contradiction detected"

    # Cleanup test stores
    store.delete_project(pid1)
    store.delete_project(pid2)

    print("\n" + "=" * 80)
    print("✅ ALL SAMPLE DOCUMENT AUDITS COMPLETED SUCCESSFULLY WITH 100% PASS RATE")
    print("=" * 80)


if __name__ == "__main__":
    asyncio.run(run_sample_file_audit())
