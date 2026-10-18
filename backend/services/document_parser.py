import re
import csv
import io
from typing import List, Tuple, Optional
from pypdf import PdfReader
from backend.models.schemas import RequirementStatement, RequirementStatus

MODAL_PATTERN = re.compile(
    r'\b(shall|should|must|will|needs to|is required to|are required to)\b',
    re.IGNORECASE
)

METADATA_PREFIXES = (
    'author:', 'author', 'date:', 'date', 'version:', 'version', 'status:', 'status',
    'target release:', 'target release', 'overview:', 'overview', 'scope:', 'scope',
    'title:', 'title', 'document:', 'attendees:', 'reviewed by:'
)


PUA_REPLACEMENTS = {
    '\uE072': '(1)', '\uE073': '(2)', '\uE074': '(3)', '\uE075': '(4)', '\uE076': '(5)', '\uE077': '(6)',
    '\uE052': ' ', '\uE054': ' ', '\uE092': ' ',
    '⚔': ' ', '▼': ' ', '►': ' ', '│': ' ', '─': ' ', '┌': ' ', '└': ' ',
}

NON_REQUIREMENT_COMMENTARY = re.compile(
    r'^(?:What the tool does|The Problem it solves|How it looks on UI|Tool \d|Card [A-Z]|Everyone knows|Non-Verifiable|Overview|Background|Note|Note:|Table of Contents|Figure \d|Table \d)\b',
    re.IGNORECASE
)


