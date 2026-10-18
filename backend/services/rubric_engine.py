"""
Deterministic 100-Point Rubric Scoring Engine outside the LLM.

Calculates mathematically grounded, itemized quality scores across 5 dimensions:
1. Clarity (0-25 pts)
2. Verifiability (0-25 pts)
3. Completeness (0-20 pts)
4. Atomicity (0-15 pts)
5. Consistency (0-15 pts)

Includes complete auditable deduction receipts.
"""

from typing import List, Optional, Tuple
import re
from backend.models.schemas import (
    QualityScore,
    IssueCard,
    RequirementConflictCard,
    RequirementStatement
)
from backend.services.evidence_validator import evidence_validator


# Regular expression lexicons for deterministic heuristics
SUBJECTIVE_TERMS_REGEX = re.compile(
    r"\b(fast|faster|quick|quickly|rapid|rapidly|slow|slowly|robust|scalable|flexible|seamless|seamlessly|"
    r"user-friendly|efficient|efficiently|high-performance|optimal|optimally|intuitive|adequate|adequately|"
    r"instantaneous|instantaneously|easy|easily|appropriate|appropriately|sufficient|sufficiently|clean|clever|"
    r"reliable|reliably)\b",
    re.IGNORECASE
)

ESCAPE_HATCHES_REGEX = re.compile(
    r"\b(as needed|if possible|where feasible|as appropriate|when practical|to the extent possible|"
    r"etc|etc\.|and so on|as required)\b",
    re.IGNORECASE
)

UNTESTABLE_SUPERLATIVES_REGEX = re.compile(
    r"\b(100%|zero bug|bug-free|infinite|infinitely|completely secure|unhackable|indestructible|"
    r"perfect|bulletproof|faultless|normal conditions|standard temperature|room temperature)\b",
    re.IGNORECASE
)

METRIC_WORDS_WITHOUT_NUMBER_REGEX = re.compile(
    r"\b(latency|delay|throughput|bandwidth|temperature|voltage|current|pressure|duration|frequency)\b",
    re.IGNORECASE
)

ACTION_WITHOUT_CONDITION_REGEX = re.compile(
    r"\b(disconnect|shut down|shutdown|alert|trigger|switch off|switch on|activate|abort|cut off)\b",
    re.IGNORECASE
)

CONDITION_TRIGGERS_REGEX = re.compile(
    r"\b(when|if|while|during|upon|in the event of|where|after)\b",
    re.IGNORECASE
)

MODAL_VERBS_REGEX = re.compile(r"\b(shall|must|should|will)\b", re.IGNORECASE)
COMPOUND_CONJUNCTIONS_REGEX = re.compile(r"\b(and also|as well as|in addition to)\b", re.IGNORECASE)
TBD_PATTERN_REGEX = re.compile(r"\[TBD:[^\]]+\]", re.IGNORECASE)


