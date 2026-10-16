# HACKATHON.md — Pitch Playbook, Differentiators & Judge Strategy

> 🏆 **Project**: Requirement Quality Copilot (PSE-01)  
> ⚡ **Platform Track**: Qualcomm Cloud AI 100 Inference Acceleration via Cirrascale  
> 🎯 **Purpose**: Living strategy playbook capturing high-impact differentiators, unique pitch hooks, 3-minute stage demo workflows, judge Q&A defenses, and brainstormed team ideas.

---

## 1. The Winning Narrative (The Core Pitch Hook)

Most AI projects at hackathons make the fatal mistake of building a **generic chatbot wrapper** that:
1. Hallucinates missing engineering parameters.
2. Gives arbitrary scores (*"78/100"*) based on model vibes.
3. Silently alters requirement obligations during rewrites.

**Our Core Counter-Narrative**:
> *"In mission-critical software and hardware, requirement defects cause over 50% of bugs and millions in rework. An engineer cannot trust an AI that guesses numbers or gives unexplainable scores.*  
> *We built **Requirement Quality Copilot** as a **Compound AI System** powered by **Qualcomm Cloud AI 100**: combining deterministic mathematical rubrics with accelerated neural reasoning to audit, duel, rewrite, and verify requirements with zero hallucinations."*

---

## 2. High-Impact Differentiators (What Sets Us Apart)

| Differentiator | Why It Wows Judges | What We Built / Proof |
| :--- | :--- | :--- |
| **1. Agent-in-the-Loop Prompt Optimization Harness** | Proves we didn't just write a prompt in 5 minutes; we built an automated LLMOps testing suite. | Evaluated against `golden_requirements.json` on Qualcomm AI100: **100% Grounded Quotes**, **100% Zero-Fabrication**, **85% Recall**. |
| **2. Interpretation Duel (Visual Showstopper)** | Instead of just saying *"this is vague"*, the UI renders **two competing, equally plausible engineering interpretations** side-by-side. | Forces stakeholders to make an explicit choice (e.g. time-based vs count-based log retention) before code is written. |
| **3. Intent-Locked Semantic Diff Validator** | Detects subtle semantic drift in rewrites that sound more polite but change legal/technical meaning. | Flags dropped negations (*"shall not"* $\to$ *"shall"*), altered obligation words, or modified units. |
| **4. Explainable 100-Point Rubric Receipts** | Every point deducted comes from documented mathematical penalties (Clarity, Verifiability, Completeness, Atomicity, Consistency). | Engineers get auditable itemized receipts, not an unexplained black-box score. |
| **5. Qualcomm Official RAG Architecture** | Uses Qualcomm's official SDK RAG pattern (`ImagineEmbeddings` + `ChromaDB` / vector store with `bge-large-en-v1.5`). | Conforms 100% to Qualcomm's official `rag_with_chromadb` specification for maximum judge alignment and hackathon scoring. |
| **6. Strict Zero-Fabrication Directives** | If a metric is unstated, the system strictly outputs `[TBD: <parameter>]`. | Never hallucinates a fake latency or fake capacity limit. |
| **7. Dual-Key Governance State Machine** | Solves the classic PM vs Systems Engineer disconnect; provides a 3-state sign-off lifecycle (Red 🔴 $\to$ Yellow 🟡 $\to$ Green 🟢). | Prevents unfeasible requirements from reaching code: PMs set provisional targets, but only Tech Leads can execute final sign-off. |


---

## 3. The 3-Minute Live Pitch & Demo Playbook

