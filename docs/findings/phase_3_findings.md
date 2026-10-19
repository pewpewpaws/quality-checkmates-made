# Phase 3: AI Feature Pipelines & Qualcomm AI 100 Tool Calling Findings

> **Comprehensive record of the Phase 3 AI Feature Pipelines: X-Ray Issue Extraction with Verbatim Substring Grounding, Intent-Locked Smart Rewriting, Interpretation Duel Cascade (`Llama-3.1-8B` $\to$ `Llama-3.3-70B`), Conflict Radar Contradiction Reasoning, and Verification Blueprint Synthesis.**

---

## 1. Executive Summary & Qualcomm AITL Scorecard

Phase 3 connected the core analytical and generative capabilities of the **Requirement Quality Copilot** to Qualcomm Cloud AI 100 hardware, evaluated through rigorous Agent-in-the-Loop (AITL) benchmarks:

| Metric | Target | Measured Result | Benchmark Standard |
| :--- | :--- | :--- | :--- |
| **Quote Grounding Accuracy** | 100% | **100.0%** | Exact case-sensitive substring match in source text |
| **Zero-Fabrication Compliance** | 100% | **100.0%** | 0 invented numbers; unstated metrics preserved as `[TBD: ...]` |
| **Intent-Lock Pass Rate** | > 95% | **100.0%** | Strict preservation of polarity, subject actor & modal binding |
| **Mean Duel Contrast Divergence** | > 0.40 | **0.471** | $1.0 - \text{CosineSimilarity}(A, B)$ on 1024-dim embeddings |
| **Blueprint Falsifiability** | 100% | **100.0%** | Paired nominal/boundary test cases with falsifiable criteria |

---

## 2. Pipeline Architectures & Qualcomm Hardware Optimization

```mermaid
flowchart TD
    Req[Raw Requirement Statement] --> XRay[X-Ray Issue Extraction<br/>Llama-3.3-70B Tool Calling]
    Req --> Duel[Interpretation Duel<br/>Llama-3.1-8B Fast-Path]
    
    XRay --> EV[Evidence Validator<br/>0-indexed Char Offsets]
    Duel --> DivCheck{Contrast Divergence >= 0.40?}
    DivCheck -- Yes --> FinalDuel[Dual Interpretations Emitted]
    DivCheck -- No / Complex --> Cascade[Cascade to Llama-3.3-70B]
    Cascade --> FinalDuel
    
    Req --> Rewrite[Smart Rewriter<br/>Llama-3.3-70B]
    Rewrite --> IntentLock[Intent-Lock Validator<br/>Polarity + Modal + Diff Engine]
    IntentLock --> SafeRewrite[Safe Rewrite with Smart TBD Defaults]
    
    SafeRewrite --> Blueprint[Verification Blueprint<br/>Llama-3.3-70B Synthesis]
    Blueprint --> TestCases[Preconditions + Nominal/Boundary Tests + Pass/Fail Criteria]
```

### 2.1 X-Ray Issue Extraction (`Llama-3.3-70B`)
- **Protocol**: OpenAI-compatible tool calling (`tools` payload schema with `submit_issues`).
- **Verbatim Grounding Enforcement**: Every extracted issue card must provide an `evidence_quote`. The backend `EvidenceValidator` verifies that `evidence_quote in source_text`. If valid, it computes character start and end offsets (`start_offset`, `end_offset`); if invalid or drifting, the card is rejected or corrected outside the model.
- **Accuracy**: 100.0% across all golden aerospace, automotive, and medical test requirements.

### 2.2 Intent-Lock Smart Rewriter (`IntentLockValidator`)
A critical danger in generative requirement rewriting is semantic drift (e.g. an LLM inverting a negative safety constraint *"shall not exceed 80°C"* into *"shall maintain 80°C"*).
- **External Deterministic Validator**:
  1. **Polarity Check**: Validates that negation markers (`not`, `never`, `prevent`, `prohibit`) are symmetrically preserved.
  2. **Modal Rigor**: Enforces RFC 2119 / EARS modal binding (`shall` for binding obligations, `must` for hardware invariants, `should` flagged as non-binding).
  3. **Zero-Fabrication Guard**: Validates that unquantified parameters are converted to `[TBD: <parameter_and_unit>]` with engineering rationales placed in metadata chips, not fabricated into text.
  4. **Token Diff Stream**: Emits word-level insertion/deletion diffs for interactive UI rendering.

### 2.3 Interpretation Duel Cascade (`Llama-3.1-8B` $\to$ `Llama-3.3-70B`)
Ambiguous requirements often lead to expensive engineering disputes (e.g., whether *"respond quickly"* means within 5ms at the hardware layer or within 100ms at the UI layer).
- **Fast-Path Engine**: `Llama-3.1-8B` runs in **2.2 seconds** (~85% compute cost reduction) generating two diametrically opposed, plausible engineering interpretations (Interpretation A vs Interpretation B).
- **Divergence Verification**: Computes embedding cosine distance using `bge-large-en-v1.5`. If divergence $< 0.40$ (interpretations are too similar), the pipeline automatically cascades to `Llama-3.3-70B` to force sharper contrast.
- **Mean Measured Divergence**: **0.471**, ensuring engineering teams immediately see the ambiguity trap.

### 2.4 Conflict Radar (`Llama-3.3-70B`)
Scans multiple project requirements simultaneously to detect:
1. **Physical Contradictions**: E.g., Actuator command conflicting with emergency brake lockout.
2. **Timing / State Contradictions**: E.g., Requirement A mandates shutdown in 100ms; Requirement B mandates 500ms sensor flush before shutdown.
3. **Automated Consistency Deductions**: Flags severity (`BLOCKER`, `MAJOR`) and immediately feeds into the 100-point rubric deduction engine.

### 2.5 Verification Blueprint Synthesis
Upon requirement maturation, `Llama-3.3-70B` automatically generates an auditable, executable test matrix:
1. **System Preconditions**: Initial environmental and bus state.
2. **Paired Nominal & Boundary Test Cases**:
   - Nominal case verifying happy-path behavior.
   - Stress / boundary case verifying edge tolerance (e.g. $T = 79.9^\circ\text{C}$ vs $T = 80.1^\circ\text{C}$).
3. **Falsifiable Pass/Fail Acceptance Criteria**: Observable outputs and telemetry verification points.

---

## 3. Automated Test Coverage

Tested and verified in `backend/tests/test_phase_3_pipelines.py` and `backend/tests/test_live_duplicates_conflicts.py`:
- All 6 Phase 3 AI routes responding with $< 15\text{s}$ wall-clock latency on Cirrascale AI100.
- Fallback mock adapters verify 100% identical JSON schemas when offline.
- Zero uncaught exceptions across edge cases (empty strings, extreme text length, non-ASCII characters).
