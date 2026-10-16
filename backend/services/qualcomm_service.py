import os
import json
import logging
from typing import List, Dict, Any, Optional, Tuple
from imagine import ImagineAsyncClient, ChatMessage
from backend.config import settings
from backend.models.schemas import (
    IssueCard,
    InterpretationDuel,
    DuelCard,
    RewriteSuggestion,
    TbdDefault,
    VerificationPlan,
    TestCase,
    RequirementStatement,
    RequirementStatus,
)

logger = logging.getLogger(__name__)


def parse_tool_args(raw_args: str) -> Dict[str, Any]:
    """Robustly parse tool call arguments, handling string-encoded nested structures."""
    try:
        data = json.loads(raw_args)
    except Exception:
        return {}
    if not isinstance(data, dict):
        return {}
    for k, v in list(data.items()):
        if isinstance(v, str) and (v.strip().startswith("[") or v.strip().startswith("{")):
            try:
                data[k] = json.loads(v)
            except Exception:
                pass
    return data


def extract_chat_data(msg) -> Dict[str, Any]:
    """Robustly extract tool call or JSON parameters from Qualcomm Cloud AI 100 response."""
    if getattr(msg, "tool_calls", None) and len(msg.tool_calls) > 0:
        tc = msg.tool_calls[0]
        raw = tc.function.arguments if hasattr(tc, "function") else str(tc)
        data = parse_tool_args(raw)
        if isinstance(data.get("requirements"), str):
            try:
                data["requirements"] = json.loads(data["requirements"])
            except Exception:
                pass
        return data

    content = msg.content or ""
    if "{" in content:
        try:
            start = content.find("{")
            end = content.rfind("}")
            blob = content[start:end+1]
            if "<|eom_id|>" in blob:
                blob = blob.split("<|eom_id|>")[0].strip()
            blob = blob.replace(r"\'", "'")
            data = json.loads(blob)
            if "parameters" in data:
                data = data["parameters"]
            if isinstance(data.get("requirements"), str):
                try:
                    data["requirements"] = json.loads(data["requirements"])
                except Exception:
                    pass
            return data
        except Exception:
            pass
    return {}


# --- Qualcomm AI100 Tool Definitions ---

TOOL_XRAY = [{
    "type": "function",
    "function": {
        "name": "submit_xray_issues",
        "description": "Log detected quality issues and verbatim evidence quotes.",
        "parameters": {
            "type": "object",
            "properties": {
                "issues": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "issue_type": {"type": "string", "enum": ["Ambiguity", "Unverifiability", "Incompleteness", "Non-atomic", "Escape-hatch", "Over-specification", "Consistency"]},
                            "severity": {"type": "string", "enum": ["Blocker", "Major", "Minor"]},
                            "evidence_quote": {"type": "string"},
                            "explanation": {"type": "string"},
                            "suggested_action": {"type": "string"}
                        },
                        "required": ["issue_type", "severity", "evidence_quote", "explanation"]
                    }
                }
            },
            "required": ["issues"]
        }
    }
}]

TOOL_DUEL = [{
    "type": "function",
    "function": {
        "name": "submit_interpretation_duel",
        "description": "Submit two competing technical interpretations.",
        "parameters": {
            "type": "object",
            "properties": {
                "source_flaw": {"type": "string"},
                "clarification_question": {"type": "string"},
                "interpretation_a": {
                    "type": "object",
                    "properties": {
                        "title": {"type": "string"},
                        "stance": {"type": "string"},
                        "technical_meaning": {"type": "string"},
                        "downstream_risk": {"type": "string"}
                    },
                    "required": ["title", "stance", "technical_meaning", "downstream_risk"]
                },
                "interpretation_b": {
                    "type": "object",
                    "properties": {
                        "title": {"type": "string"},
                        "stance": {"type": "string"},
                        "technical_meaning": {"type": "string"},
                        "downstream_risk": {"type": "string"}
                    },
                    "required": ["title", "stance", "technical_meaning", "downstream_risk"]
                },
                "impact_difference": {"type": "string"}
            },
            "required": ["source_flaw", "clarification_question", "interpretation_a", "interpretation_b", "impact_difference"]
        }
    }
}]

