# Qualcomm Imagine API Endpoints Reference

Complete request and response specifications for all active inference endpoints on the Qualcomm AI100 cluster.

---

## 1. Healthcheck / Ping

Check server status and validate credentials.

* **Method**: `GET`
* **Path**: `/apis/v2/ping`
* **Headers**: `Authorization: Bearer <IMAGINE_API_KEY>`

### Example Request:
```bash
curl -X GET "https://aisuite.cirrascale.com/apis/v2/ping" \
     -H "Authorization: Bearer $IMAGINE_API_KEY"
```

### Example Response (200 OK):
```json
{
  "message": "pong",
  "status": "ok"
}
```

---

## 2. Models Catalog

Retrieve available models assigned to your account.

* **Method**: `GET`
* **Path**: `/apis/v2/models`
* **Query Parameters**: `model_type` (optional: `llm`, `embedding`, `text_to_image`)

### Example Response (200 OK):
```json
{
  "llm": [
    "DeepSeek-R1-Distill-Llama-70B",
    "Llama-3.1-8B",
    "Llama-3.3-70B",
    "Qwen-QwQ-32B"
  ],
  "embedding": [
    "BAAI/bge-base-en-v1.5",
    "BAAI/bge-large-en-v1.5"
  ],
  "text_to_image": [
    "stabilityai/sdxl-turbo"
  ]
}
```

---

## 3. Chat Completions

Generate text completions using LLMs with support for streaming, system instructions, and tool calling.

* **Method**: `POST`
* **Path**: `/apis/v2/chat/completions`

### Request Parameters:

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `model` | string | Yes | Model ID (e.g. `Llama-3.3-70B`, `Llama-3.1-8B`) |
| `messages` | array | Yes | Array of message objects (`role`: `system`/`user`/`assistant`/`tool`, `content`) |
| `stream` | boolean | No | Enable token streaming (default: `false`) |
| `temperature` | float | No | Sampling temperature (0.0 to 1.0, recommended: `0.1` for audits) |
| `max_tokens` | integer | No | Maximum generated tokens (default: `512` or `1024`) |
| `top_p` | float | No | Nucleus sampling probability mass (default: `0.9`) |
| `tools` | array | No | OpenAI-compatible function definitions |

### Example Request (Standard Chat):
```bash
curl -X POST "https://aisuite.cirrascale.com/apis/v2/chat/completions" \
     -H "Authorization: Bearer $IMAGINE_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "model": "Llama-3.3-70B",
       "messages": [
         {"role": "user", "content": "Analyze REQ-001: The device should start quickly."}
       ],
       "temperature": 0.1,
       "max_tokens": 300
     }'
```

### Example Response:
```json
{
  "id": "chat-cmp-7b9c4341-cc52-46fd-bbbe-c83c4e568512",
  "object": "chat.completion",
  "created": 1792058500.0,
  "model": "Llama-3.3-70B",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "The requirement 'The device should start quickly' contains high ambiguity. The term 'quickly' is a subjective adverb lacking measurable criteria..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 46,
    "completion_tokens": 182,
    "total_tokens": 228
  }
}
```

---

## 4. Chat with Tool Calling (Function Calling)

Enforces guaranteed structured output matching a predefined JSON schema on `Llama-3.3-70B`.

### Example Request with `tools`:
```bash
curl -X POST "https://aisuite.cirrascale.com/apis/v2/chat/completions" \
     -H "Authorization: Bearer $IMAGINE_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "model": "Llama-3.3-70B",
       "messages": [
         {"role": "user", "content": "Analyze: The device should start quickly. Call extract_requirement_issues."}
       ],
       "tools": [
         {
           "type": "function",
           "function": {
             "name": "extract_requirement_issues",
             "description": "Log detected quality issues for a requirement statement.",
             "parameters": {
               "type": "object",
               "properties": {
                 "issues": {
                   "type": "array",
                   "items": {
                     "type": "object",
                     "properties": {
                       "issue_type": {"type": "string"},
                       "quote": {"type": "string"},
                       "explanation": {"type": "string"}
                     },
                     "required": ["issue_type", "quote", "explanation"]
                   }
                 }
               },
               "required": ["issues"]
             }
           }
         }
       ],
       "max_tokens": 300
     }'
```

