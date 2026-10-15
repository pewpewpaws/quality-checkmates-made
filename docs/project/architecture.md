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

The overall quality score is calculated by an external mathematical engine, not hallucinated by an LLM:

$$\text{Total Score} = \text{Clarity} + \text{Verifiability} + \text{Completeness} + \text{Atomicity} + \text{Consistency}$$

| Dimension | Max Points | What It Checks | Example Penalty |
| :--- | :--- | :--- | :--- |
| **Clarity** | 25 | Is the meaning sufficiently unambiguous? | `-10` for subjective adverbs (*"fast"*, *"robust"*) |
| **Verifiability** | 25 | Can an objective pass/fail test be defined? | `-15` for untestable claims (*"excellent usability"*) |
| **Completeness** | 20 | Are actors, triggers, conditions, and units present? | `-10` for missing boundary metrics or units |
| **Atomicity** | 15 | Does the requirement express a single obligation? | `-10` for compound sentences joining obligations |
| **Consistency** | 15 | Does it avoid contradicting related requirements? | `-15` for opposing behaviors flagged by Conflict Radar |

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