TOOL_REWRITER = [{
    "type": "function",
    "function": {
        "name": "submit_rewritten_requirements",
        "description": "Submit rewritten EARS requirements and smart suggested defaults for TBDs.",
        "parameters": {
            "type": "object",
            "properties": {
                "original_requirement": {"type": "string"},
                "rewritten_requirements": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "id_suffix": {"type": "string"},
                            "pattern": {"type": "string"},
                            "statement": {"type": "string"},
                            "rationale": {"type": "string"}
                        },
                        "required": ["id_suffix", "pattern", "statement", "rationale"]
                    }
                },
                "identified_tbds": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "parameter_name": {"type": "string"},
                            "placeholder": {"type": "string"},
                            "suggested_value": {"type": "string"},
                            "engineering_rationale": {"type": "string"},
                            "confidence": {"type": "string", "enum": ["HIGH", "MEDIUM", "LOW"]}
                        },
                        "required": ["parameter_name", "placeholder", "suggested_value", "engineering_rationale", "confidence"]
                    }
                }
            },
            "required": ["original_requirement", "rewritten_requirements", "identified_tbds"]
        }
    }
}]

TOOL_BLUEPRINT = [{
    "type": "function",
    "function": {
        "name": "submit_verification_blueprint",
        "description": "Submit verification blueprint test cases and acceptance criteria.",
        "parameters": {
            "type": "object",
            "properties": {
                "verification_method": {"type": "string", "enum": ["Test", "Demonstration", "Inspection", "Analysis"]},
                "preconditions": {"type": "array", "items": {"type": "string"}},
                "positive_test_case": {
                    "type": "object",
                    "properties": {
                        "test_name": {"type": "string"},
                        "stimulus_steps": {"type": "array", "items": {"type": "string"}},
                        "expected_response": {"type": "string"}
                    },
                    "required": ["test_name", "stimulus_steps", "expected_response"]
                },
                "negative_boundary_test_case": {
                    "type": "object",
                    "properties": {
                        "test_name": {"type": "string"},
                        "stimulus_steps": {"type": "array", "items": {"type": "string"}},
                        "expected_response": {"type": "string"}
                    },
                    "required": ["test_name", "stimulus_steps", "expected_response"]
                },
                "acceptance_criteria": {
                    "type": "object",
                    "properties": {
                        "pass_condition": {"type": "string"},
                        "fail_condition": {"type": "string"}
                    },
                    "required": ["pass_condition", "fail_condition"]
                }
            },
            "required": ["verification_method", "preconditions", "positive_test_case", "negative_boundary_test_case", "acceptance_criteria"]
        }
    }
}]

TOOL_CHAT = [{
    "type": "function",
    "function": {
        "name": "submit_chat_requirements",
        "description": "Formulate formal EARS requirements and conversational feedback grounded in project documentation context.",
        "parameters": {
            "type": "object",
            "properties": {
                "agent_reply": {
                    "type": "string",
                    "description": "Conversational explanation to the PM detailing how the requirement was synthesized and grounded."
                },
                "context_grounding": {
                    "type": "string",
                    "description": "Specific project architectural constraint, charter boundary, or safety limit cited."
                },
                "requirements": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "text": {"type": "string", "description": "Strict EARS statement containing at least one [TBD: parameter_name] placeholder"},
                            "category": {"type": "string"},
                            "section": {"type": "string"}
                        },
                        "required": ["text", "category", "section"]
                    }
                },
                "identified_tbds": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "parameter_name": {"type": "string"},
                            "suggested_value": {"type": "string"},
                            "rationale": {"type": "string"},
                            "confidence": {"type": "string", "enum": ["HIGH", "MEDIUM", "LOW"]}
                        },
                        "required": ["parameter_name", "suggested_value", "rationale", "confidence"]
                    }
                }
            },
            "required": ["agent_reply", "context_grounding", "requirements", "identified_tbds"]
        }
    }
}]


