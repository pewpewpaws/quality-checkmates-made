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