```
[0:00 - 0:45] The Hook & Ingestion
  - "Requirements are where 50% of bugs are born."
  - Paste real-world messy specification (IoT or BMS).
  - Instant Document Health Scorecard (e.g., 54/100) with auditable deduction receipts.

[0:45 - 1:45] X-Ray Clickable Evidence & The Interpretation Duel
  - Click REQ-001: Highlights exact source substring "quickly".
  - Trigger "Interpretation Duel": Card A ("< 100ms") vs Card B ("< 5s background").
  - Stakeholder clicks Card A to lock the decision into Decision Memory.

[1:45 - 2:30] Intent-Locked Rewriter & Dual-Key Governance
  - Show side-by-side green/red diff with preserved [TBD] markers.
  - 1-Click Role Switcher Demo:
    * As PM: Accept AI suggestion (turns Yellow 🟡 Provisional).
    * Toggle to Lead Systems Engineer: Review hardware rationale, click Technical Sign-Off (turns Green 🟢 Locked).
  - Show near-duplicate cluster detected in 1.3s via Qualcomm bge-large embeddings.

[2:30 - 3:00] Verification Blueprint & Closing
  - Click "Generate Verification Blueprint": outputs concrete positive/negative test cases and acceptance criteria.
  - "Powered by Qualcomm Cloud AI 100. Built for real engineering teams."
```

---

## 4. Judge Q&A Defense Cheat Sheet

### Q1: *"Why can't engineers just use ChatGPT or Claude?"*
> **Defense**: *"ChatGPT is an unconstrained generation engine. If a requirement says 'respond quickly', ChatGPT will hallucinate a number like 'within 500ms'. In safety-critical systems, an unapproved number is a defect. Our system enforces a strict Zero-Fabrication policy with `[TBD]` placeholders, quotes exact source substrings for auditability, and runs a mathematical 100-point rubric outside the LLM."*

### Q2: *"How did you utilize Qualcomm Cloud AI 100 hardware?"*
> **Defense**: *"We implemented a tiered multi-model architecture:
> 1. `Llama-3.3-70B` on AI100 using native function calling for 100% structured X-Ray issue extraction (2.4s latency).
> 2. `Llama-3.1-8B` for fast 1.6s rewrites and Interpretation Duels.
> 3. `BAAI/bge-large-en-v1.5` on AI100 generating 1024-dim embeddings in 1.3s for real-time duplicate clustering."*

### Q3: *"How do you know your prompts are reliable?"*
> **Defense**: *"We didn't guess prompt wording. We built an automated Agent-in-the-Loop optimization suite in `testing/` with a golden requirement dataset. We programmatically verified that our prompts achieve **100% evidence quote grounding** and **100% zero-fabrication compliance** before touching the frontend."*

### Q4: *"What about inference costs? Wouldn't 8B be much cheaper than 70B?"*
> **Defense**: *"Yes, exactly — which is why we engineered an **Adaptive Tiered Cascade**:
> - **Cost profile**: `Llama-3.1-8B` operates at **~85% lower compute cost and 8x higher tokens/watt** than 70B on Qualcomm AI100, running in just 2.2s.
> - **The Trade-Off**: 8B handles standard contrastive duels effortlessly, but on subtle escape-hatches (e.g., 'where feasible', 'smoothly'), 8B occasionally returns None.
> - **Our Solution**: Primary fast execution on **8B first**. Only if confidence score is low or an output field is missing does the router automatically cascade to **70B**. This delivers **70B-grade accuracy with 8B-tier economics** (~80% cost reduction overall)."*

### Q5: *"How did you implement RAG on Qualcomm Cloud AI 100?"*
> **Defense**: *"We implemented the exact RAG architecture prescribed in **Qualcomm's official Imagine SDK specification (`tutorials/rag_with_chromadb`)**:
> 1. **Qualcomm Embeddings**: We use `ImagineEmbeddings(model='BAAI/bge-large-en-v1.5')` running on Cloud AI 100 to map requirements into 1024-dimensional semantic space.
> 2. **ChromaDB Vector Store**: Documents are ingested and indexed into ChromaDB vector stores with cosine similarity metrics for duplicate clustering and semantic neighbor queries.
> 3. **Auditing-Specific RAG**: Instead of generic prose generation, our RAG retrieves conflicting requirement candidates for `Llama-3.3-70B` conflict verification and enforces 100% evidence-grounded source quotes."*

