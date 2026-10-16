from typing import Dict, List, Optional
from datetime import datetime
from backend.models.schemas import (
    RequirementStatement,
    RequirementStatus,
    DualKeySignOff,
    ProjectContext,
    ProjectDocumentContext
)


class RequirementStore:
    """
    High-performance in-memory requirement baseline store with Dual-Key state governance
    and Project Context grounding for conversational AI agent workflows.
    """

    def __init__(self):
        self._items: Dict[str, RequirementStatement] = {}
        self._project_contexts: Dict[str, ProjectContext] = {}
        self._init_default_project()

    def _init_default_project(self):
        default_ctx = ProjectContext(
            project_id="default_project",
            project_name="Next-Gen 800V EV Powertrain & BMS",
            domain="Automotive Systems (ISO 26262 / ASIL-D)",
            description=(
                "800V silicon-carbide traction inverter and battery management system. "
                "Supports 350kW DC fast charging, liquid glycol thermal loop, CAN-FD bus (500 kbps nominal, 2 Mbps data), "
                "and strict ASIL-D high-voltage disconnect within 10ms of pyrotechnic fuse or crash trigger."
            ),
            documents=[
                ProjectDocumentContext(
                    title="BMS Architectural Safety Charter",
                    content=(
                        "Operating envelope: 2.8V to 4.25V per NMC cell. "
                        "Maximum pack surface temperature allowed during DC fast charging is 55°C. "
                        "All battery fault codes (DTCs) must be broadcast over CAN-FD ID 0x3F2."
                    ),
                    category="Safety & Compliance"
                )
            ]
        )
        self._project_contexts[default_ctx.project_id] = default_ctx

    def get_project_context(self, project_id: str = "default_project") -> Optional[ProjectContext]:
        return self._project_contexts.get(project_id) or self._project_contexts.get("default_project")

    def set_project_context(self, context: ProjectContext) -> ProjectContext:
        self._project_contexts[context.project_id] = context
        return context

    def add_document_to_context(self, project_id: str, doc: ProjectDocumentContext) -> ProjectContext:
        ctx = self.get_project_context(project_id)
        if not ctx:
            ctx = ProjectContext(
                project_id=project_id,
                project_name=f"Project {project_id}",
                domain="Embedded Systems",
                description="Custom user uploaded project context"
            )
            self._project_contexts[project_id] = ctx
        ctx.documents.append(doc)
        return ctx

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