class RubricScoringEngine:
    """
    Deterministic scoring engine evaluating requirements against IEEE 830 / ISO 29148 standards.
    """

    MAX_CLARITY = 25.0
    MAX_VERIFIABILITY = 25.0
    MAX_COMPLETENESS = 20.0
    MAX_ATOMICITY = 15.0
    MAX_CONSISTENCY = 15.0

    def calculate_score(
        self,
        text: str,
        issues: Optional[List[IssueCard]] = None,
        conflicts: Optional[List[RequirementConflictCard]] = None,
    ) -> QualityScore:
        """
        Compute deterministic quality score with itemized receipts.
        """
        text = text.strip() if text else ""
        receipt: List[str] = ["[Baseline Budget] Initial quality allocation: 100.0 pts"]

        # Ensure all incoming issues and conflicts are robustly normalized and validated
        normalized_issues = [
            IssueCard.model_validate(i) if isinstance(i, dict) else i
            for i in (issues or [])
        ]
        grounded_issues = evidence_validator.validate_and_ground_cards(normalized_issues, text)

        normalized_conflicts = [
            RequirementConflictCard.model_validate(c) if isinstance(c, dict) else c
            for c in (conflicts or [])
        ]
        conflicts = normalized_conflicts

        # 1. Clarity (Max 25 pts)
        clarity, clarity_receipt = self._score_clarity(text, grounded_issues)
        receipt.extend(clarity_receipt)

        # 2. Verifiability (Max 25 pts)
        verifiability, verifiability_receipt = self._score_verifiability(text, grounded_issues)
        receipt.extend(verifiability_receipt)

        # 3. Completeness (Max 20 pts)
        completeness, completeness_receipt = self._score_completeness(text, grounded_issues)
        receipt.extend(completeness_receipt)

        # 4. Atomicity (Max 15 pts)
        atomicity, atomicity_receipt = self._score_atomicity(text, grounded_issues)
        receipt.extend(atomicity_receipt)

        # 5. Consistency (Max 15 pts)
        consistency, consistency_receipt = self._score_consistency(text, grounded_issues, conflicts)
        receipt.extend(consistency_receipt)

        overall = round(clarity + verifiability + completeness + atomicity + consistency, 1)
        overall = max(0.0, min(100.0, overall))

        receipt.append(
            f"[Summary] Clarity: {clarity:.1f}/25 | Verifiability: {verifiability:.1f}/25 | "
            f"Completeness: {completeness:.1f}/20 | Atomicity: {atomicity:.1f}/15 | "
            f"Consistency: {consistency:.1f}/15 -> Total Rubric Score: {overall:.1f}/100"
        )

        return QualityScore(
            overall=overall,
            clarity=clarity,
            verifiability=verifiability,
            completeness=completeness,
            atomicity=atomicity,
            consistency=consistency,
            receipt=receipt
        )

    def _score_clarity(self, text: str, issues: List[IssueCard]) -> Tuple[float, List[str]]:
        score = self.MAX_CLARITY
        receipt = []
        covered_spans: List[Tuple[int, int]] = []
        covered_phrases: Set[str] = set()

        # Heuristic 1: Escape hatches (take precedence over single subjective words)
        for m in ESCAPE_HATCHES_REGEX.finditer(text):
            phrase = m.group(0).lower()
            if phrase not in covered_phrases:
                penalty = 8.0
                score -= penalty
                covered_phrases.add(phrase)
                covered_spans.append((m.start(), m.end()))
                receipt.append(f"[Clarity -{penalty:.1f} pts] Non-committal escape-hatch detected: '{m.group(0)}'")

        # Heuristic 2: Subjective vague words (suppress if word falls within an already penalized escape hatch)
        for m in SUBJECTIVE_TERMS_REGEX.finditer(text):
            word = m.group(0).lower()
            m_start, m_end = m.start(), m.end()
            # If this word is part of an already penalized escape hatch span, do not double-charge
            if any(e_start <= m_start and m_end <= e_end for e_start, e_end in covered_spans):
                continue
            if word not in covered_phrases:
                penalty = 5.0
                score -= penalty
                covered_phrases.add(word)
                covered_spans.append((m_start, m_end))
                receipt.append(f"[Clarity -{penalty:.1f} pts] Subjective/vague term detected: '{m.group(0)}'")

        # Flaw cards: Ambiguity, Escape-hatch, Over-specification
        clarity_cards = [i for i in issues if i.issue_type.lower() in ("ambiguity", "escape-hatch", "over-specification")]
        for card in clarity_cards:
            q_lower = (card.evidence_quote or "").lower().strip()
            c_start = card.start_offset if card.start_offset is not None else -1
            c_end = card.end_offset if card.end_offset is not None else -1

            is_overlap = False
            if q_lower and q_lower in covered_phrases:
                is_overlap = True
            elif c_start >= 0 and c_end > c_start:
                for span_start, span_end in covered_spans:
                    if max(c_start, span_start) < min(c_end, span_end):
                        is_overlap = True
                        break

            # Only deduct if not already penalized by deterministic regex
            if not is_overlap:
                penalty = 8.0 if card.severity.upper() == "BLOCKER" else (5.0 if card.severity.upper() == "MAJOR" else 2.5)
                score -= penalty
                if c_start >= 0 and c_end > c_start:
                    covered_spans.append((c_start, c_end))
                if q_lower:
                    covered_phrases.add(q_lower)
                receipt.append(f"[Clarity -{penalty:.1f} pts] Flaw card ({card.issue_type} - {card.severity}): '{card.evidence_quote}'")

        score = round(max(0.0, min(self.MAX_CLARITY, score)), 1)
        return score, receipt

    def _score_verifiability(self, text: str, issues: List[IssueCard]) -> Tuple[float, List[str]]:
        score = self.MAX_VERIFIABILITY
        receipt = []
        covered_spans: List[Tuple[int, int]] = []
        covered_phrases: Set[str] = set()

        # Heuristic 1: Untestable claims or absolutes
        for m in UNTESTABLE_SUPERLATIVES_REGEX.finditer(text):
            word = m.group(0).lower()
            if word not in covered_phrases:
                penalty = 10.0
                score -= penalty
                covered_phrases.add(word)
                covered_spans.append((m.start(), m.end()))
                receipt.append(f"[Verifiability -{penalty:.1f} pts] Untestable absolute/superlative: '{m.group(0)}'")

        # Heuristic 2: Performance metric words without numbers or explicit TBD placeholder
        has_number_or_tbd = bool(re.search(r"\d+", text)) or bool(TBD_PATTERN_REGEX.search(text))
        if not has_number_or_tbd:
            for m in METRIC_WORDS_WITHOUT_NUMBER_REGEX.finditer(text):
                metric = m.group(0).lower()
                if metric not in covered_phrases:
                    penalty = 8.0
                    score -= penalty
                    covered_phrases.add(metric)
                    covered_spans.append((m.start(), m.end()))
                    receipt.append(f"[Verifiability -{penalty:.1f} pts] Quantitative metric without numeric threshold: '{m.group(0)}'")

        # Flaw cards: Unverifiability
        verif_cards = [i for i in issues if i.issue_type.lower() in ("unverifiability", "unverifiable")]
        for card in verif_cards:
            q_lower = (card.evidence_quote or "").lower().strip()
            c_start = card.start_offset if card.start_offset is not None else -1
            c_end = card.end_offset if card.end_offset is not None else -1

            is_overlap = False
            if q_lower and q_lower in covered_phrases:
                is_overlap = True
            elif c_start >= 0 and c_end > c_start:
                for span_start, span_end in covered_spans:
                    if max(c_start, span_start) < min(c_end, span_end):
                        is_overlap = True
                        break

            if not is_overlap:
                penalty = 10.0 if card.severity.upper() == "BLOCKER" else (6.0 if card.severity.upper() == "MAJOR" else 3.0)
                score -= penalty
                if c_start >= 0 and c_end > c_start:
                    covered_spans.append((c_start, c_end))
                if q_lower:
                    covered_phrases.add(q_lower)
                receipt.append(f"[Verifiability -{penalty:.1f} pts] Flaw card (Unverifiability - {card.severity}): '{card.evidence_quote}'")

        score = round(max(0.0, min(self.MAX_VERIFIABILITY, score)), 1)
        return score, receipt

    def _score_completeness(self, text: str, issues: List[IssueCard]) -> Tuple[float, List[str]]:
        score = self.MAX_COMPLETENESS
        receipt = []
        covered_spans: List[Tuple[int, int]] = []
        covered_phrases: Set[str] = set()

        # Heuristic 1: Explicit Modal Verb Presence
        modal_matches = MODAL_VERBS_REGEX.findall(text)
        if not modal_matches:
            penalty = 8.0
            score -= penalty
            receipt.append(f"[Completeness -{penalty:.1f} pts] Missing contractual modal verb ('shall' or 'must')")

        # Heuristic 2: Action without condition/trigger (when reactive behavior is specified)
        has_action = bool(ACTION_WITHOUT_CONDITION_REGEX.search(text))
        has_condition = bool(CONDITION_TRIGGERS_REGEX.search(text))
        if has_action and not has_condition:
            penalty = 6.0
            score -= penalty
            receipt.append(f"[Completeness -{penalty:.1f} pts] Reactive trigger action lacks prerequisite operational condition ('when/if/while')")

        # Heuristic 3: Explicit TBD parameter presence (needs PM/Lead sign-off)
        for m in TBD_PATTERN_REGEX.finditer(text):
            token = m.group(0)
            covered_spans.append((m.start(), m.end()))
            covered_phrases.add(token.lower())

        tbd_matches = list(covered_phrases)
        if tbd_matches:
            penalty = min(8.0, len(tbd_matches) * 4.0)
            score -= penalty
            receipt.append(f"[Completeness -{penalty:.1f} pts] Unresolved parameter placeholders: {', '.join(tbd_matches)}")

        # Flaw cards: Incompleteness
        incomp_cards = [i for i in issues if i.issue_type.lower() in ("incompleteness", "incomplete")]
        for card in incomp_cards:
            q_lower = (card.evidence_quote or "").lower().strip()
            c_start = card.start_offset if card.start_offset is not None else -1
            c_end = card.end_offset if card.end_offset is not None else -1

            is_overlap = False
            if q_lower and q_lower in covered_phrases:
                is_overlap = True
            elif c_start >= 0 and c_end > c_start:
                for span_start, span_end in covered_spans:
                    if max(c_start, span_start) < min(c_end, span_end):
                        is_overlap = True
                        break

            if not is_overlap:
                penalty = 8.0 if card.severity.upper() == "BLOCKER" else (5.0 if card.severity.upper() == "MAJOR" else 2.5)
                score -= penalty
                if c_start >= 0 and c_end > c_start:
                    covered_spans.append((c_start, c_end))
                if q_lower:
                    covered_phrases.add(q_lower)
                receipt.append(f"[Completeness -{penalty:.1f} pts] Flaw card (Incompleteness - {card.severity}): '{card.evidence_quote}'")

        score = round(max(0.0, min(self.MAX_COMPLETENESS, score)), 1)
        return score, receipt

    def _score_atomicity(self, text: str, issues: List[IssueCard]) -> Tuple[float, List[str]]:
        score = self.MAX_ATOMICITY
        receipt = []
        covered_spans: List[Tuple[int, int]] = []
        covered_phrases: Set[str] = set()

        # Heuristic 1: Multiple modal verbs (e.g., 'shall ... and shall ...')
        modal_matches = MODAL_VERBS_REGEX.findall(text)
        if len(modal_matches) > 1:
            penalty = 7.0
            score -= penalty
            receipt.append(f"[Atomicity -{penalty:.1f} pts] Multiple modal verbs ({len(modal_matches)} occurrences) indicate compound obligations")

        # Heuristic 2: Compound conjunctions
        for m in COMPOUND_CONJUNCTIONS_REGEX.finditer(text):
            conj = m.group(0).lower()
            if conj not in covered_phrases:
                penalty = 5.0
                score -= penalty
                covered_phrases.add(conj)
                covered_spans.append((m.start(), m.end()))
                receipt.append(f"[Atomicity -{penalty:.1f} pts] Compound conjunction detected: '{m.group(0)}'")

        # Flaw cards: Non-atomic
        atom_cards = [i for i in issues if i.issue_type.lower() in ("non-atomic", "non_atomic", "atomicity")]
        for card in atom_cards:
            q_lower = (card.evidence_quote or "").lower().strip()
            c_start = card.start_offset if card.start_offset is not None else -1
            c_end = card.end_offset if card.end_offset is not None else -1

            is_overlap = False
            if q_lower and q_lower in covered_phrases:
                is_overlap = True
            elif c_start >= 0 and c_end > c_start:
                for span_start, span_end in covered_spans:
                    if max(c_start, span_start) < min(c_end, span_end):
                        is_overlap = True
                        break

            if not is_overlap:
                penalty = 7.0 if card.severity.upper() == "BLOCKER" else (4.0 if card.severity.upper() == "MAJOR" else 2.0)
                score -= penalty
                if c_start >= 0 and c_end > c_start:
                    covered_spans.append((c_start, c_end))
                if q_lower:
                    covered_phrases.add(q_lower)
                receipt.append(f"[Atomicity -{penalty:.1f} pts] Flaw card (Non-atomic - {card.severity}): '{card.evidence_quote}'")

        score = round(max(0.0, min(self.MAX_ATOMICITY, score)), 1)
        return score, receipt

    def _score_consistency(
        self,
        text: str,
        issues: List[IssueCard],
        conflicts: List[RequirementConflictCard]
    ) -> Tuple[float, List[str]]:
        score = self.MAX_CONSISTENCY
        receipt = []
        covered_spans: List[Tuple[int, int]] = []
        covered_phrases: Set[str] = set()

        # Conflict Radar Flags
        for conf in conflicts:
            penalty = 15.0 if conf.severity == "BLOCKER" else 8.0
            score -= penalty
            q = (conf.conflicting_quote_a or "").lower().strip()
            if q:
                covered_phrases.add(q)
            receipt.append(
                f"[Consistency -{penalty:.1f} pts] Conflict detected with {conf.req_id_b} ({conf.conflict_type}): '{conf.conflicting_quote_a}'"
            )

        # Flaw cards: Consistency
        cons_cards = [i for i in issues if i.issue_type.lower() in ("consistency", "contradiction")]
        for card in cons_cards:
            q_lower = (card.evidence_quote or "").lower().strip()
            c_start = card.start_offset if card.start_offset is not None else -1
            c_end = card.end_offset if card.end_offset is not None else -1

            is_overlap = False
            if q_lower and q_lower in covered_phrases:
                is_overlap = True
            elif c_start >= 0 and c_end > c_start:
                for span_start, span_end in covered_spans:
                    if max(c_start, span_start) < min(c_end, span_end):
                        is_overlap = True
                        break

            if not is_overlap:
                penalty = 15.0 if card.severity.upper() == "BLOCKER" else (8.0 if card.severity.upper() == "MAJOR" else 4.0)
                score -= penalty
                if c_start >= 0 and c_end > c_start:
                    covered_spans.append((c_start, c_end))
                if q_lower:
                    covered_phrases.add(q_lower)
                receipt.append(f"[Consistency -{penalty:.1f} pts] Flaw card (Consistency - {card.severity}): '{card.evidence_quote}'")

        score = round(max(0.0, min(self.MAX_CONSISTENCY, score)), 1)
        return score, receipt

    def score_requirement(self, req: RequirementStatement, conflicts: Optional[List[RequirementConflictCard]] = None) -> RequirementStatement:
        """
        Evaluate and attach quality score directly to a RequirementStatement.
        """
        score = self.calculate_score(req.text, req.issues, conflicts)
        req.quality_score = score
        return req


rubric_engine = RubricScoringEngine()
