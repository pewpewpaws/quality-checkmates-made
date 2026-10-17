import io
from backend.services.document_parser import DocumentParser


def test_parse_numbered_list():
    raw_text = """
    1. The battery controller shall monitor cell voltages every 50ms.
    2. The system shall disconnect high-voltage contactors if over-temperature is detected.
    3. The gateway shall upload logs periodically.
    """
    reqs, fmt = DocumentParser.parse_text(raw_text)
    assert fmt == "numbered_list"
    assert len(reqs) == 3
    assert reqs[0].id == "REQ-001"
    assert "battery controller" in reqs[0].text


def test_parse_explicit_req_tags():
    raw_text = """
    REQ-01: The system shall boot within 5 seconds.
    REQ-02: The system shall report diagnostic faults.
    """
    reqs, fmt = DocumentParser.parse_text(raw_text)
    assert fmt == "req_tags"
    assert len(reqs) == 2
    assert reqs[0].id == "REQ-01"


def test_parse_csv():
    csv_content = b"""id,requirement,category
REQ-101,The vehicle shall engage brake assist on obstacle detection,ADAS
REQ-102,The radar shall calibrate antenna gain,Sensors
"""
    reqs = DocumentParser.parse_csv(csv_content)
    assert len(reqs) == 2
    assert reqs[0].id == "REQ-101"
    assert reqs[0].category == "ADAS"
    assert "brake assist" in reqs[0].text


def test_reject_tool_commentary_and_sanitize_glyphs():
    commentary_text = """
    1. The Problem it solves: Engineers write vague things like "The system shall process packets quickly under normal conditions".
    2. Non-Verifiable: Can't write a pass/fail test for it.
    3. How it looks on UI: Highlights "quickly" in red on the screen ⚔ Tool 2 The Interpretation Duel.
    4. Everyone knows what I mean." What the tool does: Card A (The Real-Time / Aggressive Stance): "Process packets within 10ms as an interrupt".
    5. What the tool does: Takes the requirement and generates an audit-ready test blueprint:  Verification Method.
    6. The battery management system shall periodically transmit telemetry data to the central cloud repository as appropriate.
    """
    reqs, fmt = DocumentParser.parse_text(commentary_text)
    
    # Non-requirements (items 2, 3, 5) must be rejected
    # Author commentary with quotes (item 1) extracts the quoted requirement
    # Item 6 is a valid requirement statement
    assert len(reqs) >= 2
    assert any("The system shall process packets quickly under normal conditions" in r.text for r in reqs)
    assert any("The battery management system shall periodically transmit" in r.text for r in reqs)
    
    # Ensure no diagram symbols or PUA unicode glyphs leaked into the extracted text
    for r in reqs:
        assert "⚔" not in r.text
        assert "" not in r.text
        assert "" not in r.text
        assert "What the tool does:" not in r.text

