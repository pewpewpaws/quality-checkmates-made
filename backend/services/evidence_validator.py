"""
Evidence Validator: Verbatim Substring Grounding & Character Span Extractor.

Guarantees 100% evidence grounding outside the LLM:
1. Validates that `evidence_quote` is an exact, case-sensitive substring of the source text.
2. If slightly misaligned (e.g., surrounding punctuation or case differences), resolves to exact source slice.
3. Computes 0-indexed character offsets (start_offset, end_offset) for 1-click UI highlighting.
4. Rejects or flags ungrounded/hallucinated quotes.
"""

from typing import Tuple, Optional, List
import re
from backend.models.schemas import IssueCard


class EvidenceValidator:
    """
    Deterministic evidence quote verification and bounding offset extraction.
    """

    @staticmethod
    def locate_substring(source_text: str, quote: str) -> Tuple[bool, str, Optional[int], Optional[int]]:
        """
        Locate quote in source_text.
        Returns: (is_grounded, aligned_quote, start_offset, end_offset)
        """
        if not source_text or not quote:
            return False, quote, None, None

        # 1. Exact case-sensitive match
        idx = source_text.find(quote)
        if idx != -1:
            return True, quote, idx, idx + len(quote)

        # 2. Trimmed whitespace / quotes match
        stripped_quote = quote.strip(" '\"`.,;:")
        if stripped_quote:
            idx = source_text.find(stripped_quote)
            if idx != -1:
                return True, stripped_quote, idx, idx + len(stripped_quote)

        # 3. Case-insensitive exact match
        lower_source = source_text.lower()
        lower_quote = quote.lower().strip()
        idx = lower_source.find(lower_quote)
        if idx != -1:
            aligned = source_text[idx : idx + len(lower_quote)]
            return True, aligned, idx, idx + len(lower_quote)

        # 4. Normalized whitespace match (collapse multiple spaces/newlines)
        norm_source_tokens = source_text.split()
        norm_quote_tokens = quote.split()
        if norm_quote_tokens:
            q_pat = r"\s+".join(re.escape(tok) for tok in norm_quote_tokens)
            match = re.search(q_pat, source_text, re.IGNORECASE)
            if match:
                start, end = match.span()
                return True, source_text[start:end], start, end

        # 5. Fallback: ungrounded
        return False, quote, None, None

    @classmethod
    def validate_card(cls, card: IssueCard, source_text: str, strict: bool = False) -> IssueCard:
        """
        Validate and align an IssueCard's evidence_quote against source_text.
        If not grounded and strict=True, raises ValueError.
        """
        is_grounded, aligned_quote, start, end = cls.locate_substring(source_text, card.evidence_quote)
        if not is_grounded:
            if strict:
                raise ValueError(f"Ungrounded evidence quote '{card.evidence_quote}' not found in source text.")
            card.start_offset = None
            card.end_offset = None
            card.is_grounded = False
            return card

        card.evidence_quote = aligned_quote
        card.start_offset = start
        card.end_offset = end
        card.is_grounded = True
        return card

    @classmethod
    def validate_and_ground_cards(
        cls, cards: List[IssueCard], source_text: str, reject_ungrounded: bool = False
    ) -> List[IssueCard]:
        """
        Validate an array of issue cards, enriching each with verified offsets.
        """
        validated: List[IssueCard] = []
        for card in cards:
            c = cls.validate_card(card, source_text, strict=False)
            if reject_ungrounded and not getattr(c, "is_grounded", True):
                continue
            validated.append(c)
        return validated


evidence_validator = EvidenceValidator()
