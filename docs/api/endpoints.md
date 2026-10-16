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
* **Payload**: `{"text": "1. The BMS shall monitor cell voltage every 50ms...", "category": "Automotive"}`
* **Response**: Returns parsed atomic `RequirementStatement` objects with format detection (`numbered_list`, `req_tags`, etc.).

* **Method**: `POST`
* **Path**: `/api/parse/file`
* **Payload**: `multipart/form-data` with `file` (CSV, TXT, PDF).

## 3. Requirements & Dual-Key Governance
* **Method**: `GET /api/requirements`: List all requirements.
* **Method**: `POST /api/requirements`: Create requirement.
* **Method**: `GET /api/requirements/{id}`: Fetch single requirement.
* **Method**: `PUT /api/requirements/{id}`: Update requirement.
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
    Sets status to `🟡 PROVISIONAL_PM`.
  * **Payload (Systems Lead Stage)**:
    ```json
    {
      "action": "lock_baseline",
      "tech_lead_approver": "Bob Systems Lead",
      "hardware_rationale": "Matches CAN-FD 500kbps bus cycle allowance"
    }
    ```
    Sets status to `🟢 LOCKED_BASELINE`.

## 4. AI Quality Pipelines (Qualcomm Cloud AI 100)
* **Method**: `POST /api/analysis/xray`:
  * Detects flaws using `Llama-3.3-70B` tool calling (`submit_xray_issues`).
  * Returns exact grounded evidence quotes.
* **Method**: `POST /api/analysis/duel`:
  * Stages 2 competing plausible interpretations using `Llama-3.1-8B` (`submit_interpretation_duel`).
* **Method**: `POST /api/analysis/rewrite`:
  * Generates zero-fabrication EARS rewrites preserving `[TBD: ...]` tokens and smart suggested defaults (`submit_rewritten_requirements`).
* **Method**: `POST /api/analysis/blueprint`:
  * Generates audit-ready Verification Blueprint test cases and falsifiable PASS/FAIL acceptance criteria (`submit_verification_blueprint`).
