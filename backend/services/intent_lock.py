"""
Intent-Lock Semantic Diff Validator
Conforming to ISO/IEC/IEEE 29148 and EARS syntax specifications.

Detects subtle semantic drift between original and rewritten requirement statements:
1. Negation preservation (prohibits polarity inversion such as 'shall not' -> 'shall').
2. Modal verb binding strength (prevents demotion of 'shall'/'must' -> 'should'/'may').
3. Actor / system subject preservation.
4. Contractual threshold parameterization vs dropping.
5. High-resolution token diff stream for dual-key side-by-side UI review.
"""

import re
import difflib
from typing import List, Tuple, Set, Optional
from backend.models.schemas import (
    IntentLockReport,
    DiffToken,
    DiffTokenType
)

NEGATION_PATTERNS = [
    r"\bshall\s+not\b",
    r"\bmust\s+not\b",
    r"\bshould\s+not\b",
    r"\bmay\s+not\b",
    r"\bcannot\b",
    r"\bcan't\b",
    r"\bnever\b",
    r"\bneither\b",
    r"\bprohibited\b",
    r"\bdisallowed\b",
    r"\bnot\b"
]

MODAL_RANKS = {
    "shall": 3,
    "must": 3,
    "will": 2,
    "should": 1,
    "may": 0,
    "can": 0
}


