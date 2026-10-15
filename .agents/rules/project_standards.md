# Project Standards & Qualcomm AI 100 Engineering Directives

> **Operational rules for AI agents and developers working on the Requirement Quality Copilot (PSE-01).**

---

## 1. Environment & Execution Standards

- **Package & Environment Manager**: Strictly use `/home/anair/.local/bin/uv` (`uv venv`, `uv pip install`, `uv run ...`). Never invoke bare `pip` or system `python`.
- **Active Environment**: `.venv` using Python 3.11+.
- **Qualcomm SDK**: `imagine-sdk` (v0.4.2) installed locally via `imagine` module.
- **Inference Hardware**: Qualcomm Cloud AI 100 cluster via Cirrascale (`https://aisuite.cirrascale.com/apis/v2`).
- **Client Configuration**: `ImagineClient` and `ImagineAsyncClient` with `timeout=60.0` and `max_retries=3`.

---

## 2. Approved Model Roles & Routing

| Capability | Model | Protocol / Method |
| :--- | :--- | :--- |
| **X-Ray Issue Extraction** | `Llama-3.3-70B` | Tool / Function Calling (`submit_xray_issues`) |
| **Conflict Radar** | `Llama-3.3-70B` | Deep logical reasoning on retrieved candidates |
| **Smart Rewriter** | `Llama-3.3-70B` | Tool Calling (`submit_rewritten_requirements`) |
| **Interpretation Duel** | `Llama-3.1-8B` $\to$ `Llama-3.3-70B` | Fast-path on 8B (2.2s, 85% cheaper); cascade to 70B if ambiguity is unresolved |
| **Verification Blueprint** | `Llama-3.3-70B` | Tool Calling (`submit_verification_blueprint`) |
| **Duplicate Clustering & RAG** | `BAAI/bge-large-en-v1.5` | 1024-dim embeddings + embedded local `ChromaDB` |

*Note: Do NOT use `DeepSeek-R1-Distill-Llama-70B` (too slow at 20s) or `Qwen-QwQ-32B` (runtime 500 error).*

---

## 3. Critical Safety & Architecture Directives

### 1. Strict Zero-Fabrication Directive
- **Never invent, guess, or hardcode numerical values, durations, or limits directly inside requirement text**.
- Unstated or ambiguous metrics must strictly remain:
  `[TBD: <parameter_name_and_unit>]`
- **Smart Suggested Defaults**: In tool outputs and API responses, provide recommended values and industry rationales in metadata (`identified_tbds`) as 1-click selectable chips, but **never bake them into contractual requirement text without engineer approval**.

### 2. Dual-Key Governance Lifecycle
Requirements follow a strict 3-state governance model to bridge Product Managers and Technical Leads:
- **`🔴 FLAGGED_TBD`**: Unresolved ambiguity or unstated parameters.
- **`🟡 PROVISIONAL_PM`**: Product Manager accepted an AI recommendation or typed a business target; pending technical verification.
- **`🟢 LOCKED_BASELINE`**: Technical/Hardware Lead audited feasibility against hardware/memory/latency specs and signed off.
- Only `LOCKED_BASELINE` requirements may be promoted into verification blueprints or exported to DOORS/Jira.

### 3. Evidence-Grounded Quotes
- Flaw issue cards must quote **exact verbatim source substrings** (`evidence_quote`).
- Never paraphrase or alter characters; the frontend requires exact substrings for interactive text highlighting.

### 4. Deterministic Rubric Receipts
- Quality scores must be computed by a deterministic 100-point rubric outside the LLM (Clarity 25%, Verifiability 25%, Completeness 20%, Atomicity 15%, Consistency 15%).
- Every deduction must produce an itemized mathematical receipt.

### 5. Qualcomm Official RAG Architecture
- Vector embeddings and retrieval must strictly follow Qualcomm's official `rag_with_chromadb` specification using `ImagineEmbeddings` (`BAAI/bge-large-en-v1.5`) and local embedded `ChromaDB`.
- Clustering threshold: $\ge 0.98$ (Exact Duplicate), $0.82 - 0.97$ (Paraphrased Duplicate), $\le 0.70$ (Distinct).

### 6. Pitch-Ready Demo Resilience (< 3 min)
- The entire demo pipeline must execute in under 3 minutes.
- Build a cached mock fallback adapter in `backend/services/qualcomm_service.py` to protect the live presentation if stage connectivity fluctuates.