### Example Response with `tool_calls`:
```json
{
  "choices": [
    {
      "index": 0,
      "finish_reason": "tool_calls",
      "message": {
        "role": "assistant",
        "content": "",
        "tool_calls": [
          {
            "id": "c30c3057-e284-4257-bf82-7f258ababc81",
            "type": "function",
            "function": {
              "name": "extract_requirement_issues",
              "arguments": "{\"issues\":[{\"issue_type\":\"ambiguity\",\"quote\":\"quickly\",\"explanation\":\"The term 'quickly' is subjective and open to interpretation.\"}]}"
            }
          }
        ]
      }
    }
  ]
}
```

---

## 5. Embeddings

Batch vectorization of text statements for semantic similarity, clustering, and duplicate detection.

* **Method**: `POST`
* **Path**: `/apis/v2/embeddings`

### Example Request:
```bash
curl -X POST "https://aisuite.cirrascale.com/apis/v2/embeddings" \
     -H "Authorization: Bearer $IMAGINE_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "model": "BAAI/bge-large-en-v1.5",
       "input": [
         "The system shall upload telemetry every five seconds.",
         "Transmit telemetry at five-second intervals."
       ]
     }'
```

### Example Response:
```json
{
  "id": "emb-894723",
  "object": "list",
  "model": "BAAI/bge-large-en-v1.5",
  "data": [
    {
      "object": "embedding",
      "index": 0,
      "embedding": [0.0124, -0.0452, 0.0891, "...(1024 floats)"]
    },
    {
      "object": "embedding",
      "index": 1,
      "embedding": [0.0121, -0.0449, 0.0886, "...(1024 floats)"]
    }
  ],
  "usage": {
    "prompt_tokens": 22,
    "total_tokens": 22
  }
}
```

---

## 6. Reranker

Calculates cross-attention relevance scores between a query and candidate requirements.

* **Method**: `POST`
* **Path**: `/apis/v2/reranker`

### Example Request:
```bash
curl -X POST "https://aisuite.cirrascale.com/apis/v2/reranker" \
     -H "Authorization: Bearer $IMAGINE_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "model": "BAAI/bge-reranker-base",
       "query": "telemetry transmission during offline mode",
       "documents": [
         "REQ-004: The device shall transmit cloud telemetry during normal operation.",
         "REQ-009: The device shall make no external network transmissions in offline mode.",
         "REQ-015: The battery must last 24 hours."
       ],
       "return_documents": true,
       "top_n": 2
     }'
```

### Example Response:
```json
{
  "id": "rerank-0912",
  "model": "BAAI/bge-reranker-base",
  "data": [
    {
      "index": 1,
      "relevance_score": 0.892,
      "document": "REQ-009: The device shall make no external network transmissions in offline mode."
    },
    {
      "index": 0,
      "relevance_score": 0.741,
      "document": "REQ-004: The device shall transmit cloud telemetry during normal operation."
    }
  ]
}
```

---

# Requirement Quality Copilot (FastAPI) Backend Endpoints

REST API endpoints provided by the local FastAPI service (`http://localhost:8000`).

## 1. System Health & Qualcomm AI100 Ping
* **Method**: `GET`
* **Path**: `/health`
* **Response**:
```json
{
  "backend": "healthy",
  "qualcomm_ai100": {
    "status": "ok",
    "mode": "live",
    "message": "pong"
  },
  "active_requirements_count": 4
}
```

## 2. Ingestion & Document Parsing
* **Method**: `POST`
* **Path**: `/api/parse/text`
* **Headers**: `X-User-Role: product_manager | systems_engineer` (Executives rejected with 403)
* **Payload**: `{"text": "1. The BMS shall monitor cell voltage every 50ms...", "category": "Automotive", "project_id": "default_project"}`
* **Response**: Returns parsed atomic `RequirementStatement` objects with format detection (`numbered_list`, `req_tags`, etc.).

* **Method**: `POST`
* **Path**: `/api/parse/file`
* **Headers**: `X-User-Role: product_manager | systems_engineer`
* **Payload**: `multipart/form-data` with `file` (CSV, TXT, PDF), `category`, and `project_id`.

## 3. Multi-Project Workspaces & Context Management
* **Method**: `GET /api/projects`: List all project workspaces with aggregated sign-off counters and total requirements.
* **Method**: `POST /api/projects`: Create a new project workspace namespace (Isolated context and requirements).
  * **Payload**:
    ```json
    {
      "project_id": "proj-ev-bms",
      "project_name": "Next-Gen 800V EV Powertrain & BMS",
      "domain": "Automotive Systems (ISO 26262)",
      "description": "800V silicon-carbide traction inverter and battery management system."
    }
    ```
