# PSE-01 Feature Specification & Priorities

Feature specifications extracted from `Requirement_Quality_Copilot_Feature_Guide.pdf`.

---

## 1. Feature Priority Breakdown

### P0 — Core MVP (Must-Have)
1. **Requirement Input & Parser**: Accept pasted text, CSV, TXT, and PDF. Split into `REQ-001...` records while preserving original text.
2. **Quality Score**: 100-point rubric breakdown by Clarity (25%), Verifiability (25%), Completeness (20%), Atomicity (15%), Consistency (15%).
3. **Requirement X-Ray**: Exact substring quotes for Ambiguity, Unverifiability, Incompleteness, Non-atomic obligations, and Placeholders.
4. **Duplicate Detection Engine**: Vector embeddings (`bge-large`) + cosine similarity matrix clustering.
5. **Conflict Radar**: Identify opposing behaviors and incompatible constraints with dual requirement quotes.
6. **Smart Rewriter**: Clarity / Testability modes with mandatory `[TBD: ...]` placeholder preservation.

### P1 — High-Impact Differentiators
7. **Interpretation Duel**: Side-by-side presentation of two competing plausible meanings for vague sentences.
8. **Clarification Cards**: Guided interactive Q&A for unstated thresholds and boundary metrics.
9. **Intent-Locked Rewrite**: Semantic drift detector for changed negations, units, or obligation strength.
10. **Verification Blueprint Generator**: Draft verification plans (preconditions, test cases, acceptance criteria).

### P2 — Usability & Lifecycle
11. **Requirement Lifecycle Tracker**: State machine (`New` $\to$ `Needs Clarification` $\to$ `Under Review` $\to$ `Ready for Approval` $\to$ `Approved` $\to$ `Verification Planned`).
12. **Executive Summary**: Document health metrics, blocker counts, and duplicate groups.
13. **Export**: Export requirements, scores, and verification plans to JSON or CSV.
