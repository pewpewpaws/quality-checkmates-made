# System Architecture & Technical Specifications

> Architectural design for the **Requirement Quality Copilot (PSE-01)**.

---

## 1. High-Level Architecture (Compound AI System)

The system rejects the "chatbot wrapper" pattern in favor of a **Compound AI Architecture** combining deterministic validation code with accelerated neural inference:

```
[User Document: PDF / CSV / TXT / Paste]
                   │
                   ▼
       [1. Document Parser & Normalizer]
       - Tokenize into distinct statements
       - Assign immutable IDs (REQ-001...)
       - Preserves source row/page references
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
[2. Vector Embeddings]    [3. X-Ray Intelligence]
- Qualcomm AI100          - Qualcomm AI100
- BAAI/bge-large-en-v1.5   - Llama-3.3-70B Tool Calling
- Batch 1024-dim vectors  - Exact evidence quote grounding
         │                   │
         ▼                   ▼
[4. Cosine Matrix Engine] [5. Deterministic Rubric Engine]
- O(N^2) fast clustering   - 100-pt mathematical rubric
- Identifies duplicates    - Auditable deduction receipts
         │                   │
         └─────────┬─────────┘
                   ▼
     [6. Interactive Engineering Studio]
     - Document & Requirement Scorecards
     - Evidence-Linked Issue Highlighting
     - Interpretation Duel (Plausible Meanings)
     - Smart Rewriter (Intent-Locked Diffs)
     - Verification Blueprint Generator
```

---

## 2. Deterministic Scoring Rubric (100 Points)

The overall quality score is calculated strictly by an external deterministic mathematical engine (`RubricScoringEngine`), **never hallucinated by an LLM**:

$$\text{Total Score} = \text{Clarity} + \text{Verifiability} + \text{Completeness} + \text{Atomicity} + \text{Consistency} \quad \in [0.0, 100.0]$$

Each subscore starts at full budget and applies deterministic deductions clamped to `[0.0, \text{Max}]`:

| Dimension | Max Points | What It Checks | Deterministic Deduction Rules |
| :--- | :--- | :--- | :--- |
| **Clarity** | 25.0 | Unambiguous meaning & absence of loopholes | • `-5.0` per subjective/vague term (*"fast"*, *"robust"*, *"seamless"*, *"intuitive"*).<br>• `-8.0` per non-committal escape-hatch (*"as needed"*, *"if possible"*, *"where feasible"*).<br>• `-8.0 / -5.0 / -2.5` for Blocker / Major / Minor Ambiguity flaw cards. |
| **Verifiability** | 25.0 | Falsifiable testability & quantitative tolerancing | • `-10.0` per untestable absolute/superlative (*"100%"*, *"bug-free"*, *"infinite"*, *"completely secure"*).<br>• `-8.0` for quantitative metric terms (*"latency"*, *"bandwidth"*, *"voltage"*) lacking numbers or explicit `[TBD]`.<br>• `-10.0 / -6.0 / -3.0` for Blocker / Major / Minor Unverifiability cards. |
| **Completeness** | 20.0 | Explicit system actors, triggers & operational envelope | • `-8.0` for missing contractual modal verb (*"shall"* or *"must"*).<br>• `-6.0` for reactive trigger actions (*"disconnect"*, *"shut down"*, *"alert"*) lacking prerequisite condition (*"when"*, *"if"*, *"while"*).<br>• `-4.0` per unresolved `[TBD: ...]` placeholder (capped at `-8.0`).<br>• `-8.0 / -5.0 / -2.5` for Blocker / Major / Minor Incompleteness cards. |
| **Atomicity** | 15.0 | Single obligation per statement | • `-7.0` for multiple modal verbs (e.g., *"shall ... and shall ..."*).<br>• `-5.0` for compound conjunctions (*"and also"*, *"as well as"*, *"in addition to"*).<br>• `-7.0 / -4.0 / -2.0` for Blocker / Major / Minor Non-atomic cards. |
| **Consistency** | 15.0 | Absence of internal or cross-requirement contradictions | • `-15.0` for Direct Contradictions flagged by Conflict Radar or consistency cards.<br>• `-8.0` for Timing Mismatches or Operational Incompatibilities.<br>• `-15.0 / -8.0 / -4.0` for Blocker / Major / Minor Consistency cards. |

### Evidence Grounding & Verbatim Receipts
1. **Evidence Validator**: Guarantees all flaw cards cite verbatim, case-sensitive substrings in the source text. Calculates 0-indexed character offsets (`start_offset`, `end_offset`) for 1-click UI highlighting.
2. **Itemized Audit Receipt**: Every evaluation outputs an itemized deduction trace:
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
       "[Clarity -5.0 pts] Subjective/vague term detected: 'robust'",
       "[Clarity -8.0 pts] Non-committal escape-hatch detected: 'where feasible'",
       "[Summary] Clarity: 7.0/25 | Verifiability: 25.0/25 | Completeness: 20.0/20 | Atomicity: 15.0/15 | Consistency: 15.0/15 -> Total Rubric Score: 82.0/100"
     ]
   }
   ```

---

## 3. High-Impact Differentiators & Phase 3 Pipelines

### A. Interpretation Duel & Adaptive Tiered Cascade
When a requirement is flagged as ambiguous, the copilot generates **two competing, equally plausible engineering interpretations**:
* E.g., *"Retain recent diagnostic logs."*
  * **Option A**: Retention by time window (previous 24 hours).
  * **Option B**: Retention by event count (latest 1,000 entries).
* **Tiered Cascade Protocol**:
  1. Fast-path runs on `Llama-3.1-8B` (~2.2s, 85% cheaper).
  2. Contrast divergence score is calculated: $\text{contrast\_score} = 1.0 - \text{sim}(A, B)$.
  3. If contrast is weak ($< 0.25$) or options are trivial strawmen, auto-cascades to `Llama-3.3-70B`.
* Forces engineers and product owners to resolve ambiguity before code is written.

### B. Intent-Locked Semantic Diff Validator
When an EARS rewrite is generated, the deterministic `IntentLockValidator` executes outside the LLM:
1. **Negation & Polarity Verification**: Prohibits silent inversion of obligations (`shall not` $\longleftrightarrow$ `shall`).
2. **Modal Verb Binding Strength**: Prevents demotion of mandatory obligations (`shall`/`must`) to non-binding suggestions (`should`/`may`).
3. **Actor / Subject Integrity**: Verifies subject noun phrases are not displaced or reassigned.
4. **Contractual Metric Safeguard**: Ensures explicit numbers/units from original text are either preserved or explicitly parameterized as `[TBD: <parameter_name_and_unit>]`.
5. **Token Diff Stream**: Generates an opcode-level token stream (`PRESERVED`, `ADDED`, `REMOVED`, `TBD_PARAMETERIZED`, `MODAL_UPGRADED`, `MODAL_DOWNGRADED`, `NEGATION_DRIFT`) for high-fidelity UI side-by-side review.
6. Rewrites cannot be accepted into `LOCKED_BASELINE` without explicit engineer sign-off.

### C. Verification Blueprint Generator
Approved requirements automatically produce deterministic, audit-ready test plans conforming to ISO 26262 and IEEE 829:
* **Method**: Classified into Test, Demonstration, Inspection, or Analysis.
* **Preconditions**: Machine state and bench instrumentation setups.
* **Paired Test Cases**: Nominal (positive path) and Boundary/Fault Injection (negative path).
* **Acceptance Criteria**: Mathematically falsifiable PASS/FAIL conditions referencing the requirement's obligations and any `[TBD]` parameterized limits.