* **Method**: `GET /api/projects/{project_id}`: Retrieve workspace detail and attached architectural charter documents.
* **Method**: `PUT /api/projects/{project_id}`: Update project metadata. Fails with HTTP 423 if boundary is locked.
* **Method**: `DELETE /api/projects/{project_id}`: Delete workspace and all contained requirements and documents.
* **Method**: `POST /api/projects/{project_id}/lock`: Lock or unlock architecture boundary and charter.
  * **Payload**: `{"is_locked": true, "locked_by": "Chief Systems Architect"}`
  * When locked, documents and architecture metadata cannot be modified (HTTP 423 Locked).
* **Method**: `GET /api/projects/{project_id}/documents`: List all architectural charter documents.
* **Method**: `POST /api/projects/{project_id}/documents`: Add/upload charter document (multipart form or text). Fails if locked (423).
* **Method**: `DELETE /api/projects/{project_id}/documents/{doc_id}`: Delete charter document. Fails if locked (423).

## 4. Requirements & Dual-Key Governance (with 3-Tier Enterprise Persona RBAC)
* **Headers**: `X-User-Role: product_manager | systems_engineer | executive` (or query param `?role=...`).
* **Persona Filter Behavior**:
  * 👔 `product_manager`: Full authoring access across all states (`DRAFT`, `FLAGGED_TBD`, `PROVISIONAL_PM`, `LOCKED_BASELINE`). Can set provisional targets (`provisional_pm`). Cannot lock baseline (403).
  * 🛠️ `systems_engineer`: Full engineering inspection. Can grant technical sign-off (`lock_baseline`), flag TBD, or reject. Cannot author provisional targets (403).
  * 🎖️ `executive`: Strictly read-only (all mutations yield 403). Filtered visibility lens: only sees PM-Approved (`PROVISIONAL_PM` 🟡) or Signed-off (`LOCKED_BASELINE` 🟢) requirements; raw drafts and unresolved TBDs are shielded from view.
* **Method**: `GET /api/requirements?project_id={id}`: List requirements (filtered by persona).
* **Method**: `GET /api/requirements/duplicates?project_id={id}&threshold=0.70`: Detect exact (`1.0`) and lexical near-duplicate (`>= 0.70`) statements within a workspace.
* **Method**: `GET /api/requirements/duplicates/semantic?project_id={id}&threshold=0.85`: Neural semantic duplicate clustering using dense vector embeddings on Qualcomm AI 100 (`BAAI/bge-large-en-v1.5`).
* **Method**: `GET /api/requirements/conflicts?project_id={id}`: Project-wide Conflict Radar scanning all requirements for mutual contradictions using `Llama-3.3-70B`.
* **Method**: `POST /api/requirements`: Create requirement (Executives prohibited).
* **Method**: `GET /api/requirements/{id}?project_id={id}`: Fetch single requirement (403 if executive attempts to view unapproved draft/TBD).
* **Method**: `GET /api/requirements/{id}/score?project_id={id}`: Compute deterministic 100-point rubric score and itemized deduction receipt.
* **Method**: `POST /api/requirements/{id}/score?project_id={id}`: Recalculate and persist quality score.
* **Method**: `PUT /api/requirements/{id}`: Update requirement (increments version counter on collision).
* **Method**: `DELETE /api/requirements/{id}`: Delete requirement.
* **Method**: `POST /api/requirements/{id}/sign-off`: Dual-Key state transition.
  * **Payload (PM Stage)**:
    ```json
    {
      "action": "provisional_pm",
      "pm_author": "Alice PM",
      "pm_target_val": "250 ms"
    }
    ```
    Sets status to `🟡 PROVISIONAL_PM`. (Requires PM persona).
  * **Payload (Systems Lead Stage)**:
    ```json
    {
      "action": "lock_baseline",
      "tech_lead_approver": "Bob Systems Lead",
      "hardware_rationale": "Matches CAN-FD 500kbps bus cycle allowance"
    }
    ```
    Sets status to `🟢 LOCKED_BASELINE`. (Requires Systems Engineer persona).

## 5. AI Quality Pipelines (Qualcomm Cloud AI 100)
* **Method**: `POST /api/analysis/score`:
  * Evaluates text or stored requirement against deterministic 100-point rubric outside the LLM.
  * Itemized deduction receipts for Clarity (25), Verifiability (25), Completeness (20), Atomicity (15), Consistency (15).
* **Method**: `POST /api/analysis/xray`:
  * Detects flaws using `Llama-3.3-70B` tool calling (`submit_xray_issues`).
  * Returns exact grounded evidence quotes with 0-indexed character offsets (`start_offset`, `end_offset`).
  * Auto-computes initial rubric score.
