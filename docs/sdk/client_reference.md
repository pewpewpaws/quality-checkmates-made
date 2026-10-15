# Imagine SDK Client Reference

Technical reference for `ImagineClient` and `ImagineAsyncClient`.

---

## 1. Client Initialization

```python
from imagine import ImagineClient, ImagineAsyncClient

# Synchronous Client
client = ImagineClient(
    api_key="...",          # Optional if IMAGINE_API_KEY is set
    endpoint="...",         # Optional if IMAGINE_ENDPOINT_URL is set
    timeout=60.0,           # Recommended: 60s for complex reasoning
    max_retries=2,          # Automatic retry on transient errors
    debug=False             # Enable verbose logging
)

# Asynchronous Client (FastAPI)
async_client = ImagineAsyncClient(
    api_key="...",
    endpoint="...",
    timeout=60.0,
    max_retries=2
)
```

---

## 2. Core Methods

### `chat(messages, model, tools, ...)`
Executes chat completion.

```python
response = client.chat(
    messages=[
        {"role": "user", "content": "Analyze REQ-001"}
    ],
    model="Llama-3.3-70B",      # Default: Llama-3.1-8B
    temperature=0.1,
    max_tokens=512,
    top_p=0.9,
    tools=None                  # Optional function definitions
)

print(response.first_content)
print(response.usage.total_tokens)
```

### `chat_stream(messages, ...)`
Yields streaming response chunks.

```python
for chunk in client.chat_stream(
    messages=[{"role": "user", "content": "Draft test steps."}],
    model="Llama-3.1-8B"
):
    if chunk.first_content:
        print(chunk.first_content, end="", flush=True)
```

### `embeddings(texts, model)`
Generates dense vector embeddings.

```python
# texts can be a string or list of strings
response = client.embeddings(
    texts=["The system shall log errors.", "Log all system failures."],
    model="BAAI/bge-large-en-v1.5"   # 1024-dim
)

vector = response.data[0].embedding
```

### `reranker(query, documents, model, top_n)`
Reranks documents against a query.

```python
response = client.reranker(
    query="battery longevity",
    documents=["REQ-001: Battery lasts 24h.", "REQ-002: Wireless telemetry."],
    model="BAAI/bge-reranker-base",
    top_n=1
)
print(response.data[0].document)
```

### `get_available_models_by_type()`
Fetches active model catalog on the hardware cluster.

```python
models = client.get_available_models_by_type()
# {'llm': [...], 'embedding': [...], 'text_to_image': [...]}
```

---

## 3. Data Transfer Objects (DTOs)

| Class | Key Attributes | Notes |
| :--- | :--- | :--- |
| `ChatMessage` | `role`, `content`, `tool_calls`, `tool_call_id` | Input message object |
| `ChatCompletionResponse` | `choices`, `id`, `model`, `usage`, `first_content` | Return object from `chat()` |
| `Choice` | `message`, `finish_reason`, `index` | Choice container |
| `EmbeddingResponse` | `data` (list of `Embedding`), `model`, `usage` | Return object from `embeddings()` |
| `RerankerResponse` | `data` (list of `Reranker`), `model` | Return object from `reranker()` |

---

## 4. Exceptions

All SDK exceptions inherit from `imagine.exceptions.ImagineException`:

* `AuthenticationError`: Invalid API key or bearer token.
* `RateLimitError`: Quota or concurrency limit exceeded.
* `NotFoundError`: Specified model does not exist on cluster.
* `ImagineException`: Catch-all for network or server errors.
