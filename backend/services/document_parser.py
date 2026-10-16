import re
import csv
import io
from typing import List, Tuple
from pypdf import PdfReader
from backend.models.schemas import RequirementStatement, RequirementStatus


class DocumentParser:
    """
    Robust ingestion parser for requirement specifications.
    Extracts atomic requirement statements from Raw Text, Numbered Lists, CSV, TXT, and PDF.
    """

    @staticmethod
    def parse_text(text: str, default_category: str = "Functional") -> Tuple[List[RequirementStatement], str]:
        """
        Parses pasted text or plain string input.
        Detects requirement patterns:
        - Pattern 1: Explicit labels e.g. 'REQ-001: The system shall...'
        - Pattern 2: Numbered lists e.g. '1. The system shall...' or '1) The system shall...'
        - Pattern 3: Bullet points or line-by-line 'The system shall...'
        - Fallback: Paragraph splitting
        """
        clean_text = text.strip()
        if not clean_text:
            return [], "empty"

        requirements: List[RequirementStatement] = []

        # 1. Check for explicit REQ tags (e.g., REQ-01, REQ_001, REQ-MED-01, SYS-REQ-02)
        req_pattern = re.compile(
            r'(?:\[?((?:REQ|SYS|SPEC|SRS)[-_]?[A-Za-z0-9_-]*\d+)\]?[:\.\s]+)(.+?)(?=(?:\[?(?:REQ|SYS|SPEC|SRS)[-_]?[A-Za-z0-9_-]*\d+\]?[:\.\s]+)|\Z)',
            re.IGNORECASE | re.DOTALL
        )
        matches = req_pattern.findall(clean_text)
        if matches and len(matches) >= 1:
            for tag, body in matches:
                req_text = body.strip().replace("\n", " ")
                if req_text:
                    requirements.append(
                        RequirementStatement(
                            id=tag.upper(),
                            text=req_text,
                            category=default_category,
                            status=RequirementStatus.DRAFT
                        )
                    )
            return requirements, "req_tags"

        # 2. Check for numbered lists (e.g., "1. The system...", "1) The system...")
        numbered_pattern = re.compile(
            r'(?:^|\n)\s*(?:\d+[\.\)])\s*(.+?)(?=(?:\n\s*\d+[\.\)])|\Z)',
            re.DOTALL
        )
        numbered_matches = numbered_pattern.findall(clean_text)
        if numbered_matches and len(numbered_matches) > 1:
            for idx, body in enumerate(numbered_matches, start=1):
                req_text = body.strip().replace("\n", " ")
                if req_text:
                    requirements.append(
                        RequirementStatement(
                            id=f"REQ-{idx:03d}",
                            text=req_text,
                            category=default_category,
                            status=RequirementStatus.DRAFT
                        )
                    )
            return requirements, "numbered_list"

        # 3. Check for lines containing modal verbs or bullet points
        lines = [line.strip().lstrip("-*•> ") for line in clean_text.splitlines() if line.strip()]
        valid_lines = [l for l in lines if len(l) > 15]

        if valid_lines:
            for idx, line in enumerate(valid_lines, start=1):
                requirements.append(
                    RequirementStatement(
                        id=f"REQ-{idx:03d}",
                        text=line,
                        category=default_category,
                        status=RequirementStatus.DRAFT
                    )
                )
            return requirements, "line_delimited"

        # Fallback: single requirement
        requirements.append(
            RequirementStatement(
                id="REQ-001",
                text=clean_text,
                category=default_category,
                status=RequirementStatus.DRAFT
            )
        )
        return requirements, "single_block"

    @staticmethod
    def parse_csv(content_bytes: bytes, default_category: str = "Functional") -> List[RequirementStatement]:
        """
        Parses CSV data containing requirement records.
        Dynamically detects ID, text, category, and section columns.
        """
        text_stream = io.StringIO(content_bytes.decode("utf-8", errors="replace"))
        reader = csv.DictReader(text_stream)

        # Normalize column names for flexible matching
        if not reader.fieldnames:
            return []

        field_map = {name.lower().strip(): name for name in reader.fieldnames}
        id_col = next((field_map[k] for k in ["id", "req_id", "req id", "key", "identifier"] if k in field_map), None)
        text_col = next((field_map[k] for k in ["text", "requirement", "description", "statement", "summary", "req_text"] if k in field_map), None)
        cat_col = next((field_map[k] for k in ["category", "type", "module", "component"] if k in field_map), None)
        sec_col = next((field_map[k] for k in ["section", "source", "document", "chapter"] if k in field_map), None)

        requirements: List[RequirementStatement] = []
        for idx, row in enumerate(reader, start=1):
            req_text = (row.get(text_col) or "").strip() if text_col else ""
            if not req_text:
                # If no explicit text column matched, concatenate row values
                req_text = " ".join([v for v in row.values() if v and len(v) > 10]).strip()

            if not req_text:
                continue

            req_id = (row.get(id_col) or "").strip() if id_col else f"REQ-{idx:03d}"
            category = (row.get(cat_col) or "").strip() if cat_col else default_category
            section = (row.get(sec_col) or "").strip() if sec_col else None

            requirements.append(
                RequirementStatement(
                    id=req_id,
                    text=req_text,
                    category=category,
                    section=section,
                    status=RequirementStatus.DRAFT
                )
            )

        return requirements

    @staticmethod
    def parse_pdf(content_bytes: bytes, default_category: str = "Functional") -> Tuple[List[RequirementStatement], str]:
        """
        Extracts textual content from a PDF document and parses requirement statements.
        """
        stream = io.BytesIO(content_bytes)
        reader = PdfReader(stream)
        extracted_pages = []

        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                extracted_pages.append(page_text)

        full_text = "\n".join(extracted_pages)
        requirements, format_detected = DocumentParser.parse_text(full_text, default_category=default_category)
        return requirements, f"pdf_{format_detected}"
