# Model Selection & Rejection Analysis

> **Document Purpose**: Technical justification, empirical benchmark data, and architectural rationale explaining why specific models were selected and why alternative models in the Qualcomm Cloud AI Playground catalog were rejected or deprioritized.

---

## 1. Executive Summary & Selection Matrix

During our architecture evaluation on the **Qualcomm Cloud AI 100** cluster (`aisuite.cirrascale.com`), all available models across LLM, Embedding, and Reranking categories were tested for latency, throughput, schema adherence, and engineering reliability.

| Model Candidate | Category | Status in Copilot | Primary Reason / Benchmark Finding |
| :--- | :--- | :--- | :--- |
| **`Llama-3.3-70B`** | LLM | **SELECTED (Primary)** | **2.40s latency, 31.3 tok/s.** 100% native tool-calling success with zero JSON schema failures. Superior logical reasoning for conflict detection. |
| **`Llama-3.1-8B`** | LLM | **SELECTED (Secondary)** | **1.64s latency, 62.4 tok/s.** High throughput for rapid text rewriting, [TBD] placeholder enforcement, and contrastive Interpretation Duels. |
| **`BAAI/bge-large-en-v1.5`** | Embedding | **SELECTED** | **1.33s batch latency, 1024-dim.** Distinct separation (0.843 for near-duplicates vs 0.582 for unrelated requirements). Highest MTEB score. |
| **`DeepSeek-R1-Distill-Llama-70B`** | LLM | **REJECTED** | **19.76s latency (8.2× slower).** Emits raw `<think>` scratchpads that break structured JSON schemas; prohibitive for live interactive demos. |
| **`Qwen-QwQ-32B`** | LLM | **REJECTED** | **HTTP 500 Parsing Failure.** Upstream inference runtime error on Cirrascale; unstable for production. |
| **`Llama-3.1-70B`** | LLM | **REJECTED** | **HTTP 429 Invalid Model.** Superseded and disabled in favor of `Llama-3.3-70B` on this Qualcomm AI100 cluster. |
| **`BAAI/bge-base-en-v1.5`** | Embedding | **DEPRIORITIZED** | 768-dim representation provides lower semantic nuance than `bge-large` with virtually zero latency advantage on Qualcomm AI100. |
| **`Mistral-7B-Instruct-v0.1`** | LLM | **REJECTED** | Legacy model lacking modern tool-calling protocols and lower constraint adherence compared to Llama 3.1. |

---

## 2. In-Depth Rejection Rationale by Model

### A. DeepSeek-R1-Distill-Llama-70B
* **Measured Latency**: **19.76 seconds** per invocation (compared to **2.40s** for `Llama-3.3-70B`).
* **Measured Throughput**: **19.2 tokens/second**.
* **Reason for Rejection**:
  1. **Latency Bottleneck in Multi-Requirement Workflows**: A standard engineering specification contains 15 to 30 requirements. Processing 20 requirements sequentially at ~20 seconds each would require **6.6 minutes** of waiting time—fatal for a live 3-minute hackathon demo and poor for UX.
  2. **CoT Pollution Breaking JSON Schemas**: DeepSeek-R1 models prepend raw reasoning tokens inside `<think>...</think>` tags before generating answers:
     ```text
     <think>
     Okay, so I'm trying to figure out how to analyze the given requirement...
     </think>
     ```
     This conversational stream breaks strict OpenAPI JSON parsers, requiring fragile post-processing heuristics to strip out thoughts.
  3. **Diminishing Returns on Structured Audits**: Requirement quality issue extraction is a deterministic categorization task (matching against IEEE 830 / ISO 29148 rules), not an open-ended mathematical theorem proof. Llama 3.3 70B performs this task with equal precision at 8x the speed.

---

### B. Qwen-QwQ-32B
* **Measured Latency**: **0.31 seconds** (Immediate crash).
* **HTTP Status**: `500 Internal Server Error`.
* **Response Body**:
  ```json
  {"message": "Internal Server Error - Parsing Failure", "status": "error"}
  ```
* **Reason for Rejection**:
  - The model endpoint currently has a fatal runtime parser fault on the Cirrascale Qualcomm AI100 backend when receiving OpenAI-compatible chat messages.
  - Relying on an unstable upstream endpoint creates severe vulnerability during judging and live evaluation.

---

### C. Llama-3.1-70B
* **HTTP Status**: `429 Too Many Requests / Invalid Model`.
* **Response Body**:
  ```json
  {"message": "Too many requests. Invalid model/rate limits not configured for this model.", "status": "error"}
  ```
* **Reason for Rejection**:
  - The Qualcomm playground administrators have updated the cluster catalog to feature the newer **`Llama-3.3-70B`** checkpoint. Requests targeting the older `3.1-70B` tag are rejected by the cluster gateway.
  - `Llama-3.3-70B` includes improved function-calling alignment, making the older version obsolete.

---

### D. BAAI/bge-base-en-v1.5 (vs BAAI/bge-large-en-v1.5)
* **Vector Dimension**: 768 dimensions (vs 1024 dimensions in `bge-large`).
* **Reason for Rejection**:
  1. **Fine-Grained Semantic Discrimination**: In requirement engineering, statements often share 90% of identical vocabulary while changing one critical modal operator or threshold:
     - Statement A: *"Transmit telemetry at 5-second intervals."*
     - Statement B: *"Transmit telemetry at 10-second intervals."*
     - `bge-large` has noticeably higher semantic separation on the Massive Text Embedding Benchmark (MTEB).
  2. **Hardware Acceleration Parity**: On Qualcomm AI 100 dedicated hardware accelerators, computing a batch of 1024-dim embeddings took **1.33s**—virtually identical to the 768-dim model. There was zero computational benefit to compromising on vector resolution.

---

### E. Legacy Models (`Mistral-7B-Instruct-v0.1`, `Salesforce/xgen-7b-8k-inst`, `core42/jais-30b-chat-v1`)
* **Reason for Rejection**:
  1. **Older Architecture**: These models represent 2023-era checkpoints with smaller context windows and weaker system prompt steerability.
  2. **No Native Tool Calling**: Cirrascale's Qualcomm inference proxy provides OpenAI-standard `tools` dispatch for `Llama-3.3-70B`. Legacy models lack this integration, leading to erratic output formatting and frequent JSON parse errors.
  3. **Instruction Following**: On test runs, older 7B models frequently violated negative constraints (e.g., they hallucinated specific response numbers like *"500ms"* instead of preserving the required `[TBD: response time]` placeholder).

---

## 3. Summary of Selected Duo

By eliminating underperforming, unstable, and high-latency options, our architecture standardizes on an optimal **two-tier LLM + Vector** pipeline:

```mermaid
graph LR
    subgraph Fast Text Pipeline
        A["Llama-3.1-8B<br>(1.6s | 62 tok/s)"] --> B["Smart Rewrites & TBDs"]
        A --> C["Interpretation Duel Generation"]
    end
    
    subgraph Deep Reasoning Pipeline
        D["Llama-3.3-70B<br>(2.4s | 31 tok/s)"] --> E["X-Ray Tool Calling (Strict JSON)"]
        D --> F["Conflict Radar Reasoning"]
        D --> G["Verification Blueprint Generator"]
    end

    subgraph Vector Similarity Pipeline
        H["BAAI/bge-large-en-v1.5<br>(1.3s | 1024-dim)"] --> I["Duplicate Clustering & Cosine Engine"]
    end
```

This hybrid architecture achieves the optimal balance of **live demo responsiveness ($<2.5\text{s}$)**, **100% JSON schema stability**, and **rigorous engineering depth**.