* **Method**: `POST /api/analysis/duel`:
  * Stages 2 competing plausible interpretations using `Llama-3.1-8B` (`submit_interpretation_duel`).
  * Auto-calculates `contrast_score` (divergence); automatically cascades to `Llama-3.3-70B` if contrast is weak.
* **Method**: `POST /api/analysis/rewrite`:
  * Generates zero-fabrication EARS rewrites preserving `[TBD: ...]` tokens and smart suggested defaults (`submit_rewritten_requirements`).
  * Automatically invokes `IntentLockValidator` outside the LLM to verify semantic preservation.
  * Returns `intent_lock` audit report and token diff stream.
* **Method**: `POST /api/analysis/intent-lock`:
  * Direct deterministic Intent-Lock Semantic Diff Validator endpoint.
  * Audits polarity flips (prohibitions), modal strength demotions, actor shifts, and threshold drops.
  * Returns `IntentLockReport` with high-resolution token diff stream (`DiffToken` array for UI diff viewer).
* **Method**: `POST /api/analysis/blueprint`:
  * Generates audit-ready Verification Blueprint test cases and falsifiable PASS/FAIL acceptance criteria (`submit_verification_blueprint` on `Llama-3.3-70B`).
* **Method**: `POST /api/analysis/semantic-duplicates`:
  * Computes 1024-dimensional normalized vector embeddings on Qualcomm AI 100 (`BAAI/bge-large-en-v1.5`) and pairwise cosine similarity matrix.
  * Detects semantically equivalent requirements across different vocabularies.
* **Method**: `POST /api/analysis/conflicts`:
  * Conflict Radar powered by `Llama-3.3-70B` (`submit_conflict_analysis`).
  * Identifies `Direct Contradiction`, `Timing Mismatch`, `Resource Contention`, and `Operational Incompatibility` with verbatim quotes and reconciliation advice.

## 6. Conversational Requirement Copilot & Project Context
* **Method**: `GET /api/chat/context`:
  * Returns active project context (name, domain, architectural summary, and attached documents).
* **Method**: `POST /api/chat/context`:
  * Updates or creates project context. Frozen if boundary is locked (423).
* **Method**: `POST /api/chat/context/document`:
  * Multipart upload or raw text attachment of architectural charter documents (TXT, CSV, PDF). Frozen if boundary is locked (423).
* **Method**: `POST /api/chat/message`:
  * Conversational AI endpoint where Product Managers speak in informal, plain English.
  * Formulates formal, atomic EARS requirements strictly grounded in the project context with zero-fabrication `[TBD]` preservation and smart suggested defaults.
  * Automatically persists requirements to store if `save_to_store: true`.
  * **Payload**:
    ```json
    {
      "message": "When the battery gets too hot while fast charging, turn on coolant pump and alert the driver.",
      "project_id": "default_project",
      "save_to_store": true,
      "conversation_history": []
    }
    ```

## 7. Phase 2.5 Requirement Baseline Export Endpoints
* **Method**: `GET /api/requirements/export/csv`:
  * Exports all requirements within a project workspace as an RFC 4180 compliant CSV document.
  * Query parameters: `project_id` (string), `status` (optional `RequirementStatus`).
  * Response: `text/csv` with `Content-Disposition: attachment; filename="{project_id}_requirements.csv"`.
  * Headers: `Requirement ID`, `Project ID`, `Category`, `Section`, `Requirement Text`, `Status`, `Rubric Score`, `Clarity`, `Verifiability`, `Completeness`, `Atomicity`, `Consistency`, `PM Target Value`, `PM Author`, `Technical Approver`, `Hardware Rationale`, `Signed Off At`, `Version`, `Updated At`.
  * RBAC Filtering: `executive` role shields `DRAFT` and `FLAGGED_TBD` requirements.

* **Method**: `GET /api/requirements/export/pdf`:
  * Generates an engineering-grade, structured specification baseline PDF using `reportlab`.
  * Query parameters: `project_id` (string), `status` (optional `RequirementStatus`).
  * Response: `application/pdf` with `Content-Disposition: attachment; filename="{project_id}_specification.pdf"`.
  * Contains executive header banner, project workspace metadata, rubric scoring summary metrics, color-coded status badges (`🟢 LOCKED_BASELINE`, `🟡 PROVISIONAL_PM`, `🔴 FLAGGED_TBD`), and dual-key governance sign-off audit cards with PM and Lead Systems Engineer signatures.
  * RBAC Filtering: `executive` role shields `DRAFT` and `FLAGGED_TBD` requirements.

