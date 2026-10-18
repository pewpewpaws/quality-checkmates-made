# Qualcomm Imagine SDK (Python)

Official documentation for Qualcomm's Python SDK (`imagine-sdk` v0.4.2) for inference acceleration on **Qualcomm Cloud AI 100** hardware.

---

## 1. Installation via `uv`

The SDK is delivered as a pre-built wheel: `imagine_sdk-0.4.2-py3-none-any.whl`.

```bash
# 1. Download wheel (if not already downloaded)
curl -s -O "https://aisuite.cirrascale.com/sdk/_downloads/3433649516f5c32f3603ae6f98c65e48/imagine_sdk-0.4.2-py3-none-any.whl"

# 2. Create virtual environment with uv
uv venv
source .venv/bin/activate

# 3. Install wheel
uv pip install ./libs/imagine_sdk-0.4.2-py3-none-any.whl
```

### Optional Extras:
```bash
# With LangChain support:
uv pip install "./libs/imagine_sdk-0.4.2-py3-none-any.whl[langchain]"

# With CrewAI support:
uv pip install "./libs/imagine_sdk-0.4.2-py3-none-any.whl[crewai]"
```

---

## 2. Environment Variables & Authentication

The SDK automatically reads your credentials from standard environment variables:

```bash
export IMAGINE_API_KEY="278b88a2-8f68-42f7-818e-0442a7d294a3"
export IMAGINE_ENDPOINT_URL="https://aisuite.cirrascale.com/apis/v2"
```

Or pass them explicitly:
```python
from imagine import ImagineClient

client = ImagineClient(
    api_key="your-api-key",
    endpoint="https://aisuite.cirrascale.com/apis/v2"
)
```

---

## 3. SDK Guide Contents

* [client_reference.md](./client_reference.md): Full method signatures for `ImagineClient` (Sync) and `ImagineAsyncClient` (Async).
* [tool_calling.md](./tool_calling.md): OpenAI-compatible tool/function calling for structured JSON schemas.
* [langchain_integration.md](./langchain_integration.md): LangChain `ChatImagine` and `ImagineEmbeddings` bindings.