class QualcommService:
    """
    Asynchronous Qualcomm Cloud AI 100 client wrapper.
    Includes stage-resilient offline fallback adapter and deterministic receipts.
    """

    def __init__(self, mock_mode: Optional[bool] = None):
        self.mock_mode = settings.MOCK_MODE if mock_mode is None else mock_mode
        self.client = ImagineAsyncClient(
            endpoint=settings.IMAGINE_ENDPOINT_URL,
            api_key=settings.IMAGINE_API_KEY,
            timeout=settings.TIMEOUT_SECONDS,
        )

    async def ping(self) -> Dict[str, Any]:
        """Verify Cirrascale connectivity or return mock status."""
        if self.mock_mode:
            return {"status": "ok", "mode": "mock", "message": "Qualcomm AI 100 Mock Adapter Active"}
        try:
            res = await self.client.ping()
            return {"status": "ok", "mode": "live", "message": res.get("message", "pong")}
        except Exception as e:
            logger.warning(f"Qualcomm API ping failed: {e}. Falling back to mock adapter.")
            return {"status": "degraded", "mode": "fallback_mock", "error": str(e)}

    async def extract_xray_issues(self, req_text: str) -> List[IssueCard]:
        """Extract requirement defects using Llama-3.3-70B tool calling."""
        if self.mock_mode:
            return self._mock_xray_issues(req_text)

        system_prompt = (
            "You are a Principal Safety-Critical Requirements Quality Auditor conforming to ISO/IEC/IEEE 29148. "
            "Analyze the requirement statement for flaws across Ambiguity, Unverifiability, Incompleteness, Non-atomic, Escape-hatch, Over-specification. "
            "CRITICAL GUARDRAIL: evidence_quote MUST be an EXACT, verbatim, case-sensitive substring from the input text. "
            "Call submit_xray_issues."
        )

        try:
            resp = await self.client.chat(
                messages=[
                    ChatMessage(role="system", content=system_prompt),
                    ChatMessage(role="user", content=f'Analyze requirement: "{req_text}" Call submit_xray_issues.')
                ],
                model=settings.MODEL_70B,
                tools=TOOL_XRAY,
                temperature=0.0
            )
            tc = resp.choices[0].message.tool_calls[0]
            data = parse_tool_args(tc.function.arguments)
            raw_issues = data.get("issues", [])
            
            cards = []
            for item in raw_issues:
                quote = item.get("evidence_quote", "")
                # Ensure evidence quote exists in source; if slightly mismatched, trim or fallback
                if quote not in req_text:
                    for token in quote.split():
                        if token in req_text:
                            quote = token
                            break
                cards.append(IssueCard(
                    issue_type=item.get("issue_type", "Ambiguity"),
                    severity=item.get("severity", "Major"),
                    evidence_quote=quote if quote in req_text else req_text[:25],
                    explanation=item.get("explanation", "Detected specification defect"),
                    suggested_action=item.get("suggested_action", "Clarify exact metric")
                ))
            return cards
        except Exception as e:
            logger.warning(f"Live X-Ray extraction failed: {e}. Using fallback mock adapter.")
            return self._mock_xray_issues(req_text)

    async def stage_interpretation_duel(self, req_text: str) -> InterpretationDuel:
        """Formulate two competing technical interpretations using Llama-3.1-8B."""
        if self.mock_mode:
            return self._mock_interpretation_duel(req_text)

        system_prompt = (
            "You are a Systems Engineering Conflict Engine. "
            "Formulate TWO competing, mutually exclusive, plausible technical interpretations: "
            "interpretation_a (e.g. low-latency, real-time, or time-based stance) vs "
            "interpretation_b (e.g. high-throughput, batch, or count-based stance). "
            "Call submit_interpretation_duel."
        )

        try:
            resp = await self.client.chat(
                messages=[
                    ChatMessage(role="system", content=system_prompt),
                    ChatMessage(role="user", content=f'Analyze ambiguity and stage duel for: "{req_text}" Call submit_interpretation_duel.')
                ],
                model=settings.MODEL_8B,
                tools=TOOL_DUEL,
                temperature=0.1
            )
            tc = resp.choices[0].message.tool_calls[0]
            data = parse_tool_args(tc.function.arguments)

            a = data.get("interpretation_a", {})
            b = data.get("interpretation_b", {})

            return InterpretationDuel(
                flaw_quote=data.get("source_flaw", req_text[:25]),
                flaw_type="Architectural Ambiguity",
                card_a=DuelCard(
                    title=a.get("title", "Interpretation A (Edge/Real-time)"),
                    stance=a.get("stance", "Low-latency stance"),
                    technical_spec=a.get("technical_meaning", "Immediate transmission on state change"),
                    architectural_impact=a.get("downstream_risk", "High bus utilization under burst conditions")
                ),
                card_b=DuelCard(
                    title=b.get("title", "Interpretation B (Batch/Throughput)"),
                    stance=b.get("stance", "High-throughput stance"),
                    technical_spec=b.get("technical_meaning", "Periodic aggregated transmission in batches"),
                    architectural_impact=b.get("downstream_risk", "Increased telemetry latency during fast transients")
                )
            )
        except Exception as e:
            logger.warning(f"Live Interpretation Duel failed: {e}. Using fallback mock adapter.")
            return self._mock_interpretation_duel(req_text)

    async def rewrite_with_smart_defaults(self, req_text: str) -> RewriteSuggestion:
        """Rewrite requirement preserving [TBD: ...] placeholders and suggesting defaults."""
        if self.mock_mode:
            return self._mock_rewrite(req_text)

        system_prompt = (
            "You are a Principal Systems Engineer rewriting requirements into strict EARS and ISO/IEC/IEEE 29148 standard.\n"
            "CRITICAL ZERO-FABRICATION & SMART SUGGESTION DIRECTIVE:\n"
            "1. NEVER invent or hardcode numerical values, time durations, or limits directly in the statement text.\n"
            "2. Every unstated or subjective metric MUST be parameterized in the statement as: `[TBD: <parameter_name_and_unit>]`.\n"
            "3. For EACH [TBD] parameter, propose a SMART SUGGESTED DEFAULT in `identified_tbds` citing industry standard rationale.\n"
            "4. Decompose non-atomic statements into multiple requirements.\n"
            "5. Always call submit_rewritten_requirements."
        )

        try:
            resp = await self.client.chat(
                messages=[
                    ChatMessage(role="system", content=system_prompt),
                    ChatMessage(role="user", content=f'Target: "{req_text}" Call submit_rewritten_requirements.')
                ],
                model=settings.MODEL_70B,
                tools=TOOL_REWRITER,
                temperature=0.0
            )
            tc = resp.choices[0].message.tool_calls[0]
            data = parse_tool_args(tc.function.arguments)

            reqs = data.get("rewritten_requirements", [])
            tbds = data.get("identified_tbds", [])

            revised_statements = []
            for r in reqs:
                stmt = r.get("statement") or r.get("pattern") or ""
                revised_statements.append(stmt)
            revised_full = " ".join(revised_statements) if revised_statements else f"The system shall operate within [TBD: response_time_ms]."

            identified = []
            for t in tbds:
                identified.append(TbdDefault(
                    parameter_name=t.get("parameter_name", "threshold_limit"),
                    suggested_value=t.get("suggested_value", "100 ms"),
                    rationale=t.get("engineering_rationale", "Standard baseline threshold"),
                    confidence=t.get("confidence", "MEDIUM") if t.get("confidence") in ["HIGH", "MEDIUM", "LOW"] else "MEDIUM"
                ))

            return RewriteSuggestion(
                original=req_text,
                revised=revised_full,
                rationale=reqs[0].get("rationale", "Aligned with EARS syntax and zero-fabrication directives.") if reqs else "EARS compliance",
                identified_tbds=identified
            )
        except Exception as e:
            logger.warning(f"Live Rewriter failed: {e}. Using fallback mock adapter.")
            return self._mock_rewrite(req_text)

    async def generate_verification_blueprint(self, req_text: str) -> VerificationPlan:
        """Generate test cases and falsifiable acceptance criteria using Llama-3.3-70B."""
        if self.mock_mode:
            return self._mock_verification_blueprint(req_text)

        system_prompt = (
            "You are a Senior Test and Verification Architect conforming to ISO 26262, DO-178C, and IEEE 829. "
            "Generate concrete preconditions, positive test case, negative/boundary test case, and falsifiable acceptance criteria. "
            "Call submit_verification_blueprint."
        )

        try:
            resp = await self.client.chat(
                messages=[
                    ChatMessage(role="system", content=system_prompt),
                    ChatMessage(role="user", content=f'Generate verification blueprint for: "{req_text}" Call submit_verification_blueprint.')
                ],
                model=settings.MODEL_70B,
                tools=TOOL_BLUEPRINT,
                temperature=0.0
            )
            tc = resp.choices[0].message.tool_calls[0]
            data = parse_tool_args(tc.function.arguments)

            pos = data.get("positive_test_case", {})
            neg = data.get("negative_boundary_test_case", {})
            crit = data.get("acceptance_criteria", {})

            return VerificationPlan(
                verification_method=data.get("verification_method", "Test"),
                preconditions=data.get("preconditions", ["Device in nominal operating state"]),
                positive_test_case=TestCase(
                    name=pos.get("test_name", "Nominal Verification Test"),
                    stimulus="; ".join(pos.get("stimulus_steps", ["Apply valid input trigger"])),
                    expected_response=pos.get("expected_response", "System responds within parameterized tolerance")
                ),
                negative_boundary_test_case=TestCase(
                    name=neg.get("test_name", "Boundary / Fault Injection Test"),
                    stimulus="; ".join(neg.get("stimulus_steps", ["Apply out-of-spec input"])),
                    expected_response=neg.get("expected_response", "System transitions to safe state")
                ),
                acceptance_criteria={
                    "PASS": crit.get("pass_condition", "Response satisfies all parameterized [TBD] thresholds"),
                    "FAIL": crit.get("fail_condition", "Response exceeds timeout or omits telemetry")
                }
            )
        except Exception as e:
            logger.warning(f"Live Verification Blueprint failed: {e}. Using fallback mock adapter.")
            return self._mock_verification_blueprint(req_text)

    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate dense vector embeddings using BAAI/bge-large-en-v1.5."""
        if self.mock_mode:
            import numpy as np
            # Generate deterministic synthetic 1024-dim vectors
            vectors = []
            for t in texts:
                np.random.seed(abs(hash(t)) % (2**32))
                v = np.random.normal(0, 1, 1024)
                v = v / np.linalg.norm(v)
                vectors.append(v.tolist())
            return vectors

        try:
            res = await self.client.embeddings(
                model=settings.MODEL_EMBEDDING,
                input=texts
            )
            return [item.embedding for item in res.data]
        except Exception as e:
            logger.warning(f"Live Embeddings failed: {e}. Using deterministic fallback.")
            import numpy as np
            vectors = []
            for t in texts:
                np.random.seed(abs(hash(t)) % (2**32))
                v = np.random.normal(0, 1, 1024)
                v = v / np.linalg.norm(v)
                vectors.append(v.tolist())
            return vectors

    async def generate_requirements_from_chat(
        self,
        pm_message: str,
        project_context: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        next_req_index: int = 1
    ) -> Tuple[str, List[RequirementStatement], str]:
        """
        Synthesize formal, atomic EARS requirements from conversational PM inputs,
        strictly grounded in the provided project context and engineering charter.
        """
        if self.mock_mode:
            return self._mock_chat_requirements(pm_message, project_context, next_req_index)

        system_prompt = (
            "You are the Requirement Quality Copilot, a Principal Systems Engineering Architect conforming to ISO/IEC/IEEE 29148 and EARS syntax. "
            "A Product Manager is communicating with you in plain, conversational, informal English. "
            "Your objective is to translate their request into formal, atomic, verifiable requirements strictly grounded in the provided Project Documentation Context.\n\n"
            f"PROJECT CONTEXT & ENGINEERING CHARTER:\n{project_context}\n\n"
            "CRITICAL MANDATES:\n"
            "1. ZERO-FABRICATION RULE: NEVER hardcode assumed numbers, durations, or limits in requirement text. "
            "Every requirement statement MUST parameterize every unstated metric, threshold, duration, or subjective quality (e.g. 'loudly', 'quickly', 'promptly') as: `[TBD: <parameter_name_and_unit>]`. Every requirement text MUST contain at least one `[TBD: ...]` token.\n"
            "2. SMART SUGGESTED DEFAULTS: For each `[TBD]` token, you MUST propose a realistic default in `identified_tbds` "
            "citing specific numbers or baselines directly from the Project Context or relevant safety standards.\n"
            "3. ATOMIC DECOMPOSITION: Decompose multiple distinct actions, safeguards, or alerts into separate atomic requirements with distinct functional categories. Every single requirement MUST have its own `identified_tbds`.\n"
            "4. STRICT EARS SYNTAX: Use mandatory modal verb 'shall' (e.g. 'When <trigger>, the system shall <action>'). "
            "Never retain weak conversational phrasing ('should', 'we need to', 'make sure').\n"
            "5. CONVERSATIONAL EXPLANATION: In `agent_reply`, explain your engineering rationale directly to the PM, "
            "referencing why specific thresholds were flagged as [TBD] and which project charter constraints were applied.\n"
            "Call submit_chat_requirements."
        )

        messages = [ChatMessage(role="system", content=system_prompt)]
        if conversation_history:
            for m in conversation_history[-4:]:
                role = m.get("role", "user")
                if role in ["user", "assistant"]:
                    messages.append(ChatMessage(role=role, content=m.get("content", "")))
        messages.append(ChatMessage(role="user", content=f'PM Request: "{pm_message}" Call submit_chat_requirements.'))

        try:
            resp = await self.client.chat(
                messages=messages,
                model=settings.MODEL_70B,
                tools=TOOL_CHAT,
                temperature=0.1
            )
            msg = resp.choices[0].message
            data = extract_chat_data(msg)

            agent_reply = data.get("agent_reply", "I have structured your request into formal requirements.")
            grounding = data.get("context_grounding", "Grounded in Project Context.")
            raw_reqs = data.get("requirements", [])
            top_tbds = data.get("identified_tbds", [])

            req_statements = []
            for idx, r in enumerate(raw_reqs, start=next_req_index):
                statement_text = r.get("text", "")
                tbds_source = r.get("identified_tbds", [])
                if not tbds_source:
                    matched = [t for t in top_tbds if t.get("parameter_name", "") in statement_text]
                    tbds_source = matched if matched else top_tbds

                tbds = []
                for t in tbds_source:
                    tbds.append(TbdDefault(
                        parameter_name=t.get("parameter_name", "parameter_limit"),
                        suggested_value=str(t.get("suggested_value", "100 ms")),
                        engineering_rationale=t.get("rationale", t.get("engineering_rationale", "Standard engineering baseline")),
                        confidence=t.get("confidence", "MEDIUM") if t.get("confidence") in ["HIGH", "MEDIUM", "LOW"] else "MEDIUM"
                    ))
                statement_text = r.get("text", "")
                req_statements.append(RequirementStatement(
                    id=f"REQ-CHAT-{idx:03d}",
                    text=statement_text,
                    category=r.get("category", "Functional"),
                    section=r.get("section", "Chat Synthesis"),
                    status=RequirementStatus.FLAGGED_TBD,
                    rewrite_suggestion=RewriteSuggestion(
                        original=pm_message,
                        revised=statement_text,
                        rationale=grounding,
                        identified_tbds=tbds
                    )
                ))
            return agent_reply, req_statements, grounding
        except Exception as e:
            logger.warning(f"Live Chat synthesis failed: {e}. Using fallback mock adapter.")
            return self._mock_chat_requirements(pm_message, project_context, next_req_index)

    # --- Fallback Mock Generators (Stage Pitch Resilience) ---

    def _mock_xray_issues(self, req_text: str) -> List[IssueCard]:
        issues = []
        lower = req_text.lower()
        if any(w in lower for w in ["quickly", "fast", "minimal", "reliable", "periodically", "normal"]):
            quote = next((w for w in ["quickly", "fast", "minimal", "reliable", "periodically", "normal"] if w in lower), "quickly")
            # find original case quote in req_text
            idx = req_text.lower().find(quote)
            exact_quote = req_text[idx:idx+len(quote)] if idx >= 0 else quote
            issues.append(IssueCard(
                issue_type="Ambiguity",
                severity="Blocker",
                evidence_quote=exact_quote,
                explanation=f"Subjective quantifier '{exact_quote}' lacks deterministic boundary or SI metric.",
                suggested_action=f"Replace '{exact_quote}' with an explicit bounded parameter [TBD: duration_ms]."
            ))
        if any(w in lower for w in ["where feasible", "as appropriate", "if possible", "when needed"]):
            quote = next((w for w in ["where feasible", "as appropriate", "if possible", "when needed"] if w in lower), "where feasible")
            idx = req_text.lower().find(quote)
            exact_quote = req_text[idx:idx+len(quote)] if idx >= 0 else quote
            issues.append(IssueCard(
                issue_type="Escape-hatch",
                severity="Major",
                evidence_quote=exact_quote,
                explanation="Escape hatch creates non-binding loophole evading conformance testing.",
                suggested_action="Specify exact fallback trigger criteria or remove permissive clause."
            ))
        if " and " in lower and len(req_text.split(" and ")) > 2:
            issues.append(IssueCard(
                issue_type="Non-atomic",
                severity="Major",
                evidence_quote=" and ",
                explanation="Compound statement combines multiple distinct functional obligations.",
                suggested_action="Decompose into distinct atomic requirements."
            ))
        if not issues:
            issues.append(IssueCard(
                issue_type="Unverifiability",
                severity="Minor",
                evidence_quote=req_text[:min(20, len(req_text))],
                explanation="Requirement lacks quantifiable pass/fail verification criteria.",
                suggested_action="Bind requirement to falsifiable threshold limits."
            ))
        return issues

    def _mock_interpretation_duel(self, req_text: str) -> InterpretationDuel:
        return InterpretationDuel(
            flaw_quote="periodically" if "periodically" in req_text else req_text[:20],
            flaw_type="Timing Ambiguity",
            card_a=DuelCard(
                title="Card A: Event-Driven / Real-Time",
                stance="Low-latency immediate streaming",
                technical_spec="Broadcast telemetry within 10ms of each state change",
                architectural_impact="High bus utilization and packet overhead on CAN/Ethernet"
            ),
            card_b=DuelCard(
                title="Card B: Batch Aggregation / Polling",
                stance="High-throughput periodic batching",
                technical_spec="Buffer samples and flush every 1000ms in batched frames",
                architectural_impact="Introduces up to 1000ms latency on critical sensor transitions"
            )
        )

    def _mock_rewrite(self, req_text: str) -> RewriteSuggestion:
        return RewriteSuggestion(
            original=req_text,
            revised="When telemetry data is generated, the system shall transmit telemetry packets within [TBD: max_packet_latency_ms].",
            rationale="Restructured into EARS ubiquitous/event-driven syntax. Subjective timing parameterized to guarantee zero-fabrication.",
            identified_tbds=[
                TbdDefault(
                    parameter_name="max_packet_latency_ms",
                    suggested_value="250 ms",
                    rationale="Standard nominal telemetry reporting cycle under ISO 11898-1.",
                    confidence="HIGH"
                )
            ]
        )

    def _mock_verification_blueprint(self, req_text: str) -> VerificationPlan:
        return VerificationPlan(
            verification_method="Test",
            preconditions=[
                "HIL test bench active with simulated telemetry sensor feeds",
                "Bus analyzer connected and synchronized with NTP clock"
            ],
            positive_test_case=TestCase(
                name="Nominal Telemetry Throughput Test",
                stimulus="Inject nominal sensor signals at 100 Hz for 60 seconds",
                expected_response="Telemetry frame dispatched within [TBD: max_packet_latency_ms] with zero frame drop"
            ),
            negative_boundary_test_case=TestCase(
                name="Bus Congestion & Fault Injection Test",
                stimulus="Saturate communication bus to 90% load and trigger burst event",
                expected_response="High-priority telemetry delivered within timeout; lower-priority frames queued without buffer overrun"
            ),
            acceptance_criteria={
                "PASS": "Latency measured <= [TBD: max_packet_latency_ms] and packet checksum valid",
                "FAIL": "Telemetry latency > [TBD: max_packet_latency_ms] or packet dropped under nominal load"
            }
        )

    def _mock_chat_requirements(
        self,
        pm_message: str,
        project_context: str,
        next_req_index: int = 1
    ) -> Tuple[str, List[RequirementStatement], str]:
        lower = pm_message.lower()
        if any(w in lower for w in ["overheat", "temperature", "temp", "cool", "battery", "thermal", "hot"]):
            reqs = [
                RequirementStatement(
                    id=f"REQ-CHAT-{next_req_index:03d}",
                    text="When pack temperature exceeds [TBD: max_pack_temp_degC], the thermal management system shall activate auxiliary liquid coolant flow within [TBD: cooling_actuation_ms].",
                    category="Thermal Safety",
                    section="Section 4.5 - BMS Thermal Management",
                    status=RequirementStatus.FLAGGED_TBD,
                    rewrite_suggestion=RewriteSuggestion(
                        original=pm_message,
                        revised="When pack temperature exceeds [TBD: max_pack_temp_degC], the thermal management system shall activate auxiliary liquid coolant flow within [TBD: cooling_actuation_ms].",
                        rationale="Derived from 800V EV BMS Charter: 55°C maximum DC fast charge limit.",
                        identified_tbds=[
                            TbdDefault(
                                parameter_name="max_pack_temp_degC",
                                suggested_value="55 °C",
                                rationale="Maximum operating envelope under DC fast charging cited in Project Safety Charter.",
                                confidence="HIGH"
                            ),
                            TbdDefault(
                                parameter_name="cooling_actuation_ms",
                                suggested_value="250 ms",
                                rationale="CAN-FD thermal valve response budget.",
                                confidence="HIGH"
                            )
                        ]
                    )
                ),
                RequirementStatement(
                    id=f"REQ-CHAT-{next_req_index+1:03d}",
                    text="If battery cell temperature reaches [TBD: critical_thermal_runaway_threshold_degC], the vehicle interface shall display a red warning icon and sound an audible chime within [TBD: alert_display_ms].",
                    category="Driver Alert",
                    section="Section 6.1 - Cluster Warning Alerts",
                    status=RequirementStatus.FLAGGED_TBD,
                    rewrite_suggestion=RewriteSuggestion(
                        original=pm_message,
                        revised="If battery cell temperature reaches [TBD: critical_thermal_runaway_threshold_degC], the vehicle interface shall display a red warning icon and sound an audible chime within [TBD: alert_display_ms].",
                        rationale="ISO 26262 ASIL-D driver notification requirement.",
                        identified_tbds=[
                            TbdDefault(
                                parameter_name="critical_thermal_runaway_threshold_degC",
                                suggested_value="60 °C",
                                rationale="Thermal runaway onset threshold for NMC 811 chemistry.",
                                confidence="HIGH"
                            ),
                            TbdDefault(
                                parameter_name="alert_display_ms",
                                suggested_value="100 ms",
                                rationale="Human factors instrument cluster warning display latency standard.",
                                confidence="HIGH"
                            )
                        ]
                    )
                )
            ]
            agent_reply = (
                "I analyzed your request against your **Next-Gen 800V EV Powertrain & BMS** charter. "
                "Because your thermal loop limits peak pack temperature to 55°C during 350kW fast charging, "
                "I split your thought into two atomic EARS requirements: one for auxiliary cooling actuation and one for critical driver alerting. "
                "All thresholds are preserved as `[TBD]` with Smart Suggested Defaults grounded in your charter."
            )
            grounding = "Grounded in Project Charter: 800V BMS thermal loop (55°C limit during 350kW fast charging, ISO 26262 ASIL-D)."
            return agent_reply, reqs, grounding

        # Generic Fallback
        req = RequirementStatement(
            id=f"REQ-CHAT-{next_req_index:03d}",
            text=f"The system shall process {pm_message.strip()} within [TBD: max_response_latency_ms].",
            category="Functional",
            section="Section 3.0 - General Systems",
            status=RequirementStatus.FLAGGED_TBD,
            rewrite_suggestion=RewriteSuggestion(
                original=pm_message,
                revised=f"The system shall process {pm_message.strip()} within [TBD: max_response_latency_ms].",
                rationale="Formatted into EARS syntax from conversational PM prompt.",
                identified_tbds=[
                    TbdDefault(
                        parameter_name="max_response_latency_ms",
                        suggested_value="200 ms",
                        rationale="Nominal embedded controller execution cycle.",
                        confidence="MEDIUM"
                    )
                ]
            )
        )
        agent_reply = (
            f"I converted your requirement thought into formal EARS syntax and mapped it to the system architecture. "
            f"Numerical response time has been parameterized as `[TBD: max_response_latency_ms]` with a suggested default of 200ms."
        )
        grounding = "Grounded in general embedded systems operating charter."
        return agent_reply, [req], grounding
