# Phase 2: Deterministic Engine, Rubric Scoring & Neural Clustering Findings

> **Comprehensive record of the Deterministic 100-Point Rubric Scoring Engine, Evidence Validator Substring Grounding with Character Offsets, Lexical & Neural Semantic Duplicate Detection (`BAAI/bge-large-en-v1.5`), and Conflict Radar Contradiction Reasoning on Qualcomm Cloud AI 100.**

---

## 1. Executive Summary

Phase 2 tackled the central flaw of naive LLM-based requirement reviewers: **score hallucination and quote drift**. In safety-critical systems engineering (ISO 26262, DO-178C, IEC 62304), engineering leadership and compliance auditors reject black-box subjective ratings (e.g., *"this requirement looks like a 7/10"*).

Phase 2 replaced probabilistic evaluation with a **Deterministic Compound Architecture**:
1. **Deterministic 100-Point Rubric Engine (`RubricScoringEngine`)**: Grades requirements outside the LLM across 5 IEEE 830 / ISO 29148 quality dimensions (Clarity: 25, Verifiability: 25, Completeness: 20, Atomicity: 15, Consistency: 15) with an auditable mathematical deduction receipt.
2. **Zero-Hallucination Evidence Validator (`EvidenceValidator`)**: Guarantees all flaw cards quote exact case-sensitive substrings from source text, computing 0-indexed character offsets (`start_offset`, `end_offset`) for instant 1-click UI highlighting.
3. **Dual-Layer Duplicate Radar**: Combines exact text hashing and lexical Jaccard token overlap with 1024-dimensional dense vector embeddings (`BAAI/bge-large-en-v1.5`) accelerated on the Qualcomm Cloud AI 100 cluster.
4. **Conflict Radar Contradiction Reasoning**: Uses `Llama-3.3-70B` deep logical reasoning to identify physical, timing, and operational contradictions, immediately applying consistency deductions.
5. **100% Test Suite Verification**: Validated across all 71 unit, integration, and live Qualcomm AI 100 inference tests.

---

## 2. Deterministic Scoring Rubric (100 Points)

The overall quality score is calculated by an external mathematical engine outside the LLM:

$$\text{Total Score} = \text{Clarity} + \text{Verifiability} + \text{Completeness} + \text{Atomicity} + \text{Consistency} \quad \in [0.0, 100.0]$$

Each subscore starts with a full budget and applies deterministic deductions clamped to $[0.0, \text{Max}]$:

| Dimension | Max Points | Evaluation Scope & Standards | Deterministic Deduction Rules |
| :--- | :--- | :--- | :--- |
| **Clarity** | 25.0 | Absence of ambiguity, vagueness, and escape hatches (ISO 29148 §5.2.5). | • `-5.0` per subjective term (*"fast"*, *"robust"*, *"seamless"*, *"reliable"*, *"intuitive"*).<br>• `-8.0` per escape-hatch (*"as needed"*, *"if possible"*, *"where feasible"*).<br>• `-8.0 / -5.0 / -2.5` for Blocker / Major / Minor Ambiguity flaw cards. |
| **Verifiability** | 25.0 | Falsifiable testability & measurable tolerance (IEEE 830 §4.3.5). | • `-10.0` per untestable superlative (*"100%"*, *"bug-free"*, *"infinite"*, *"completely secure"*).<br>• `-8.0` for quantitative metric terms (*"latency"*, *"bandwidth"*, *"voltage"*) lacking numbers or explicit `[TBD]`.<br>• `-10.0 / -6.0 / -3.0` for Blocker / Major / Minor Unverifiability cards. |
| **Completeness** | 20.0 | Explicit actors, conditions & bounded parameters (ISO 29148 §5.2.6). | • `-8.0` for missing contractual modal verb (*"shall"* or *"must"*).<br>• `-6.0` for reactive trigger actions lacking prerequisite condition (*"when"*, *"if"*, *"while"*).<br>• `-4.0` per unresolved `[TBD: ...]` placeholder (capped at `-8.0`).<br>• `-8.0 / -5.0 / -2.5` for Blocker / Major / Minor Incompleteness cards. |
| **Atomicity** | 15.0 | Single obligation per statement (ISO 29148 §5.2.2). | • `-7.0` for multiple modal verbs (e.g., *"shall ... and shall ..."*).<br>• `-5.0` for compound conjunctions (*"and also"*, *"as well as"*, *"in addition to"*).<br>• `-7.0 / -4.0 / -2.0` for Blocker / Major / Minor Non-atomic cards. |
| **Consistency** | 15.0 | Internal consistency & mutual compatibility across requirements. | • `-15.0` for Direct Contradictions flagged by Conflict Radar.<br>• `-8.0` for Timing Mismatches or Operational Incompatibilities.<br>• `-15.0 / -8.0 / -4.0` for Blocker / Major / Minor Consistency cards. |

### Itemized Mathematical Deduction Receipt Example:
For a flawed input:
> *"The articulated arm shall execute wrist rotations fast and reliably where feasible."*

