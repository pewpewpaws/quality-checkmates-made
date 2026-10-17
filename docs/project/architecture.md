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

## 3. High-Impact Differentiators

### A. Interpretation Duel
When a requirement is flagged as ambiguous, the copilot generates **two competing, equally plausible engineering interpretations**:
* E.g., *"Retain recent diagnostic logs."*
  * **Option A**: Retention by time window (previous 24 hours).
  * **Option B**: Retention by event count (latest 1,000 entries).
* Forces engineers and product owners to resolve ambiguity before code is written.

### B. Intent-Locked Change Validation
When a rewrite is proposed:
1. Regex and token diffing parses actors, actions, conditions, numerical thresholds, and modal verbs (*"shall"* vs *"should"*).
2. If numbers, units, or negations are silently dropped or altered, a **CRITICAL: Semantic Drift Warning** is displayed.
3. Rewrites cannot be accepted without explicit engineer sign-off.

### C. Verification Blueprint Generator
Approved requirements automatically produce draft test cases:
* Method: Test, Analysis, Inspection, or Demonstration.
* Preconditions & setup steps.
* Test cases: Positive path, Negative path, and Boundary condition.
* Pass/Fail acceptance criteria.
