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
    SemanticDuplicateMatch,
    RequirementConflictCard,
    ConflictRadarResponse,
)
from backend.services.evidence_validator import evidence_validator

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
    if hasattr(msg, "choices") and len(msg.choices) > 0:
        msg = msg.choices[0].message

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
        "description": "Submit rewritten EARS requirements containing [TBD: ...] placeholders.",
        "parameters": {
            "type": "object",
            "properties": {
                "original_requirement": {"type": "string"},
                "rewritten_requirements": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "statement": {"type": "string", "description": "EARS statement strictly containing [TBD: <parameter>] tokens for all thresholds"},
                            "rationale": {"type": "string"}
                        },
                        "required": ["statement", "rationale"]
                    }
                },
                "identified_tbds": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "parameter_name": {"type": "string"},
                            "suggested_value": {"type": "string"},
                            "engineering_rationale": {"type": "string"},
                            "confidence": {"type": "string", "enum": ["HIGH", "MEDIUM", "LOW"]}
                        },
                        "required": ["parameter_name", "suggested_value", "engineering_rationale", "confidence"]
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

TOOL_CONFLICT_RADAR = [{
    "type": "function",
    "function": {
        "name": "submit_conflict_analysis",
        "description": "Report logical contradictions, opposing obligations, or physical incompatibilities between requirement statements.",
        "parameters": {
            "type": "object",
            "properties": {
                "conflicts": {
                    "type": "array",
                    "description": "List of detected requirement conflicts. Empty if requirements are mutually compatible.",
                    "items": {
                        "type": "object",
                        "properties": {
                            "req_id_a": {"type": "string", "description": "ID of first requirement"},
                            "req_id_b": {"type": "string", "description": "ID of second requirement"},
                            "conflict_type": {
                                "type": "string",
                                "enum": [
                                    "Direct Contradiction",
                                    "Timing Mismatch",
                                    "Resource Contention",
                                    "Operational Incompatibility"
                                ],
                                "description": "Category of technical conflict"
                            },
                            "severity": {
                                "type": "string",
                                "enum": ["BLOCKER", "MAJOR", "MINOR"],
                                "description": "Impact of conflict on system safety and architecture"
                            },
                            "conflicting_quote_a": {"type": "string", "description": "Verbatim quote or obligation from first requirement"},
                            "conflicting_quote_b": {"type": "string", "description": "Verbatim quote or obligation from second requirement"},
                            "explanation": {"type": "string", "description": "Systems engineering rationale detailing the mutual incompatibility"},
                            "reconciliation_suggestion": {"type": "string", "description": "Concrete proposal to reconcile or disambiguate the conflict"}
                        },
                        "required": [
                            "req_id_a",
                            "req_id_b",
                            "conflict_type",
                            "severity",
                            "conflicting_quote_a",
                            "conflicting_quote_b",
                            "explanation",
                            "reconciliation_suggestion"
                        ]
                    }
                }
            },
            "required": ["conflicts"]
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

    @property
    def client(self) -> ImagineAsyncClient:
        """Always obtain an ImagineAsyncClient bound to the active running event loop."""
        return ImagineAsyncClient(
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
            msg = getattr(res, "message", "pong") if not isinstance(res, dict) else res.get("message", "pong")
            return {"status": "ok", "mode": "live", "message": msg}
        except Exception as e:
            logger.error(f"Qualcomm API ping failed: {e}")
            raise RuntimeError(f"Qualcomm API ping failed: {e}") from e

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
                cards.append(IssueCard(
                    issue_type=item.get("issue_type", "Ambiguity"),
                    severity=item.get("severity", "Major"),
                    evidence_quote=item.get("evidence_quote", req_text[:25]),
                    explanation=item.get("explanation", "Detected specification defect"),
                    suggested_action=item.get("suggested_action", "Clarify exact metric")
                ))
            return evidence_validator.validate_and_ground_cards(cards, req_text)
        except Exception as e:
            logger.error(f"Live X-Ray extraction failed: {e}")
            raise RuntimeError(f"Qualcomm AI100 X-Ray extraction error: {e}") from e

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
            logger.error(f"Live Interpretation Duel failed: {e}")
            raise RuntimeError(f"Qualcomm AI100 Duel error: {e}") from e

    async def rewrite_with_smart_defaults(self, req_text: str) -> RewriteSuggestion:
        """Rewrite requirement preserving [TBD: ...] placeholders and suggesting defaults."""
        if self.mock_mode:
            return self._mock_rewrite(req_text)

        system_prompt = (
            "You are a Principal Systems Engineer rewriting requirements into strict EARS and ISO/IEC/IEEE 29148 standard.\n\n"
            "CRITICAL ZERO-FABRICATION MANDATE:\n"
            "1. NEVER invent or hardcode numerical values, time durations, or limits directly in the statement text.\n"
            "2. You MUST replace every subjective or unstated threshold (such as 'quickly', 'critical temperature', 'power') in the statement with an explicit placeholder: `[TBD: <parameter_name_and_unit>]`.\n"
            "3. Every statement MUST contain at least one `[TBD: ...]` token (e.g. 'When temperature exceeds [TBD: critical_temperature_degC], the module shall reduce power by [TBD: power_reduction_percent] within [TBD: response_time_ms].').\n"
            "4. For each [TBD] token, propose a SMART SUGGESTED DEFAULT in identified_tbds.\n"
            "Call submit_rewritten_requirements."
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
            logger.error(f"Live Rewriter failed: {e}")
            raise RuntimeError(f"Qualcomm AI100 Rewriter error: {e}") from e

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
            logger.error(f"Live Verification Blueprint failed: {e}")
            raise RuntimeError(f"Qualcomm AI100 Blueprint error: {e}") from e

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
            results = []
            for t in texts:
                res = await self.client.embeddings(
                    text=t,
                    model=settings.MODEL_EMBEDDING
                )
                emb = getattr(res, "first_embedding", None)
                if not emb and getattr(res, "data", None):
                    emb = res.data[0].embedding
                results.append(emb)
            return results
        except Exception as e:
            logger.error(f"Live Embeddings failed: {e}")
            raise RuntimeError(f"Qualcomm AI100 Embeddings error: {e}") from e

    async def find_semantic_duplicates(
        self,
        requirements: List[RequirementStatement],
        similarity_threshold: float = 0.85
    ) -> List[SemanticDuplicateMatch]:
        """
        Detect semantically duplicate requirement statements using BAAI/bge-large-en-v1.5
        1024-dimensional dense vector embeddings and pairwise cosine similarity.
        """
        if len(requirements) < 2:
            return []

        texts = [r.text for r in requirements]
        vectors = await self.generate_embeddings(texts)

        import numpy as np
        vec_arr = np.array(vectors, dtype=np.float32)
        norms = np.linalg.norm(vec_arr, axis=1, keepdims=True)
        norms[norms == 0] = 1e-10
        norm_vecs = vec_arr / norms

        sim_matrix = np.dot(norm_vecs, norm_vecs.T)
        matches: List[SemanticDuplicateMatch] = []
        n = len(requirements)

        for i in range(n):
            for j in range(i + 1, n):
                score = float(sim_matrix[i, j])
                if score >= similarity_threshold:
                    is_exact_text = requirements[i].text.strip().lower() == requirements[j].text.strip().lower()
                    if is_exact_text or score >= 0.999:
                        m_type = "EXACT"
                        explanation = f"Exact text collision detected with cosine identity {score:.4f}."
                    else:
                        m_type = "NEURAL_SEMANTIC"
                        explanation = (
                            f"Neural semantic similarity score of {score:.3f} indicates equivalent systems engineering intent "
                            f"and obligations across differing vocabulary."
                        )
                    matches.append(
                        SemanticDuplicateMatch(
                            req_id_a=requirements[i].id,
                            req_id_b=requirements[j].id,
                            text_a=requirements[i].text,
                            text_b=requirements[j].text,
                            similarity_score=round(score, 4),
                            match_type=m_type,
                            explanation=explanation
                        )
                    )

        matches.sort(key=lambda m: m.similarity_score, reverse=True)
        return matches

    async def detect_conflicts(
        self,
        target_req: RequirementStatement,
        candidate_reqs: List[RequirementStatement]
    ) -> ConflictRadarResponse:
        """
        Analyze a target requirement against candidate requirements for logical contradictions,
        timing mismatches, resource contentions, or operational incompatibilities using Llama-3.3-70B.
        """
        valid_candidates = [c for c in candidate_reqs if c.id != target_req.id]
        if not valid_candidates:
            return ConflictRadarResponse(total_conflicts_found=0, conflicts=[])

        if self.mock_mode:
            return self._mock_detect_conflicts(target_req, valid_candidates)

        candidate_list_text = "\n".join(
            [f"- [{c.id}]: \"{c.text}\"" for c in valid_candidates]
        )

        system_prompt = (
            "You are the Conflict Radar agent of the Requirement Quality Copilot, a Lead Safety and Systems Architect. "
            "Your task is to analyze a TARGET REQUIREMENT against a list of CANDIDATE REQUIREMENTS in the specification.\n\n"
            "You must detect:\n"
            "1. 'Direct Contradiction': Opposing behaviors, inverted conditions, or contradictory actions in identical operational modes.\n"
            "2. 'Timing Mismatch': Mutually incompatible timing tolerances, latencies, or response budgets.\n"
            "3. 'Resource Contention': Mutually exclusive competition for actuators, buses, or memory without arbitration.\n"
            "4. 'Operational Incompatibility': Incompatible lifecycle state transitions or impossible co-requisites.\n\n"
            "CRITICAL CONSTRAINTS:\n"
            "- Extract exact verbatim quotes for 'conflicting_quote_a' (from target) and 'conflicting_quote_b' (from candidate).\n"
            "- Classify severity as 'BLOCKER', 'MAJOR', or 'MINOR'.\n"
            "- If requirements are mutually compatible or orthogonal, return an empty 'conflicts' array.\n"
            "- Always call the 'submit_conflict_analysis' tool."
        )

        user_content = (
            f"TARGET REQUIREMENT:\n"
            f"[{target_req.id}]: \"{target_req.text}\"\n\n"
            f"CANDIDATE REQUIREMENTS TO CHECK AGAINST:\n"
            f"{candidate_list_text}\n\n"
            f"Perform deep logical consistency analysis and submit any detected conflicts."
        )

        for attempt in range(2):
            try:
                messages = [
                    ChatMessage(role="system", content=system_prompt),
                    ChatMessage(role="user", content=user_content)
                ]
                response = await self.client.chat(
                    messages=messages,
                    model=settings.MODEL_REASONING,
                    tools=TOOL_CONFLICT_RADAR,
                    temperature=0.0
                )

                data = extract_chat_data(response)
                raw_conflicts = data.get("conflicts", [])
                conflicts: List[RequirementConflictCard] = []
                for item in raw_conflicts:
                    conflicts.append(
                        RequirementConflictCard(
                            req_id_a=item.get("req_id_a", target_req.id),
                            req_id_b=item.get("req_id_b", "UNKNOWN"),
                            conflict_type=item.get("conflict_type", "Direct Contradiction"),
                            severity=item.get("severity", "BLOCKER"),
                            conflicting_quote_a=item.get("conflicting_quote_a", target_req.text),
                            conflicting_quote_b=item.get("conflicting_quote_b", ""),
                            explanation=item.get("explanation", "Opposing requirements detected."),
                            reconciliation_suggestion=item.get("reconciliation_suggestion", "Disambiguate operating modes.")
                        )
                    )

                return ConflictRadarResponse(
                    total_conflicts_found=len(conflicts),
                    conflicts=conflicts
                )
            except Exception as e:
                if attempt == 0:
                    logger.warning(f"Conflict Radar attempt 1 failed ({e}), retrying in 2s...")
                    await asyncio.sleep(2)
                    continue
                logger.error(f"Live Conflict Radar failed after retry: {e}")
                raise RuntimeError(f"Qualcomm AI100 Conflict Radar error: {e}") from e


    async def detect_project_conflicts(
        self,
        requirements: List[RequirementStatement]
    ) -> ConflictRadarResponse:
        """
        Evaluate all pairs in a project workspace for conflicts using Conflict Radar.
        """
        if len(requirements) < 2:
            return ConflictRadarResponse(total_conflicts_found=0, conflicts=[])

        all_conflicts: List[RequirementConflictCard] = []
        seen_pairs = set()

        for i, target in enumerate(requirements):
            candidates = requirements[i + 1:]
            if not candidates:
                continue
            res = await self.detect_conflicts(target, candidates)
            for c in res.conflicts:
                pair = (min(c.req_id_a, c.req_id_b), max(c.req_id_a, c.req_id_b))
                if pair not in seen_pairs:
                    seen_pairs.add(pair)
                    all_conflicts.append(c)

        return ConflictRadarResponse(
            total_conflicts_found=len(all_conflicts),
            conflicts=all_conflicts
        )

    def _mock_detect_conflicts(
        self,
        target_req: RequirementStatement,
        candidates: List[RequirementStatement]
    ) -> ConflictRadarResponse:
        conflicts: List[RequirementConflictCard] = []
        target_lower = target_req.text.lower()
        for c in candidates:
            c_lower = c.text.lower()
            if ("transmit" in target_lower and "no external" in c_lower) or ("transmit" in c_lower and "no external" in target_lower):
                conflicts.append(
                    RequirementConflictCard(
                        req_id_a=target_req.id,
                        req_id_b=c.id,
                        conflict_type="Direct Contradiction",
                        severity="BLOCKER",
                        conflicting_quote_a="transmit cloud telemetry" if "transmit" in target_lower else "no external network transmissions",
                        conflicting_quote_b="no external network transmissions" if "transmit" in target_lower else "transmit cloud telemetry",
                        explanation="Contradictory network behavior under the same normal operation context.",
                        reconciliation_suggestion="Define dedicated low-power or silent mode conditions separate from normal telemetry mode."
                    )
                )
        return ConflictRadarResponse(total_conflicts_found=len(conflicts), conflicts=conflicts)

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
                        rationale=t.get("rationale") or t.get("engineering_rationale") or "Standard engineering baseline",
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
            logger.error(f"Live Chat synthesis failed: {e}")
            raise RuntimeError(f"Qualcomm AI100 Chat synthesis error: {e}") from e

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
        return evidence_validator.validate_and_ground_cards(issues, req_text)

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

        if "broke" in lower or "toy" in lower:
            reqs = [
                RequirementStatement(
                    id=f"REQ-CHAT-{next_req_index:03d}",
                    text="The toy product shall have a unit Bill of Materials (BOM) manufacturing cost not exceeding [TBD: max_bom_unit_cost_usd] at a minimum initial production run of [TBD: min_production_batch_units].",
                    category="Cost & Manufacturing",
                    section="Section 1.0 - Unit Economics & Manufacturing",
                    status=RequirementStatus.FLAGGED_TBD,
                    rewrite_suggestion=RewriteSuggestion(
                        original=pm_message,
                        revised="The toy product shall have a unit Bill of Materials (BOM) manufacturing cost not exceeding [TBD: max_bom_unit_cost_usd] at a minimum initial production run of [TBD: min_production_batch_units].",
                        rationale="Derived from founder bootstrap constraints; enforces low-cost manufacturing ceiling.",
                        identified_tbds=[
                            TbdDefault(
                                parameter_name="max_bom_unit_cost_usd",
                                suggested_value="$5.00 USD",
                                rationale="Target bootstrap cost ceiling for low-budget hardware startup profitability.",
                                confidence="HIGH"
                            ),
                            TbdDefault(
                                parameter_name="min_production_batch_units",
                                suggested_value="500 units",
                                rationale="Typical minimum order quantity (MOQ) for initial low-risk prototyping production.",
                                confidence="MEDIUM"
                            )
                        ]
                    )
                ),
                RequirementStatement(
                    id=f"REQ-CHAT-{next_req_index+1:03d}",
                    text="The toy product shall be designed for and verified against the ergonomics and cognitive capabilities of users aged [TBD: target_demographic_min_age_years] to [TBD: target_demographic_max_age_years] years.",
                    category="Ergonomics & Demographics",
                    section="Section 2.0 - Target Demographic",
                    status=RequirementStatus.FLAGGED_TBD,
                    rewrite_suggestion=RewriteSuggestion(
                        original=pm_message,
                        revised="The toy product shall be designed for and verified against the ergonomics and cognitive capabilities of users aged [TBD: target_demographic_min_age_years] to [TBD: target_demographic_max_age_years] years.",
                        rationale="Target demographic specified in founder brief; bounds product ergonomics and complexity.",
                        identified_tbds=[
                            TbdDefault(
                                parameter_name="target_demographic_min_age_years",
                                suggested_value="10 years",
                                rationale="Lower bound of target youth demographic specified in PM brief.",
                                confidence="HIGH"
                            ),
                            TbdDefault(
                                parameter_name="target_demographic_max_age_years",
                                suggested_value="15 years",
                                rationale="Upper bound of target youth demographic specified in PM brief.",
                                confidence="HIGH"
                            )
                        ]
                    )
                ),
                RequirementStatement(
                    id=f"REQ-CHAT-{next_req_index+2:03d}",
                    text="The toy product shall comply with mandatory youth consumer product safety regulations in accordance with [TBD: toy_safety_standard] and withstand a drop impact from [TBD: drop_test_height_meters] without producing sharp edges or hazardous fragments.",
                    category="Safety & Compliance",
                    section="Section 3.0 - Consumer Safety & Compliance",
                    status=RequirementStatus.FLAGGED_TBD,
                    rewrite_suggestion=RewriteSuggestion(
                        original=pm_message,
                        revised="The toy product shall comply with mandatory youth consumer product safety regulations in accordance with [TBD: toy_safety_standard] and withstand a drop impact from [TBD: drop_test_height_meters] without producing sharp edges or hazardous fragments.",
                        rationale="Mandatory regulatory safety baseline for consumer toys to prevent injury and recall liability.",
                        identified_tbds=[
                            TbdDefault(
                                parameter_name="toy_safety_standard",
                                suggested_value="ASTM F963 / 16 CFR 1500",
                                rationale="Standard consumer safety specification for toy safety.",
                                confidence="HIGH"
                            ),
                            TbdDefault(
                                parameter_name="drop_test_height_meters",
                                suggested_value="1.5 m",
                                rationale="Standard ASTM youth toy drop impact test height onto concrete surface.",
                                confidence="HIGH"
                            )
                        ]
                    )
                )
            ]
            agent_reply = (
                "I analyzed your bootstrap brief: launching a toy product for 10–15 year olds on a minimal/broke budget. "
                "Because your idea is early-stage with strict capital limits, I decomposed it into 3 atomic, formal EARS requirements: "
                "(1) Unit BOM cost ceiling to protect your bootstrap runway, "
                "(2) Target demographic age range (10–15 years) for ergonomic and complexity bounding, and "
                "(3) Mandatory consumer toy safety compliance (ASTM F963) and drop impact durability. "
                "All unconfirmed cost limits, batch sizes, and test heights are strictly preserved as `[TBD]` with Smart Suggested Defaults."
            )
            grounding = "Grounded in Lean Hardware Startup & Consumer Toy Safety Standards (ASTM F963 / ISO/IEC/IEEE 29148)."
            return agent_reply, reqs, grounding

        if "chip" in lower and any(k in lower for k in ["distribution", "distribute", "execute", "execution", "mobile"]):
            reqs = [
                RequirementStatement(
                    id=f"REQ-CHAT-{next_req_index:03d}",
                    text="The chip distribution orchestrator shall deliver cryptographically signed firmware packages to target mobile chipsets within [TBD: max_distribution_window_seconds] via [TBD: supported_transport_protocols].",
                    category="Distribution & OTA",
                    section="Section 1.0 - Chip Package Distribution",
                    status=RequirementStatus.FLAGGED_TBD,
                    rewrite_suggestion=RewriteSuggestion(
                        original=pm_message,
                        revised="The chip distribution orchestrator shall deliver cryptographically signed firmware packages to target mobile chipsets within [TBD: max_distribution_window_seconds] via [TBD: supported_transport_protocols].",
                        rationale="Derived from mobile chipset distribution brief; bounds OTA transport latency and secure transport protocol.",
                        identified_tbds=[
                            TbdDefault(
                                parameter_name="max_distribution_window_seconds",
                                suggested_value="180 seconds",
                                rationale="Cellular network OTA timeout budget for mobile chip flash packages.",
                                confidence="HIGH"
                            ),
                            TbdDefault(
                                parameter_name="supported_transport_protocols",
                                suggested_value="HTTPS / CoAP with TLS 1.3",
                                rationale="Secure mobile transport protocol standard for silicon device fleet management.",
                                confidence="HIGH"
                            )
                        ]
                    )
                ),
                RequirementStatement(
                    id=f"REQ-CHAT-{next_req_index+1:03d}",
                    text="When a verified binary payload is received, the mobile chip execution engine shall complete binary loading and execute target tasks within [TBD: max_execution_latency_ms] without exceeding junction thermal limit of [TBD: max_junction_temp_degC].",
                    category="Execution & Silicon Safety",
                    section="Section 2.0 - On-Chip Execution Runtime",
                    status=RequirementStatus.FLAGGED_TBD,
                    rewrite_suggestion=RewriteSuggestion(
                        original=pm_message,
                        revised="When a verified binary payload is received, the mobile chip execution engine shall complete binary loading and execute target tasks within [TBD: max_execution_latency_ms] without exceeding junction thermal limit of [TBD: max_junction_temp_degC].",
                        rationale="Controls on-chip execution latency while preventing silicon thermal throttling.",
                        identified_tbds=[
                            TbdDefault(
                                parameter_name="max_execution_latency_ms",
                                suggested_value="1200 ms",
                                rationale="Snapdragon/ARM mobile SoC cold-launch execution budget for dynamic firmware modules.",
                                confidence="HIGH"
                            ),
                            TbdDefault(
                                parameter_name="max_junction_temp_degC",
                                suggested_value="85 °C",
                                rationale="Nominal mobile silicon maximum junction thermal budget under sustained compute workload.",
                                confidence="HIGH"
                            )
                        ]
                    )
                ),
                RequirementStatement(
                    id=f"REQ-CHAT-{next_req_index+2:03d}",
                    text="If binary signature validation or runtime execution fails on the mobile chip, the system shall abort execution and revert to the golden boot partition within [TBD: max_rollback_latency_ms].",
                    category="Resilience & Rollback",
                    section="Section 3.0 - Failsafe Recovery",
                    status=RequirementStatus.FLAGGED_TBD,
                    rewrite_suggestion=RewriteSuggestion(
                        original=pm_message,
                        revised="If binary signature validation or runtime execution fails on the mobile chip, the system shall abort execution and revert to the golden boot partition within [TBD: max_rollback_latency_ms].",
                        rationale="Prevents bricking silicon devices during field distribution; enforces dual-bank fallback.",
                        identified_tbds=[
                            TbdDefault(
                                parameter_name="max_rollback_latency_ms",
                                suggested_value="500 ms",
                                rationale="Hardware watchdog A/B partition failover timeout budget.",
                                confidence="HIGH"
                            )
                        ]
                    )
                )
            ]
            agent_reply = (
                "I analyzed your request to build software for mobile chip package distribution and on-device execution. "
                "Because deploying and executing code on mobile silicon demands strict transport reliability, thermal safety boundaries, and anti-bricking recovery, "
                "I decomposed your concept into 3 atomic EARS requirements: (1) Secure package distribution across mobile chip targets, "
                "(2) On-chip execution latency bound with silicon junction thermal limits, and (3) Automated cryptographic verification and failsafe partition rollback. "
                "All operational parameters are isolated as `[TBD]` placeholders with Qualcomm/Snapdragon silicon engineering defaults."
            )
            grounding = "Grounded in Mobile Silicon Architecture & Secure Firmware OTA Standards (Qualcomm Snapdragon / ARM TrustZone / ISO/IEC/IEEE 29148)."
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
