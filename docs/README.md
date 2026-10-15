# Documentation Index

Welcome to the **Requirement Quality Copilot (PSE-01)** technical documentation repository.

---

## 📁 Directory Structure

```
docs/
├── README.md                          <- You are here (Master Table of Contents)
│
├── api/                               <- Qualcomm Imagine REST API Reference
│   ├── README.md                      <- API Overview, Base URLs & Authentication
│   ├── endpoints.md                   <- Chat, Embeddings, Reranker, Models, Ping
│   └── openapi.json                   <- Formatted OpenAPI 3.1.0 Specification
│
├── sdk/                               <- Official Imagine Python SDK (v0.4.2)
│   ├── README.md                      <- Getting Started & `uv` Installation
│   ├── client_reference.md            <- ImagineClient & ImagineAsyncClient Signatures
│   ├── tool_calling.md                <- Tool & Function Calling for JSON Schemas
│   └── langchain_integration.md       <- ChatImagine & ImagineEmbeddings
│
├── models/                            <- Model Evaluation & Hardware Benchmarks
│   ├── benchmark_results.md           <- Live Qualcomm AI 100 Latency & Throughput Data
│   └── selection_justification.md     <- Selection & Rejection Rationale
│
├── findings/                          <- Empirical Research & Validation Reports
│   └── phase_0_5_research_findings.md <- Empirical Findings, Stress Tests & RAG Verification
│
├── prompts/                           <- Hardened Production Prompts
│   └── optimized_prompts.json         <- Version-controlled System Prompts & Tool Calling Schemas
│
├── datasets/                          <- Golden Test & Demo Datasets
│   ├── golden_requirements.json       <- Curated Golden Test Cases with Ground-Truth Flaws
│   └── five_scenario_stress_results.json <- Multi-Domain Stress Test Data
│
└── project/                           <- Requirement Quality Copilot Blueprint
    ├── architecture.md                <- Compound AI System & 100-Point Rubric Formula
    └── specification.md               <- P0, P1, P2 Feature Breakdown
```



---

## ⚡ Quick Navigation

1. **Working with the REST API**: Start with [docs/api/README.md](./api/README.md) and [docs/api/endpoints.md](./api/endpoints.md).
2. **Working with the Python SDK (`uv`)**: Start with [docs/sdk/README.md](./sdk/README.md) and [docs/sdk/client_reference.md](./sdk/client_reference.md).
3. **Understanding Model Selection**: See [docs/models/selection_justification.md](./models/selection_justification.md).
4. **Project Architecture & Rubrics**: See [docs/project/architecture.md](./project/architecture.md) or the master guide [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md).
