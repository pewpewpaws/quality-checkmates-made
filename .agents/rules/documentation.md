# Documentation Standards & Continuous Sync Rules

> **Operational rule for AI agents: Keep all documentation and pitch artifacts strictly synchronized with code changes.**

---

## 1. Documentation-First Mandate

Whenever you implement a new module, endpoint, schema, or algorithm, **you MUST update the relevant documentation in `docs/` or `HACKATHON.md` in the exact same turn**. Code without documentation violates hackathon directives.

---

## 2. Documentation Mapping Guide

Always update the corresponding documentation files according to this mapping:

| Implementation Area | Documentation to Update |
| :--- | :--- |
| **REST Endpoints / API Payloads** | [`docs/api/endpoints.md`](file:///home/anair/Desktop/Coding/Oi-Thon/docs/api/endpoints.md) & [`docs/api/openapi.json`](file:///home/anair/Desktop/Coding/Oi-Thon/docs/api/openapi.json) |
| **SDK Usage / Client Wrappers** | [`docs/sdk/client_reference.md`](file:///home/anair/Desktop/Coding/Oi-Thon/docs/sdk/client_reference.md) & [`docs/sdk/tool_calling.md`](file:///home/anair/Desktop/Coding/Oi-Thon/docs/sdk/tool_calling.md) |
| **Rubric Scoring Math & Deductions** | [`docs/project/architecture.md`](file:///home/anair/Desktop/Coding/Oi-Thon/docs/project/architecture.md) |
| **Master System Vision & Workflows** | [`docs/PROJECT_DOCUMENTATION.md`](file:///home/anair/Desktop/Coding/Oi-Thon/docs/PROJECT_DOCUMENTATION.md) |
| **Model Configurations & Latencies** | [`docs/models/benchmark_results.md`](file:///home/anair/Desktop/Coding/Oi-Thon/docs/models/benchmark_results.md) & [`docs/findings/phase_0_5_research_findings.md`](file:///home/anair/Desktop/Coding/Oi-Thon/docs/findings/phase_0_5_research_findings.md) |
| **Prompt Templates & Schemas** | [`docs/prompts/optimized_prompts.json`](file:///home/anair/Desktop/Coding/Oi-Thon/docs/prompts/optimized_prompts.json) |
| **Golden Datasets & Fixtures** | [`docs/datasets/golden_requirements.json`](file:///home/anair/Desktop/Coding/Oi-Thon/docs/datasets/golden_requirements.json) |
| **Pitch Strategy, Q&A & New Ideas** | [`HACKATHON.md`](file:///home/anair/Desktop/Coding/Oi-Thon/HACKATHON.md) |
| **Milestones & Implementation Checklist** | [`AGENTS.md`](file:///home/anair/Desktop/Coding/Oi-Thon/AGENTS.md) |

---

## 3. Continuous HACKATHON.md Sync

Whenever the user shares unique ideas, architectural insights, pitch angles, demo suggestions, or answers to potential judge objections:
1. **Immediately log them in [`HACKATHON.md`](file:///home/anair/Desktop/Coding/Oi-Thon/HACKATHON.md)** under the appropriate section:
   - **Section 2**: High-Impact Differentiators
   - **Section 3**: Live Pitch Playbook
   - **Section 4**: Judge Q&A Defense Cheat Sheet
   - **Section 5**: Living Ideas & Unique Angles Log
2. Do not wait for a separate command; capture insights in the same turn they are discussed.

---

## 4. Documentation Formatting Guidelines
- Use clickable file links with markdown `file://` syntax (e.g. `[endpoints.md](file:///path/to/endpoints.md)`).
- Keep tables clean, structured, and easy to scan.
- Never write placeholder comments like "TODO" in documentation—state the current verified status.