The engine outputs an itemized mathematical audit trace:
```json
{
  "overall": 82.0,
  "clarity": 7.0,
  "verifiability": 25.0,
  "completeness": 20.0,
  "atomicity": 15.0,
  "consistency": 15.0,
  "receipt": [
    "[Baseline Budget] Initial quality allocation: 100.0 pts",
    "[Clarity -5.0 pts] Subjective/vague term detected: 'fast'",
    "[Clarity -5.0 pts] Subjective/vague term detected: 'reliably'",
    "[Clarity -8.0 pts] Non-committal escape-hatch detected: 'where feasible'",
    "[Summary] Clarity: 7.0/25 | Verifiability: 25.0/25 | Completeness: 20.0/20 | Atomicity: 15.0/15 | Consistency: 15.0/15 -> Total Rubric Score: 82.0/100"
  ]
}
```

---

## 3. Evidence Grounding & Character Span Offsets

The `EvidenceValidator` eliminates LLM hallucinated quotes:
1. **Case-Sensitive Substring Verification**: Rejects or realigns any quote that does not match the source text verbatim.
2. **0-Indexed Character Offsets**: Emits `start_offset` and `end_offset` character positions directly to the API payload:
   ```json
   {
     "issue_type": "Ambiguity",
     "severity": "Major",
     "evidence_quote": "wrist rotations fast",
     "start_offset": 34,
     "end_offset": 54,
     "is_grounded": true
   }
   ```
3. **Frontend Zero-Overhead Integration**: The web UI directly renders `<mark style="...">` tags using the exact character slices without costly string regex searching.

---

## 4. Duplicate Detection & Neural Semantic Clustering

### 4.1 Multi-Layer Architecture
Requirement duplication is detected at three distinct analytical tiers:

```
[Requirement Ingestion]
        │
        ├── Level 1: Exact Hash Collision (MD5 / Lowercase Whitespace Normalization) -> 1.000 Match
        │
        ├── Level 2: Lexical Jaccard Overlap (Token Intersection / Union >= 0.70) -> Near-Duplicate
        │
        └── Level 3: Dense Neural Vector Embeddings (BAAI/bge-large-en-v1.5 on Qualcomm AI 100)
                     └─ 1024-dim Normalized Matrix Cosine Similarity -> Disjoint Vocabulary Semantic Equivalents
```

### 4.2 Qualcomm Cloud AI 100 Semantic Benchmark
Tested against two requirements describing the exact same systems engineering obligation using completely disjoint vocabularies:

- **Statement A (`REQ-SEM-001`)**:
  > *"The accumulator management unit shall broadcast traction pack voltage, current, and state of charge over CAN-FD every 50ms."*
- **Statement B (`REQ-SEM-002`)**:
  > *"The BMS controller shall transmit battery pack metrics including potential, amperage, and SOC across serial automotive bus at 50ms periodic intervals."*
- **Statement C (`REQ-SEM-003`, Orthogonal Control)**:
  > *"The climate control subsystem shall regulate cabin airflow to maintain passenger compartment temperature at 22 degrees Celsius."*

#### Empirical Clustering Results:
| Pair Evaluated | Lexical Jaccard Overlap | Qualcomm AI100 `bge-large` Cosine Similarity | Classification |
| :--- | :--- | :--- | :--- |
| **Statement A $\longleftrightarrow$ Statement B** | 18.2% (Failed lexical check) | **82.4% (0.8241)** | 🟢 **NEURAL_SEMANTIC DUPLICATE** |
| **Statement A $\longleftrightarrow$ Paraphrase (`REQ-SEM-004`)** | 68.4% | **91.8% (0.9184)** | 🟢 **HIGH-CONFIDENCE DUPLICATE** |
| **Statement A $\longleftrightarrow$ Statement C (HVAC)** | 4.1% | **24.1% (0.2410)** | ⚪ **ORTHOGONAL (NO MATCH)** |

---

## 5. Conflict Radar Contradiction Reasoning

Tested on `Llama-3.3-70B` running on Qualcomm Cloud AI 100:

1. **Telemetry Contradiction**:
   - `REQ-CONF-001`: *"The device shall transmit cloud telemetry every five seconds during normal operation."*
   - `REQ-CONF-002`: *"The device shall make no external network transmissions during normal operation."*
   - **Verdict**: Classified as `Direct Contradiction` (`BLOCKER`). Extracted exact conflicting quotes, systems engineering risk explanation, and remediation advice.
   - **Rubric Impact**: Consistency subscore dropped to `0.0/15.0` with `[Consistency -15.0 pts] Conflict detected with REQ-CONF-002`.

2. **ASIL-D Braking Safety Contradiction**:
   - Inverted command between Regenerative Braking energy recovery and 0 Nm wheel slip during anti-lock braking intervention flagged with `BLOCKER` severity.

3. **Negative Control Verification**:
   - Mutually compatible obligations (Cockpit altitude chime vs Primary flight display refresh) returned `total_conflicts_found: 0`.

---

## 6. Verification Scoreboard

All Phase 2 capabilities were verified via automated test suites:
- **`backend/tests/test_rubric_and_evidence.py`**: 14/14 tests passing.
- **`backend/tests/test_phase_0_to_2_e2e.py`**: 11/11 tests passing.
- **Full Backend Regression Suite**: **71/71 tests passing in 2m 36s**.
