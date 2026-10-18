# LangChain Integration Guide

The Qualcomm Imagine SDK includes built-in LangChain wrapper classes for chat models and embeddings.

---

## 1. Installation

Install the SDK with the LangChain extra:
```bash
uv pip install "./libs/imagine_sdk-0.4.2-py3-none-any.whl[langchain]"
```

---

## 2. Using `ChatImagine`

`ChatImagine` acts as a drop-in replacement for `ChatOpenAI`:

```python
from imagine.langchain import ChatImagine
from langchain_core.messages import SystemMessage, HumanMessage

chat_model = ChatImagine(
    model="Llama-3.3-70B",
    temperature=0.1,
    max_tokens=512
)

messages = [
    SystemMessage(content="You are a requirement analyzer."),
    HumanMessage(content="Explain verifiability in 2 sentences.")
]

response = chat_model.invoke(messages)
print(response.content)
```

---

## 3. Using `ImagineEmbeddings`

`ImagineEmbeddings` integrates directly with vector stores such as ChromaDB or FAISS:

```python
from imagine.langchain import ImagineEmbeddings

embeddings = ImagineEmbeddings(
    model="BAAI/bge-large-en-v1.5"
)

# Single query embedding
query_vector = embeddings.embed_query("telemetry upload interval")
print(f"Dimension: {len(query_vector)}")

# Document batch embedding
doc_vectors = embeddings.embed_documents([
    "REQ-001: Device transmits logs.",
    "REQ-002: Device operates on battery."
])
print(f"Embedded {len(doc_vectors)} documents.")
```
