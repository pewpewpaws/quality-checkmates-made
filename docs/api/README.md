# Qualcomm Imagine API Reference

> REST API documentation for inference running on **Qualcomm Cloud AI 100** hardware via Cirrascale (`aisuite.cirrascale.com`).

---

## 1. Connection & Endpoints

* **Base URL**: `https://aisuite.cirrascale.com/apis`
* **API Version**: `v2`
* **Full Prefix**: `https://aisuite.cirrascale.com/apis/v2`
* **Protocol**: HTTPS / REST (OpenAI-compatible request/response formats)
* **OpenAPI Spec**: [openapi.json](./openapi.json)

---

## 2. Authentication

All requests require a Bearer token in the `Authorization` header:

```http
Authorization: Bearer <IMAGINE_API_KEY>
Content-Type: application/json
```

In your environment:
```bash
export IMAGINE_API_KEY="278b88a2-8f68-42f7-818e-0442a7d294a3"
export IMAGINE_ENDPOINT_URL="https://aisuite.cirrascale.com/apis/v2"
```

---

## 3. Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/v2/ping` | Healthcheck. Returns `{"message": "pong", "status": "ok"}` on valid auth. |
| `GET` | `/v2/models` | List all models available for the authenticated user. |
| `POST` | `/v2/chat/completions` | Create chat completion (supports streaming, tools/function-calling). |
| `POST` | `/v2/chat/completions/{id}` | Continue an existing conversation by ID. |
| `GET` | `/v2/chat/completions` | Fetch chat history. |
| `POST` | `/v2/embeddings` | Compute dense vector representations for input strings. |
| `POST` | `/v2/reranker` | Score and rerank candidate documents against a query. |
| `POST` | `/v2/completions` | Legacy code and text prompt completion. |
| `POST` | `/v2/images/generations` | Text-to-image generation (`sdxl-turbo`). |
| `POST` | `/v2/transcribe` | Audio file transcription (`whisper-tiny`). |
| `POST` | `/v2/translate` | Text translation (`opus-mt`). |

Detailed schemas and request/response examples are in [endpoints.md](./endpoints.md).