class DocumentParser:
    """
    Enterprise-grade ingestion parser for requirement specifications.
    Extracts atomic requirements from:
    1. Explicit tags (REQ-001, SYS-REQ-02)
    2. Markdown tables (| Component | Obligation |)
    3. Numbered lists (1. The system shall...)
    4. Bulleted lists (- The system must..., * The device should...)
    5. Unnumbered narrative prose / paragraphs (split on sentence boundaries with modal verbs)
    6. CSV and PDF files (with or without IDs)
    """

    @classmethod
    def sanitize_text(cls, text: str) -> str:
        # Strip common PDF export footers/headers and print artifacts
        clean = re.sub(r'\d{1,2}/\d{1,2}/\d{2,4},\s*\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?\s*Markdown to PDF[^\n]*', '', text, flags=re.IGNORECASE)
        clean = re.sub(r'https?://(?:markdownlivepreview\.dev|localhost|\S+/\S+)\s*\d+/\d+', '', clean, flags=re.IGNORECASE)
        
        # Replace known PUA circled numbers and diagram symbols
        for char, rep in PUA_REPLACEMENTS.items():
            clean = clean.replace(char, rep)
            
        # Strip remaining Private Use Area characters
        clean = re.sub(r'[\uE000-\uF8FF]', '', clean)
        
        # Normalize bullets
        clean = re.sub(r'[\x7f\u2022\u2023\u25e6\u2043\u2219\uf0b7]', '- ', clean)
        clean = re.sub(r'[ \t]+', ' ', clean)
        return clean.strip()

    @classmethod
    def extract_requirement_statement(cls, candidate: str) -> Optional[str]:
        stmt = candidate.strip().replace('\n', ' ')
        if len(stmt) < 15:
            return None
        if re.search(r'[│▼──────►]{2,}', stmt):
            return None
            
        # Check if author commentary has a quoted requirement inside:
        # e.g.: The Problem it solves: Engineers write things like "The system shall process packets quickly..."
        quoted = re.search(r'["\u201c]([^"\u201d\n]*?\b(?:shall|should|must|will)\b[^"\u201d\n]*)["\u201d]', stmt, re.IGNORECASE)
        if quoted:
            return quoted.group(1).strip()
            
        if NON_REQUIREMENT_COMMENTARY.search(stmt):
            return None

        # A true requirement must contain an engineering modal verb
        if not MODAL_PATTERN.search(stmt):
            return None

        return stmt

    @classmethod
    def parse_text(cls, text: str, default_category: str = "Functional") -> Tuple[List[RequirementStatement], str]:
        clean_text = cls.sanitize_text(text)
        if not clean_text:
            return [], "empty"

        requirements: List[RequirementStatement] = []

        # 1. Explicit REQ tags (e.g. REQ-01, REQ_001, REQ-MED-01, SYS-REQ-02)
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

        # 2. Markdown Tables (| Col 1 | Col 2 |)
        table_lines = [l.strip() for l in clean_text.splitlines() if l.strip().startswith('|') and l.strip().endswith('|')]
        if len(table_lines) >= 2:
            header_cols = [c.strip().lower() for c in table_lines[0].split('|')[1:-1]]
            start_row = 1
            if len(table_lines) >= 3 and ('---' in table_lines[1] or '-|-' in table_lines[1]):
                start_row = 2
            req_col_idx = next(
                (i for i, h in enumerate(header_cols) if any(k in h for k in ["requirement", "statement", "description", "obligation", "text"])),
                1 if len(header_cols) > 1 else 0
            )
            cat_col_idx = next(
                (i for i, h in enumerate(header_cols) if any(k in h for k in ["component", "module", "category", "subsystem"])),
                None
            )
            for idx, line in enumerate(table_lines[start_row:], start=1):
                cols = [c.strip() for c in line.split('|')[1:-1]]
                if len(cols) > req_col_idx:
                    statement_text = cols[req_col_idx]
                    cat = cols[cat_col_idx] if (cat_col_idx is not None and len(cols) > cat_col_idx) else default_category
                    if len(statement_text) > 10:
                        requirements.append(
                            RequirementStatement(
                                id=f"REQ-{idx:03d}",
                                text=statement_text,
                                category=cat,
                                status=RequirementStatus.DRAFT
                            )
                        )
            if requirements:
                return requirements, "markdown_table"

        # 3. Numbered lists (e.g. "1. The system...", "1) The system...")
        numbered_pattern = re.compile(
            r'(?:^|\n)\s*(?:\d+[\.\)])\s*(.+?)(?=(?:\n\s*\d+[\.\)])|\Z)',
            re.DOTALL
        )
        numbered_matches = numbered_pattern.findall(clean_text)
        if numbered_matches and len(numbered_matches) > 1:
            valid_stmts = []
            for body in numbered_matches:
                stmt = cls.extract_requirement_statement(body)
                if stmt:
                    valid_stmts.append(stmt)
            if valid_stmts:
                for idx, stmt in enumerate(valid_stmts, start=1):
                    requirements.append(
                        RequirementStatement(
                            id=f"REQ-{idx:03d}",
                            text=stmt,
                            category=default_category,
                            status=RequirementStatus.DRAFT
                        )
                    )
                return requirements, "numbered_list"

        # 4. Bullet points (e.g. "- The system...", "* The device...", "• ...")
        bullet_lines = []
        for line in clean_text.splitlines():
            sline = line.strip()
            if sline.startswith(('-', '*', '•', '>')):
                cleaned_line = sline.lstrip('-*•> ').strip()
                stmt = cls.extract_requirement_statement(cleaned_line)
                if stmt:
                    bullet_lines.append(stmt)

        if len(bullet_lines) >= 1:
            for idx, line in enumerate(bullet_lines, start=1):
                requirements.append(
                    RequirementStatement(
                        id=f"REQ-{idx:03d}",
                        text=line,
                        category=default_category,
                        status=RequirementStatus.DRAFT
                    )
                )
            return requirements, "bulleted_list"

        # 5. Narrative Prose Paragraphs (detect requirement sentences by modal verbs)
        paragraphs = [p.strip() for p in clean_text.split('\n\n') if p.strip()]
        narrative_reqs = []
        for p in paragraphs:
            if p.startswith('#') or p.lower().startswith(METADATA_PREFIXES):
                continue
            
            sentences = re.split(r'(?<=[.!?])\s+(?=[A-Z])', p.replace('\n', ' '))
            for s in sentences:
                stmt = cls.extract_requirement_statement(s)
                if stmt:
                    narrative_reqs.append(stmt)

        if narrative_reqs:
            for idx, stmt in enumerate(narrative_reqs, start=1):
                requirements.append(
                    RequirementStatement(
                        id=f"REQ-{idx:03d}",
                        text=stmt,
                        category=default_category,
                        status=RequirementStatus.DRAFT
                    )
                )
            return requirements, "narrative_prose"

        # 6. Fallback: line-delimited valid lines with modal checks
        lines = [line.strip().lstrip("-*•> ") for line in clean_text.splitlines() if line.strip()]
        valid_lines = []
        for l in lines:
            if not l.startswith('#') and not l.lower().startswith(METADATA_PREFIXES):
                stmt = cls.extract_requirement_statement(l)
                if stmt:
                    valid_lines.append(stmt)

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


        # Final Fallback: single requirement block
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
        Supports CSVs with or without ID columns.
        """
        text_stream = io.StringIO(content_bytes.decode("utf-8", errors="replace"))
        reader = csv.DictReader(text_stream)

        if not reader.fieldnames:
            return []

        field_map = {name.lower().strip(): name for name in reader.fieldnames}
        id_col = next((field_map[k] for k in ["id", "req_id", "req id", "requirement_id", "requirement id", "key", "identifier", "issue key"] if k in field_map), None)
        text_col = next((field_map[k] for k in ["text", "requirement", "description", "statement", "summary", "req_text", "obligation"] if k in field_map), None)
        cat_col = next((field_map[k] for k in ["category", "type", "module", "component", "subsystem"] if k in field_map), None)
        sec_col = next((field_map[k] for k in ["section", "source", "document", "chapter", "epic"] if k in field_map), None)

        requirements: List[RequirementStatement] = []
        for idx, row in enumerate(reader, start=1):
            req_text = (row.get(text_col) or "").strip() if text_col else ""
            if not req_text:
                req_text = " ".join([v for v in row.values() if v and len(v) > 10]).strip()

            if not req_text or len(req_text) < 10:
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
        Handles both numbered and unnumbered PDF documents.
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
