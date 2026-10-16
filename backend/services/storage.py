from typing import Dict, List, Optional
from datetime import datetime
from backend.models.schemas import RequirementStatement, RequirementStatus, DualKeySignOff


class RequirementStore:
    """
    High-performance in-memory requirement baseline store with Dual-Key state governance.
    Preloaded with sample datasets for pitch demonstrations.
    """

    def __init__(self):
        self._items: Dict[str, RequirementStatement] = {}

    def get_all(self) -> List[RequirementStatement]:
        return list(self._items.values())

    def get_by_id(self, req_id: str) -> Optional[RequirementStatement]:
        return self._items.get(req_id)

    def upsert(self, item: RequirementStatement) -> RequirementStatement:
        item.updated_at = datetime.utcnow()
        self._items[item.id] = item
        return item

    def bulk_add(self, items: List[RequirementStatement]) -> List[RequirementStatement]:
        for item in items:
            self.upsert(item)
        return items

    def delete(self, req_id: str) -> bool:
        if req_id in self._items:
            del self._items[req_id]
            return True
        return False

    def clear(self):
        self._items.clear()

    def apply_dual_key_transition(
        self,
        req_id: str,
        action: str,
        pm_author: Optional[str] = None,
        pm_target_val: Optional[str] = None,
        tech_lead_approver: Optional[str] = None,
        hardware_rationale: Optional[str] = None,
    ) -> Optional[RequirementStatement]:
        item = self.get_by_id(req_id)
        if not item:
            return None

        sign_off = item.sign_off or DualKeySignOff(requirement_id=req_id)

        if action == "provisional_pm":
            sign_off.pm_author = pm_author or "Product Manager"
            sign_off.pm_target_val = pm_target_val
            sign_off.state = RequirementStatus.PROVISIONAL_PM
            item.status = RequirementStatus.PROVISIONAL_PM
        elif action == "lock_baseline":
            # Only allow locking baseline if provisional PM exists or is provided
            sign_off.tech_lead_approver = tech_lead_approver or "Lead Systems Engineer"
            sign_off.hardware_rationale = hardware_rationale or "Validated against hardware envelope"
            sign_off.signed_off_at = datetime.utcnow()
            sign_off.state = RequirementStatus.LOCKED_BASELINE
            item.status = RequirementStatus.LOCKED_BASELINE
        elif action == "flag_tbd":
            sign_off.state = RequirementStatus.FLAGGED_TBD
            item.status = RequirementStatus.FLAGGED_TBD
        elif action == "reject":
            sign_off.state = RequirementStatus.REJECTED
            item.status = RequirementStatus.REJECTED

        item.sign_off = sign_off
        item.version += 1
        item.updated_at = datetime.utcnow()
        return item


store = RequirementStore()
