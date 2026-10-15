# Tool Calling & Structured Extraction Guide

How to use the Imagine SDK to guarantee structured, validated JSON output from `Llama-3.3-70B`.

---

## 1. Why Tool Calling?

Rather than prompting the LLM with *"Output raw JSON"* (which can fail if the model adds markdown ticks, preamble text, or unescaped quotes), **Tool Calling** (Function Calling) forces the model to serialize its response strictly according to a JSON Schema.

---

## 2. Implementation Pattern

```python
import json
from imagine import ImagineClient, ChatMessage

client = ImagineClient(timeout=60.0)

# 1. Define JSON Schema for the extraction tool
tools = [
    {
        "type": "function",
        "function": {
            "name": "extract_requirement_issues",
            "description": "Log detected quality issues and rubric deductions for a requirement.",
            "parameters": {
                "type": "object",
                "properties": {
                    "req_id": {"type": "string"},
                    "overall_score": {"type": "number"},
                    "issues": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "issue_type": {
                                    "type": "string",
                                    "enum": ["Ambiguity", "Unverifiability", "Incompleteness", "Non-atomic", "Placeholder"]
                                },
                                "severity": {"type": "string", "enum": ["Blocker", "Major", "Minor"]},
                                "evidence_quote": {"type": "string"},
                                "explanation": {"type": "string"},
                                "clarification_question": {"type": "string"}
                            },
                            "required": ["issue_type", "severity", "evidence_quote", "explanation"]
                        }
                    }
                },
                "required": ["req_id", "overall_score", "issues"]
            }
        }
    }
]

# 2. Invoke chat with tools parameter
response = client.chat(
    messages=[
        ChatMessage(
            role="user",
            content='Analyze requirement REQ-001: "The device should start quickly." Call extract_requirement_issues.'
        )
    ],
    model="Llama-3.3-70B",
    tools=tools
)

# 3. Parse structured tool arguments
choice = response.choices[0]
if choice.finish_reason == "tool_calls" and choice.message.tool_calls:
    tool_call = choice.message.tool_calls[0]
    structured_data = json.loads(tool_call.function.arguments)
    print("Parsed Issues:", structured_data["issues"])
```

---

## 3. Feeding Tool Results Back (Multi-Turn)

If building an agent workflow that executes Python tools and returns results to the LLM:

```python
# Append assistant's tool call message
messages.append(response.choices[0].message)

# Execute tool and append result
messages.append({
    "role": "tool",
    "tool_call_id": tool_call.id,
    "name": "extract_requirement_issues",
    "content": json.dumps({"status": "verified"})
})

# Continue conversation
follow_up = client.chat(messages=messages, model="Llama-3.3-70B")
```
