import pytest
import asyncio
from backend.services.qualcomm_service import QualcommService
from backend.services.storage import store
from backend.models.schemas import RequirementStatement, RequirementStatus


@pytest.fixture(scope="module")
def live_service():
    """Strictly live Qualcomm Cloud AI 100 client with zero mocks."""
    return QualcommService(mock_mode=False)


def test_live_ping_and_hardware_status(live_service):
    """Verify live Cirrascale Qualcomm AI 100 cluster connectivity."""
    async def run():
        ping = await live_service.ping()
        assert ping["status"] == "ok"
        assert ping["mode"] == "live"
        assert "pong" in ping["message"].lower()

    asyncio.run(run())


def test_live_embeddings_bge_large(live_service):
    """Verify live 1024-dim dense vector generation via BAAI/bge-large-en-v1.5."""
    async def run():
        texts = [
            "The BMS shall transmit pack telemetry every 50ms.",
            "The telemetry module shall periodically broadcast battery metrics."
        ]
        try:
            embs = await live_service.generate_embeddings(texts)
            assert len(embs) == 2
            assert len(embs[0]) == 1024
            assert len(embs[1]) == 1024
        except RuntimeError as e:
            if "name resolution" in str(e).lower() or "connect" in str(e).lower():
                pytest.skip(f"Cirrascale AI100 cluster unreachable from current network: {e}")
            raise

    asyncio.run(run())


def test_live_xray_flaw_extraction(live_service):
    """Verify live defect extraction and quote grounding on Llama-3.3-70B."""
    async def run():
        req_text = "The battery management system shall periodically transmit telemetry data as appropriate."
        cards = await live_service.extract_xray_issues(req_text)
        assert len(cards) > 0
        grounded_quotes = [c.evidence_quote for c in cards if c.evidence_quote and c.evidence_quote in req_text]
        assert len(grounded_quotes) > 0

    asyncio.run(run())


def test_live_interpretation_duel(live_service):
    """Verify live duel staging on Llama-3.1-8B."""
    async def run():
        req_text = "The IoT sensor gateway shall buffer reading samples where feasible."
        duel = await live_service.stage_interpretation_duel(req_text)
        assert duel.card_a is not None
        assert duel.card_b is not None
        assert duel.card_a.title != duel.card_b.title
        assert len(duel.card_a.technical_spec) > 5
        assert len(duel.card_b.technical_spec) > 5

    asyncio.run(run())


def test_live_smart_rewriter_zero_fabrication(live_service):
    """Verify live zero-fabrication EARS rewrite strictly preserving [TBD: ...] tokens on Llama-3.3-70B."""
    async def run():
        req_text = "The thermal management module should quickly reduce power consumption if temperature is critical."
        suggestion = await live_service.rewrite_with_smart_defaults(req_text)
        assert "[TBD:" in suggestion.revised
        assert len(suggestion.identified_tbds) > 0
        for tbd in suggestion.identified_tbds:
            assert len(tbd.parameter_name) > 0
            assert len(tbd.suggested_value) > 0

    asyncio.run(run())


def test_live_verification_blueprint(live_service):
    """Verify live audit-ready test case generation on Llama-3.3-70B."""
    async def run():
        req_text = "The BMS shall disconnect high-voltage within [TBD: disconnect_time_ms] when overcurrent is detected."
        bp = await live_service.generate_verification_blueprint(req_text)
        assert bp.verification_method in ["Test", "Demonstration", "Inspection", "Analysis"]
        assert len(bp.positive_test_case.stimulus) > 0
        assert len(bp.negative_boundary_test_case.stimulus) > 0
        assert "PASS" in bp.acceptance_criteria
        assert "FAIL" in bp.acceptance_criteria

    asyncio.run(run())


def test_live_chat_copilot_grounded(live_service):
    """Verify live Conversational Copilot grounded in project context on Llama-3.3-70B with SQLite persistence."""
    async def run():
        project_context = (
            "Project: Next-Gen 800V EV BMS\n"
            "Domain: Automotive Systems (ISO 26262 / ASIL-D)\n"
            "Description: Silicon carbide inverter and thermal loop.\n\n"
            "Documents:\n"
            "[BMS Architectural Charter]: Maximum pack surface temperature allowed during DC fast charging is 55°C. "
            "Contactor opening time must not exceed 10ms upon crash signal."
        )
        pm_thought = "When the battery gets too hot while fast charging, turn on the coolant pump and warn the driver."
        
        agent_reply, reqs, grounding = await live_service.generate_requirements_from_chat(
            pm_message=pm_thought,
            project_context=project_context,
            conversation_history=[],
            next_req_index=100
        )
        
        assert len(agent_reply) > 10
        assert len(reqs) > 0
        for r in reqs:
            assert "shall" in r.text.lower()
            # Verify persistence directly into SQLite
            store.upsert(r, project_id="proj-live-test")
            saved = store.get_by_id(r.id, project_id="proj-live-test")
            assert saved is not None
            assert saved.text == r.text

        store.delete_project("proj-live-test")

    asyncio.run(run())