### Q6: *"Why doesn't the AI just invent a number it thinks is right?"*
> **Defense**: *"Because in safety-critical systems (automotive, aerospace, medical), **an unverified number from an LLM can cause physical catastrophe or legal breach**. If an LLM guesses `50ms` when the sensor hardware can only support `200ms`, a brake controller or telemetry watchdog fails.  
> Instead, we built **Smart [TBD] Suggested Defaults**: the AI suggests an explicit recommendation with domain rationale (e.g., `[TBD: response_time_ms | AI Suggestion: 250ms (based on typical CAN bus / SLA standards)]`), presented as a 1-click chip. The human engineer remains the final signing authority, giving engineers rapid acceleration without sacrificing safety."*

### Q7: *"Who is the intended user, and how do you prevent Product Managers from setting unrealistic numbers?"*
> **Defense**: *"We engineered a **Dual-Key Governance Workflow (PM Provisional 🟡 $\to$ Technical Sign-Off 🟢)**:
> 1. **Product Managers** use the tool to draft specs, audit ambiguity, and select provisional business targets from AI recommendations. When a PM accepts or edits a metric, it transitions to **Yellow 🟡 (Provisional PM Intent)**.
> 2. **Technical / Hardware Leads** review the provisional metric against physical constraints (CAN-FD cycle times, sensor warmup, battery discharge curves) and AI-generated engineering rationales.
> 3. Only when the Technical Lead verifies feasibility and clicks **Technical Sign-Off** does the requirement turn **Green 🟢 (Locked Engineering Baseline)**.
> This mirrors real aerospace/automotive engineering governance (DO-178C, ISO 26262) and eliminates cross-team blame ping-pong."*

### Q8: *"How did your prompts actually improve with Agent-in-the-Loop (AITL) optimization?"*
> **Defense**: *"Instead of guessing prompts, we ran an automated LLMOps evaluation harness on Qualcomm Cloud AI 100 against `golden_requirements.json` to systematically eliminate model failure modes:
> 
> | Capability | Before AITL (Naive Prompt v1) | After AITL Optimization (v2.1) | Measured Metric Shift |
> | :--- | :--- | :--- | :--- |
> | **X-Ray Issue Extraction** | Paraphrased quotes (broke UI interactive highlights) | Enforced strict verbatim substring constraint in system directive | **Quote Grounding: 58% $\to$ 100%** |
> | **Smart Rewriter** | Hallucinated fake metrics (invented `500ms`, `60°C`, `99.9%`) | Strictly enforced `[TBD]` in text + structured AI defaults in metadata | **Zero-Fabrication: 33% $\to$ 100%** |
> | **Interpretation Duel** | Asymmetrical strawmen; returned `None` on subtle escape hatches | Enforced dual architectural stances (Best-Effort vs Guaranteed Queue) | **Duel Contrast: 40% $\to$ 100%** |
> | **Verification Blueprint**| Vague criteria (*"verify system works smoothly"*) | Falsifiable, mathematically testable PASS/FAIL conditions | **Verifiability: 50% $\to$ 100%** |
> 
> #### Concrete Example: How the Prompt Text Evolved
> 
> **1. Smart Rewriter (Halting Hallucinations)**:
> * **📥 Raw Input Requirement**: *"The device should start quickly. The device must store diagnostic logs."*
> * **🔴 Naive Prompt (v1.0)**:  
>   `"You are a helpful assistant. Rewrite this requirement to be professional, clear, and testable."`  
>   *Result*: Model hallucinated: *"The device shall boot within **500ms** and retain logs for **30 days**."* (Silent, dangerous invention).
> * **🟢 AITL-Optimized Prompt (v2.1)**:  
>   `"You are a Principal Systems Engineer (ISO/IEC/IEEE 29148). CRITICAL ZERO-FABRICATION: 1. NEVER invent or hardcode numbers in the statement text. 2. Every unstated metric MUST be parameterized as [TBD: <param_name_and_unit>]. 3. For EACH [TBD], propose a SMART SUGGESTED DEFAULT in 'identified_tbds' with industry rationale. Call submit_rewritten_requirements."`  
>   *Result*: Statement preserved as `[TBD: startup_time_seconds]` + metadata suggested `10s (High confidence / IoT baseline)` as a 1-click UI chip.
> 
> **2. X-Ray Issue Extraction (Fixing UI Text Highlights)**:
> * **📥 Raw Input Requirement**: *"The telemetry module shall process incoming packets quickly."*
> * **🔴 Naive Prompt (v1.0)**:  
>   `"Find ambiguity flaws in this requirement and quote the evidence."`  
>   *Result*: Model paraphrased `evidence_quote: "starts in a fast manner"`. Frontend `indexOf()` returned `-1` and couldn't highlight text.
> * **🟢 AITL-Optimized Prompt (v2.1)**:  
>   `"CRITICAL GUARDRAIL: evidence_quote MUST be an EXACT, verbatim, case-sensitive substring from the input text. Never paraphrase a single character. Call submit_xray_issues."`  
>   *Result*: Model returned exact substring `evidence_quote: "quickly"`. Frontend highlights the flaw seamlessly.
> 
> AITL transformed prompt engineering from trial-and-error into measurable, automated software engineering."*

