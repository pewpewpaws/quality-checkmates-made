# Live Hardware Benchmarks (Qualcomm Cloud AI 100)

Empirical testing data collected on the active Cirrascale AI100 cluster (`aisuite.cirrascale.com`).

---

## 1. Summary of Model Test Results

| Model Candidate | Category | Measured Latency | Measured Throughput | Status | Primary Decision |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`Llama-3.3-70B`** | LLM | **2.40s** | **31.3 tok/s** | Active | **SELECTED**: High precision, 100% tool-calling schema adherence. |
| **`Llama-3.1-8B`** | LLM | **1.64s** | **62.4 tok/s** | Active | **SELECTED**: Fast turnaround for rewrites and Interpretation Duels. |
| **`BAAI/bge-large-en-v1.5`** | Embedding | **1.33s** (batch 4) | 1024 dims | Active | **SELECTED**: High semantic discrimination (0.843 vs 0.582). |
| **`DeepSeek-R1-Distill-70B`** | Reasoning LLM | **19.76s** | 19.2 tok/s | Active | **REJECTED**: 8.2× slower; `<think>` tags corrupt JSON parser. |
| **`Qwen-QwQ-32B`** | LLM | 0.31s (crash) | — | Error 500 | **REJECTED**: Internal Server Error on Cirrascale runtime. |
| **`Llama-3.1-70B`** | LLM | — | — | Error 429 | **REJECTED**: Invalid model; superseded by `Llama-3.3-70B`. |

---

## 2. Embedding Discrimination Accuracy Test

Tested with `BAAI/bge-large-en-v1.5`:

| Pair | Description | Cosine Similarity | Interpretation |
| :--- | :--- | :--- | :--- |
| **Statement 0 & 1** | Near-duplicate telemetry upload statement with identical period (5s) | **`0.8431`** | **High Confidence Duplicate** |
| **Statement 0 & 2** | Telemetry statement vs Battery operational load statement | **`0.5825`** | **Clean Separation (Distinct)** |
| **Statement 2 & 3** | Battery load vs Inactivity sleep mode | **`0.6894`** | **Related Topic, Different Behavior** |

*Conclusion*: Setting the duplicate threshold at `0.80` accurately captures near-duplicate paraphrases without false positives on distinct requirements.

---

## 3. Test Scripts

The test scripts used to produce these results are located in `docs/scripts/`:
* `docs/scripts/benchmark_qualcomm.py`: Full multi-model suite.
* `docs/scripts/test_active_llms.py`: Comparative LLM latency and throughput runner.
* `docs/scripts/test_qualcomm_api.py`: Connectivity and sanity test.