class IntentLockValidator:
    """
    Deterministic Intent-Lock Semantic Drift Validator.
    Runs instantaneously outside the LLM to safeguard contractual intent.
    """

    def has_negation(self, text: str) -> Tuple[bool, Optional[str]]:
        lower = text.lower()
        for pat in NEGATION_PATTERNS:
            match = re.search(pat, lower)
            if match:
                return True, match.group(0)
        return False, None

    def extract_modals(self, text: str) -> List[str]:
        words = re.findall(r"\b[a-zA-Z]+\b", text.lower())
        return [w for w in words if w in MODAL_RANKS]

    def extract_numerical_thresholds(self, text: str) -> List[str]:
        """Find explicit numbers and attached or adjacent units."""
        # Match numbers with optional units (e.g. 50ms, 45 degC, 0.5 mm, 99.9%, -15 degrees)
        matches = re.findall(r"[-+]?\d+(?:\.\d+)?(?:\s*(?:ms|s|sec|seconds|hz|degc|c|degrees|mm|cm|m|v|mv|a|ma|%|knots|rpm|kpa|bar))?\b", text.lower())
        return [m.strip() for m in matches if m.strip()]

    def extract_actor(self, text: str) -> str:
        """Extract subject actor clause before primary modal verb or action."""
        match = re.split(r"\b(?:shall|must|should|may|can|will)\b", text, maxsplit=1, flags=re.IGNORECASE)
        if len(match) > 1 and match[0].strip():
            # Clean leading 'When', 'If', 'While' clauses if present
            actor_part = match[0].strip()
            comma_split = actor_part.split(",")
            return comma_split[-1].strip() if len(comma_split) > 1 else actor_part
        return ""

    def validate(self, original: str, revised: str) -> IntentLockReport:
        warnings: List[str] = []
        drift_detected = False

        orig_clean = original.strip()
        rev_clean = revised.strip()

        # 1. Negation Verification
        orig_neg, orig_neg_word = self.has_negation(orig_clean)
        rev_neg, rev_neg_word = self.has_negation(rev_clean)

        negation_preserved = True
        if orig_neg and not rev_neg:
            negation_preserved = False
            drift_detected = True
            warnings.append(
                f"CRITICAL POLARITY DRIFT: Original statement contains negative prohibition ('{orig_neg_word}'), "
                f"which was silently omitted or inverted in the rewrite."
            )
        elif not orig_neg and rev_neg:
            negation_preserved = False
            drift_detected = True
            warnings.append(
                f"CRITICAL POLARITY DRIFT: Rewrite introduced negative restriction ('{rev_neg_word}') "
                f"not present in the original obligation."
            )

        # 2. Modal Verb Binding Strength Check
        orig_modals = self.extract_modals(orig_clean)
        rev_modals = self.extract_modals(rev_clean)

        modal_preserved = True
        orig_strength = max([MODAL_RANKS[m] for m in orig_modals], default=2)
        rev_strength = max([MODAL_RANKS[m] for m in rev_modals], default=3)

        if orig_strength == 3 and rev_strength < 3:
            modal_preserved = False
            drift_detected = True
            warnings.append(
                f"LEGAL BINDING DEMOTION: Original binding requirement ('shall'/'must') was demoted to "
                f"non-binding suggestion ({rev_modals}). ISO 29148 requires 'shall'."
            )

        # 3. Actor / Subject Integrity
        orig_actor = self.extract_actor(orig_clean)
        rev_actor = self.extract_actor(rev_clean)
        actor_preserved = True

        if orig_actor:
            # Extract key nouns/words > 3 chars
            orig_actor_keywords = {w.lower() for w in re.findall(r"\b[a-zA-Z]{3,}\b", orig_actor) 
                                   if w.lower() not in {"the", "when", "while", "where", "with", "system"}}
            if orig_actor_keywords:
                rev_lower = rev_clean.lower()
                matches = [k for k in orig_actor_keywords if k in rev_lower]
                if not matches:
                    actor_preserved = False
                    warnings.append(
                        f"ACTOR DISPLACEMENT: Key technical actor terms ({', '.join(sorted(orig_actor_keywords))}) "
                        f"appear missing or altered in the rewritten obligation."
                    )

        # 4. Numerical Threshold Check (Zero-fabrication + threshold preservation)
        orig_thresholds = self.extract_numerical_thresholds(orig_clean)
        thresholds_preserved = True
        has_tbds = "[tbd:" in rev_clean.lower()

        if orig_thresholds and not has_tbds:
            # If original had numbers and rewrite has neither numbers nor TBDs
            rev_thresholds = self.extract_numerical_thresholds(rev_clean)
            if not rev_thresholds:
                thresholds_preserved = False
                warnings.append(
                    f"THRESHOLD DROPPED: Numerical metrics ({', '.join(orig_thresholds)}) were removed "
                    f"without explicit [TBD] parameterization."
                )

        # 5. Token-Level Diff Stream Generation
        diff_tokens = self._generate_diff_tokens(orig_clean, rev_clean, orig_neg, rev_neg)

        # 6. Audit Verdict
        passed = not drift_detected
        if passed and not warnings:
            summary = (
                "Intent-Lock Verified: Original obligation semantics preserved. "
                "Conforms to EARS binding syntax with zero contractual drift."
            )
        elif passed and warnings:
            summary = (
                f"Intent-Lock Conditionally Passed: Semantic intent intact with {len(warnings)} minor "
                f"editorial alignment notice(s)."
            )
        else:
            summary = (
                f"Intent-Lock FAILED: {len(warnings)} critical semantic drift issue(s) detected. "
                f"Human Lead Systems Engineer sign-off required before baseline lock."
            )

        return IntentLockReport(
            passed=passed,
            semantic_drift_detected=drift_detected,
            drift_warnings=warnings,
            negation_preserved=negation_preserved,
            modal_verb_preserved=modal_preserved,
            actor_preserved=actor_preserved,
            thresholds_preserved=thresholds_preserved,
            diff_tokens=diff_tokens,
            audit_summary=summary
        )

    def _generate_diff_tokens(
        self,
        orig_text: str,
        rev_text: str,
        orig_neg: bool,
        rev_neg: bool
    ) -> List[DiffToken]:
        """Generate high-fidelity token stream for side-by-side UI diff view."""
        orig_words = orig_text.split()
        rev_words = rev_text.split()

        matcher = difflib.SequenceMatcher(None, orig_words, rev_words)
        tokens: List[DiffToken] = []

        negation_single_words = {"not", "never", "cannot", "can't", "no", "neither", "nor", "prohibited", "disallowed"}

        for tag, i1, i2, j1, j2 in matcher.get_opcodes():
            if tag == "equal":
                for w in orig_words[i1:i2]:
                    tokens.append(DiffToken(text=w, token_type=DiffTokenType.PRESERVED))
            elif tag == "delete":
                for w in orig_words[i1:i2]:
                    w_clean = re.sub(r"[^\w]", "", w.lower())
                    if orig_neg and not rev_neg and w_clean in negation_single_words:
                        tokens.append(DiffToken(text=w, token_type=DiffTokenType.NEGATION_DRIFT, note="Dropped Negation"))
                    else:
                        tokens.append(DiffToken(text=w, token_type=DiffTokenType.REMOVED))
            elif tag == "insert":
                for w in rev_words[j1:j2]:
                    if "[TBD:" in w or "TBD:" in w or w.endswith("]"):
                        tokens.append(DiffToken(text=w, token_type=DiffTokenType.TBD_PARAMETERIZED, note="Zero-Fabrication Parameter"))
                    elif w.lower() == "shall":
                        tokens.append(DiffToken(text=w, token_type=DiffTokenType.MODAL_UPGRADED, note="EARS Binding Upgrade"))
                    else:
                        tokens.append(DiffToken(text=w, token_type=DiffTokenType.ADDED))
            elif tag == "replace":
                for w in orig_words[i1:i2]:
                    w_clean = re.sub(r"[^\w]", "", w.lower())
                    if orig_neg and not rev_neg and w_clean in negation_single_words:
                        tokens.append(DiffToken(text=w, token_type=DiffTokenType.NEGATION_DRIFT, note="Dropped Negation"))
                    else:
                        tokens.append(DiffToken(text=w, token_type=DiffTokenType.REMOVED))
                for w in rev_words[j1:j2]:
                    if "[TBD:" in w or "TBD:" in w or w.endswith("]"):
                        tokens.append(DiffToken(text=w, token_type=DiffTokenType.TBD_PARAMETERIZED, note="Zero-Fabrication Parameter"))
                    elif w.lower() == "shall":
                        tokens.append(DiffToken(text=w, token_type=DiffTokenType.MODAL_UPGRADED, note="EARS Binding Upgrade"))
                    else:
                        tokens.append(DiffToken(text=w, token_type=DiffTokenType.ADDED))

        return tokens


intent_lock_validator = IntentLockValidator()