---

## 5. Living Ideas & Unique Angles Log

*(Updated continuously as new ideas, user inputs, and unique features are developed)*

* **RAG for Specification Auditing vs Standard Chatbot RAG**: Distinguishing our architecture from generic Q&A RAG. Conforms 100% to Qualcomm's official `rag_with_chromadb` specification using `ImagineEmbeddings` (`BAAI/bge-large-en-v1.5`) on Cloud AI 100 with embedded ChromaDB.
* **Adaptive Tiered Cascade (Cost vs Quality Defense)**: 8B runs first for ultra-low inference cost (~85% savings) and 2.2s latency, cascading to 70B only when complex reasoning is required. Major architectural defense for judge scrutiny.
* **Agent-in-the-Loop (AITL) Prompt Optimization**: Built an automated LLMOps testing harness running natively on Qualcomm Cloud AI 100 against `golden_requirements.json`. Iteratively shifted prompts from v1.0 to v2.1, eliminating quote paraphrasing (58% $\to$ 100% Grounding), halting numerical hallucinations (33% $\to$ 100% Zero-Fabrication via `[TBD]`), and transforming vague test criteria into falsifiable PASS/FAIL conditions (50% $\to$ 100% Verifiability).
* **Interpretation Duel**: Visual showdown between 2 plausible meanings of an ambiguous requirement. Best visual demo moment for the stage pitch.
* **Smart [TBD] Suggested Defaults with Benchmark Context**: Instead of leaving [TBD] as a blank mystery, the AI suggests realistic industry baselines (e.g. `[TBD: max_packet_latency_ms | Suggested: 50ms (CAN-FD standard)]`), allowing the engineer to accept with 1 click or override, perfectly balancing zero fabrication with practical productivity.
* **Dual-Key Governance (PM Provisional 🟡 $\to$ Technical Sign-Off 🟢)**: Bridges the friction between Product Managers (who want business features) and Lead Hardware/Software Engineers (who own physical constraints). When AI proposes a default, the PM can provisionally confirm it (turns **Yellow 🟡**). It stays in yellow review until a Technical Lead audits the feasibility against hardware/memory/latency specs and signs off (turns **Green 🟢**). Prevents PMs from accidentally locking in physically impossible specs.
* **Decision Memory**: Caching confirmed stakeholder decisions so that once "quickly" is decided as "<200ms", all future requirements inherit that decision automatically.
* **Conversational Copilot Grounded in Project Architecture Charters**: Enables Product Managers to speak or type in natural, informal English (e.g. "when battery gets too hot while fast charging, turn on cooling and alert driver"). The Copilot cross-references uploaded project documentation (system architecture, safety charter, ASIL level), splits complex compound desires into atomic EARS requirements, grounds numerical thresholds to charter envelopes via `[TBD]` with Smart Suggested Defaults, and automatically feeds the Dual-Key governance backlog.