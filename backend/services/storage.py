import os
import uuid
import re
import json
import sqlite3
from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import datetime
from backend.models.schemas import (
    RequirementStatement,
    RequirementStatus,
    DualKeySignOff,
    ProjectContext,
    ProjectDocumentContext,
    ProjectWorkspace,
    ProjectSummary,
    UserRole
)

DEFAULT_DB_PATH = Path(os.environ.get("QUALITY_COPILOT_DB_PATH", str(Path(__file__).parent.parent / "data" / "quality_copilot.db")))


class RequirementStore:
    """
    High-performance in-memory requirement baseline store with SQLite write-through persistence,
    Multi-Project isolation, Dual-Key state governance, and Hierarchical Executive RBAC filters.
    
    Reads hit the in-memory cache for 0ms instantaneous response.
    Writes persist transactionally to local SQLite for offline stage durability.
    """

    def __init__(self, db_path: Optional[str | Path] = None):
        self.db_path = Path(db_path) if db_path else DEFAULT_DB_PATH
        self._projects: Dict[str, ProjectWorkspace] = {}
        self._requirements: Dict[str, Dict[str, RequirementStatement]] = {}
        
        self._init_db()
        self._load_from_db()

    def _get_connection(self) -> sqlite3.Connection:
        if str(self.db_path) != ":memory:":
            self.db_path.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(str(self.db_path), check_same_thread=False)
        conn.row_factory = sqlite3.Row
        # Guarantee schema presence across ephemeral test unlinks & restarts
        cursor = conn.cursor()
        cursor.execute("CREATE TABLE IF NOT EXISTS projects (project_id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT NOT NULL);")
        cursor.execute("CREATE TABLE IF NOT EXISTS requirements (id TEXT NOT NULL, project_id TEXT NOT NULL, data TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY (id, project_id));")
        conn.commit()
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS projects (
                    project_id TEXT PRIMARY KEY,
                    data TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS requirements (
                    id TEXT NOT NULL,
                    project_id TEXT NOT NULL,
                    data TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    PRIMARY KEY (id, project_id)
                );
            """)
            conn.commit()

    def _load_from_db(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            # 1. Load Projects
            cursor.execute("SELECT project_id, data FROM projects")
            rows = cursor.fetchall()
            for row in rows:
                ws = ProjectWorkspace.model_validate_json(row["data"])
                self._projects[ws.project_id] = ws
                if ws.project_id not in self._requirements:
                    self._requirements[ws.project_id] = {}

            # 2. Load Requirements
            cursor.execute("SELECT id, project_id, data FROM requirements")
            req_rows = cursor.fetchall()
            for row in req_rows:
                req = RequirementStatement.model_validate_json(row["data"])
                target_pid = req.project_id or "default_project"
                if target_pid not in self._requirements:
                    self._requirements[target_pid] = {}
                self._requirements[target_pid][req.id] = req

        # Database is clean — no default projects injected automatically.

    def _init_default_project(self):
        default_workspace = ProjectWorkspace(
            project_id="default_project",
            project_name="Next-Gen 800V EV Powertrain & BMS",
            domain="Automotive Systems (ISO 26262 / ASIL-D)",
            description=(
                "800V silicon-carbide traction inverter and battery management system. "
                "Supports 350kW DC fast charging, liquid glycol thermal loop, CAN-FD bus (500 kbps nominal, 2 Mbps data), "
                "and strict ASIL-D high-voltage disconnect within 10ms of pyrotechnic fuse or crash trigger."
            ),
            is_locked=False,
            documents=[
                ProjectDocumentContext(
                    id="DOC-BMS-001",
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
        self._projects[default_workspace.project_id] = default_workspace
        if default_workspace.project_id not in self._requirements:
            self._requirements[default_workspace.project_id] = {}
        self._persist_project_db(default_workspace)

    # ==========================================
    # Database Persistence Helpers (Write-Through)
    # ==========================================

    def _persist_project_db(self, ws: ProjectWorkspace):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT OR REPLACE INTO projects (project_id, data, updated_at) VALUES (?, ?, ?)",
                (ws.project_id, ws.model_dump_json(), ws.updated_at.isoformat())
            )
            conn.commit()

    def _delete_project_db(self, project_id: str):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM projects WHERE project_id = ?", (project_id,))
            cursor.execute("DELETE FROM requirements WHERE project_id = ?", (project_id,))
            conn.commit()

    def _persist_requirement_db(self, item: RequirementStatement):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT OR REPLACE INTO requirements (id, project_id, data, updated_at) VALUES (?, ?, ?, ?)",
                (item.id, item.project_id, item.model_dump_json(), item.updated_at.isoformat())
            )
            conn.commit()

    def _persist_requirements_bulk_db(self, items: List[RequirementStatement]):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            records = [
                (item.id, item.project_id, item.model_dump_json(), item.updated_at.isoformat())
                for item in items
            ]
            cursor.executemany(
                "INSERT OR REPLACE INTO requirements (id, project_id, data, updated_at) VALUES (?, ?, ?, ?)",
                records
            )
            conn.commit()

    def _delete_requirement_db(self, req_id: str, project_id: Optional[str] = None):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            if project_id:
                cursor.execute(
                    "DELETE FROM requirements WHERE id = ? AND project_id = ?",
                    (req_id, project_id)
                )
            else:
                cursor.execute("DELETE FROM requirements WHERE id = ?", (req_id,))
            conn.commit()

    def _clear_requirements_db(self, project_id: Optional[str] = None):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            if project_id:
                cursor.execute("DELETE FROM requirements WHERE project_id = ?", (project_id,))
            else:
                cursor.execute("DELETE FROM requirements")
            conn.commit()

    # ==========================================
    # Project Workspaces CRUD & Boundary Locking
    # ==========================================

    def create_project(
        self,
        project_id: str,
        project_name: str,
        domain: str,
        description: str
    ) -> ProjectWorkspace:
        if project_id in self._projects:
            raise ValueError(f"Project workspace '{project_id}' already exists.")
        
        workspace = ProjectWorkspace(
            project_id=project_id,
            project_name=project_name,
            domain=domain,
            description=description,
            is_locked=False,
            documents=[]
        )
        self._projects[project_id] = workspace
        self._requirements[project_id] = {}
        self._persist_project_db(workspace)
        return workspace

    def list_projects(self) -> List[ProjectSummary]:
        summaries = []
        for pid, ws in self._projects.items():
            req_dict = self._requirements.get(pid, {})
            locked_count = sum(1 for r in req_dict.values() if r.status == RequirementStatus.LOCKED_BASELINE)
            prov_count = sum(1 for r in req_dict.values() if r.status == RequirementStatus.PROVISIONAL_PM)
            tbd_count = sum(1 for r in req_dict.values() if r.status == RequirementStatus.FLAGGED_TBD)
            
            summaries.append(
                ProjectSummary(
                    project_id=ws.project_id,
                    project_name=ws.project_name,
                    domain=ws.domain,
                    description=ws.description,
                    is_locked=ws.is_locked,
                    total_requirements=len(req_dict),
                    locked_baseline_count=locked_count,
                    provisional_pm_count=prov_count,
                    flagged_tbd_count=tbd_count,
                    total_documents=len(ws.documents),
                    created_at=ws.created_at,
                    updated_at=ws.updated_at
                )
            )
        return summaries

    def get_project(self, project_id: str) -> Optional[ProjectWorkspace]:
        return self._projects.get(project_id)

    def update_project(
        self,
        project_id: str,
        project_name: Optional[str] = None,
        domain: Optional[str] = None,
        description: Optional[str] = None
    ) -> Optional[ProjectWorkspace]:
        ws = self._projects.get(project_id)
        if not ws:
            return None
        if ws.is_locked:
            raise ValueError(f"Project '{project_id}' architecture boundary is locked. Metadata modifications are frozen.")
        
        if project_name is not None:
            ws.project_name = project_name
        if domain is not None:
            ws.domain = domain
        if description is not None:
            ws.description = description
        
        ws.updated_at = datetime.utcnow()
        self._persist_project_db(ws)
        return ws

    def delete_project(self, project_id: str) -> bool:
        if project_id in self._projects:
            del self._projects[project_id]
            if project_id in self._requirements:
                del self._requirements[project_id]
            self._delete_project_db(project_id)
            return True
        return False

    def lock_project(
        self,
        project_id: str,
        is_locked: bool,
        locked_by: Optional[str] = None
    ) -> Optional[ProjectWorkspace]:
        ws = self._projects.get(project_id)
        if not ws:
            return None
        
        ws.is_locked = is_locked
        ws.locked_at = datetime.utcnow() if is_locked else None
        ws.locked_by = locked_by if is_locked else None
        ws.updated_at = datetime.utcnow()
        self._persist_project_db(ws)
        return ws

    # ==========================================
    # Project Documents CRUD
    # ==========================================

    def add_document(self, project_id: str, doc: ProjectDocumentContext) -> ProjectWorkspace:
        ws = self._projects.get(project_id)
        if not ws:
            ws = self.create_project(
                project_id=project_id,
                project_name=f"Project {project_id}",
                domain="Embedded Systems",
                description="Auto-created project workspace"
            )
        if ws.is_locked:
            raise ValueError(f"Project '{project_id}' architecture boundary is locked. Document modifications are frozen.")
        
        ws.documents.append(doc)
        ws.updated_at = datetime.utcnow()
        self._persist_project_db(ws)
        return ws

    def get_documents(self, project_id: str) -> List[ProjectDocumentContext]:
        ws = self._projects.get(project_id)
        return ws.documents if ws else []

    def update_document(
        self,
        project_id: str,
        doc_id: str,
        title: Optional[str] = None,
        content: Optional[str] = None,
        category: Optional[str] = None
    ) -> Optional[ProjectDocumentContext]:
        ws = self._projects.get(project_id)
        if not ws:
            return None
        if ws.is_locked:
            raise ValueError(f"Project '{project_id}' architecture boundary is locked. Document modifications are frozen.")
        
        for d in ws.documents:
            if d.id == doc_id or d.title == doc_id:
                if title is not None:
                    d.title = title
                if content is not None:
                    d.content = content
                if category is not None:
                    d.category = category
                d.version += 1
                d.uploaded_at = datetime.utcnow()
                ws.updated_at = datetime.utcnow()
                self._persist_project_db(ws)
                return d
        return None

    def delete_document(self, project_id: str, doc_id: str) -> bool:
        ws = self._projects.get(project_id)
        if not ws:
            return False
        if ws.is_locked:
            raise ValueError(f"Project '{project_id}' architecture boundary is locked. Document modifications are frozen.")
        
        initial_len = len(ws.documents)
        ws.documents = [d for d in ws.documents if d.id != doc_id and d.title != doc_id]
        if len(ws.documents) < initial_len:
            ws.updated_at = datetime.utcnow()
            self._persist_project_db(ws)
            return True
        return False

    # Backward-compatible Context Helpers
    def get_project_context(self, project_id: str = "default_project") -> Optional[ProjectContext]:
        ws = self._projects.get(project_id) or self._projects.get("default_project")
        if not ws:
            return None
        return ProjectContext(
            project_id=ws.project_id,
            project_name=ws.project_name,
            domain=ws.domain,
            description=ws.description,
            documents=ws.documents,
            is_locked=ws.is_locked
        )

    def set_project_context(self, context: ProjectContext) -> ProjectContext:
        ws = self._projects.get(context.project_id)
        if ws:
            if ws.is_locked:
                raise ValueError(f"Project '{context.project_id}' architecture boundary is locked.")
            ws.project_name = context.project_name
            ws.domain = context.domain
            ws.description = context.description
            ws.documents = context.documents
            ws.is_locked = context.is_locked
            ws.updated_at = datetime.utcnow()
        else:
            ws = ProjectWorkspace(
                project_id=context.project_id,
                project_name=context.project_name,
                domain=context.domain,
                description=context.description,
                is_locked=context.is_locked,
                documents=context.documents
            )
            self._projects[context.project_id] = ws
            if context.project_id not in self._requirements:
                self._requirements[context.project_id] = {}
        self._persist_project_db(ws)
        return context

    def add_document_to_context(self, project_id: str, doc: ProjectDocumentContext) -> ProjectContext:
        self.add_document(project_id, doc)
        return self.get_project_context(project_id)

    # ==========================================
    # Requirement Statements with RBAC & Isolation
    # ==========================================

    def get_all(
        self,
        project_id: Optional[str] = "default_project",
        role: UserRole = UserRole.PRODUCT_MANAGER
    ) -> List[RequirementStatement]:
        results: List[RequirementStatement] = []
        if project_id:
            req_dict = self._requirements.get(project_id, {})
            results = list(req_dict.values())
        else:
            for req_dict in self._requirements.values():
                results.extend(req_dict.values())
        
        # Hierarchical Executive RBAC Filter:
        # Executives are shielded from raw DRAFT or FLAGGED_TBD requirements.
        # They only see PM-Approved (PROVISIONAL_PM 🟡) or Signed-off (LOCKED_BASELINE 🟢) baselines.
        if role == UserRole.EXECUTIVE:
            results = [
                r for r in results
                if r.status in (RequirementStatus.PROVISIONAL_PM, RequirementStatus.LOCKED_BASELINE)
            ]
        
        return results

    list_all = get_all

    def get_by_id(
        self,
        req_id: str,
        project_id: Optional[str] = None,
        role: UserRole = UserRole.PRODUCT_MANAGER
    ) -> Optional[RequirementStatement]:
        found: Optional[RequirementStatement] = None
        if project_id and project_id in self._requirements:
            found = self._requirements[project_id].get(req_id)
        else:
            # Search across all project namespaces
            for req_dict in self._requirements.values():
                if req_id in req_dict:
                    found = req_dict[req_id]
                    break
        
        if not found:
            return None
        
        # Executive visibility shield
        if role == UserRole.EXECUTIVE and found.status not in (
            RequirementStatus.PROVISIONAL_PM,
            RequirementStatus.LOCKED_BASELINE
        ):
            return None
        
        return found

    @staticmethod
    def normalize_text(text: str) -> str:
        """Normalize requirement statement text for duplicate comparison (case/whitespace/punctuation agnostic)."""
        if not text:
            return ""
        return re.sub(r"[^a-z0-9]", "", text.lower())

    def is_duplicate(
        self,
        text: str,
        project_id: str = "default_project",
        exclude_id: Optional[str] = None
    ) -> Optional[RequirementStatement]:
        """
        Check if a requirement statement duplicates an existing statement in the workspace.
        Returns the existing matching RequirementStatement, or None.
        """
        norm_input = self.normalize_text(text)
        if not norm_input:
            return None

        req_dict = self._requirements.get(project_id, {})
        for req in req_dict.values():
            if exclude_id and req.id == exclude_id:
                continue
            if self.normalize_text(req.text) == norm_input:
                return req
        return None

    def upsert(
        self,
        item: RequirementStatement,
        project_id: Optional[str] = None,
        allow_duplicate: bool = False
    ) -> RequirementStatement:
        target_project = project_id or item.project_id or "default_project"
        if target_project not in self._requirements:
            self._requirements[target_project] = {}
        if target_project not in self._projects:
            # Auto-register workspace container
            ws = ProjectWorkspace(
                project_id=target_project,
                project_name=f"Project {target_project}",
                domain="Embedded Systems",
                description="Auto-created workspace namespace"
            )
            self._projects[target_project] = ws
            self._persist_project_db(ws)

        # Strict duplicate check: block duplicate statements within the same workspace
        if not allow_duplicate:
            dup = self.is_duplicate(item.text, project_id=target_project, exclude_id=item.id)
            if dup:
                raise ValueError(
                    f"Duplicate requirement: A requirement with matching text already exists in '{target_project}' ({dup.id})."
                )
        
        item.project_id = target_project
        item.updated_at = datetime.utcnow()
        self._requirements[target_project][item.id] = item
        self._persist_requirement_db(item)
        return item

    def bulk_add(
        self,
        items: List[RequirementStatement],
        project_id: Optional[str] = None,
        allow_duplicate: bool = False
    ) -> List[RequirementStatement]:
        target_project = project_id or "default_project"
        if target_project not in self._requirements:
            self._requirements[target_project] = {}

        added_items: List[RequirementStatement] = []
        seen_batch_norms = set()

        for item in items:
            item.project_id = target_project
            norm = self.normalize_text(item.text)
            if not allow_duplicate:
                if norm in seen_batch_norms:
                    continue
                if self.is_duplicate(item.text, project_id=target_project, exclude_id=item.id):
                    continue

            seen_batch_norms.add(norm)
            item.updated_at = datetime.utcnow()
            self._requirements[target_project][item.id] = item
            added_items.append(item)
        
        if target_project not in self._projects:
            ws = ProjectWorkspace(
                project_id=target_project,
                project_name=f"Project {target_project}",
                domain="Embedded Systems",
                description="Auto-created workspace namespace"
            )
            self._projects[target_project] = ws
            self._persist_project_db(ws)

        if added_items:
            self._persist_requirements_bulk_db(added_items)
        return added_items

    def delete(self, req_id: str, project_id: Optional[str] = None) -> bool:
        if project_id and project_id in self._requirements:
            if req_id in self._requirements[project_id]:
                del self._requirements[project_id][req_id]
                self._delete_requirement_db(req_id, project_id)
                return True
            return False
        
        for pid, req_dict in self._requirements.items():
            if req_id in req_dict:
                del req_dict[req_id]
                self._delete_requirement_db(req_id, pid)
                return True
        return False

    def clear(self, project_id: Optional[str] = None):
        if project_id and project_id in self._requirements:
            self._requirements[project_id].clear()
            self._clear_requirements_db(project_id)
        elif project_id is None:
            for req_dict in self._requirements.values():
                req_dict.clear()
            self._clear_requirements_db()

    def apply_dual_key_transition(
        self,
        req_id: str,
        action: str,
        pm_author: Optional[str] = None,
        pm_target_val: Optional[str] = None,
        tech_lead_approver: Optional[str] = None,
        hardware_rationale: Optional[str] = None,
        project_id: Optional[str] = None
    ) -> Optional[RequirementStatement]:
        item = self.get_by_id(req_id, project_id=project_id)
        if not item:
            return None

        sign_off = item.sign_off or DualKeySignOff(requirement_id=req_id)

        if action == "provisional_pm":
            sign_off.pm_author = pm_author or "Product Manager"
            sign_off.pm_target_val = pm_target_val
            # Reset senior engineer approval when PM provisions or updates values
            sign_off.tech_lead_approver = None
            sign_off.hardware_rationale = None
            sign_off.signed_off_at = None
            sign_off.state = RequirementStatus.PROVISIONAL_PM
            item.status = RequirementStatus.PROVISIONAL_PM
        elif action == "lock_baseline":
            tbd_matches = re.findall(r"\[TBD:[^\]]+\]", item.text)
            unbound_tbds = [t for t in tbd_matches if "=" not in t]
            if unbound_tbds and not (sign_off and sign_off.pm_target_val):
                raise ValueError("Cannot lock baseline: requirement contains unresolved [TBD] parameters. Must be resolved to provisional values first.")
            sign_off.tech_lead_approver = tech_lead_approver or "Lead Systems Engineer"
            sign_off.hardware_rationale = hardware_rationale or "Validated against hardware envelope"
            sign_off.signed_off_at = datetime.utcnow()
            sign_off.state = RequirementStatus.LOCKED_BASELINE
            item.status = RequirementStatus.LOCKED_BASELINE
        elif action == "flag_tbd":
            sign_off.tech_lead_approver = None
            sign_off.hardware_rationale = None
            sign_off.signed_off_at = None
            sign_off.state = RequirementStatus.FLAGGED_TBD
            item.status = RequirementStatus.FLAGGED_TBD
        elif action == "reject":
            sign_off.state = RequirementStatus.REJECTED
            item.status = RequirementStatus.REJECTED

        item.sign_off = sign_off
        item.version += 1
        item.updated_at = datetime.utcnow()
        # Save back in appropriate namespace and persist (allow_duplicate=True since text is existing)
        self.upsert(item, project_id=item.project_id, allow_duplicate=True)
        return item

    def find_duplicates(
        self,
        project_id: str = "default_project",
        similarity_threshold: float = 0.70
    ) -> List[Dict[str, Any]]:
        """
        Detect exact and near-duplicate requirement statements within a project workspace.
        Uses exact text hashing + Jaccard token overlap similarity.
        """
        reqs = list(self._requirements.get(project_id, {}).values())
        duplicates = []
        n = len(reqs)

        def tokenize(text: str) -> set[str]:
            words = text.lower().replace("[", " ").replace("]", " ").replace(".", " ").replace(",", " ").replace(":", " ").split()
            stopwords = {"the", "shall", "should", "must", "a", "an", "and", "or", "to", "of", "in", "for", "with", "is", "be", "if", "when"}
            return {w for w in words if w not in stopwords and len(w) > 1}

        seen_pairs = set()
        for i in range(n):
            tokens_i = tokenize(reqs[i].text)
            for j in range(i + 1, n):
                pair_key = (min(reqs[i].id, reqs[j].id), max(reqs[i].id, reqs[j].id))
                if pair_key in seen_pairs:
                    continue

                # 1. Exact Text Collision
                if reqs[i].text.strip().lower() == reqs[j].text.strip().lower():
                    seen_pairs.add(pair_key)
                    duplicates.append({
                        "req_id_a": reqs[i].id,
                        "req_id_b": reqs[j].id,
                        "match_type": "EXACT",
                        "similarity": 1.0,
                        "text_a": reqs[i].text,
                        "text_b": reqs[j].text
                    })
                    continue

                # 2. Near-Duplicate Token Overlap
                tokens_j = tokenize(reqs[j].text)
                if tokens_i and tokens_j:
                    intersection = len(tokens_i & tokens_j)
                    union = len(tokens_i | tokens_j)
                    sim = intersection / union if union > 0 else 0.0
                    if sim >= similarity_threshold:
                        seen_pairs.add(pair_key)
                        duplicates.append({
                            "req_id_a": reqs[i].id,
                            "req_id_b": reqs[j].id,
                            "match_type": "NEAR_DUPLICATE",
                            "similarity": round(sim, 3),
                            "text_a": reqs[i].text,
                            "text_b": reqs[j].text
                        })

        return duplicates


store = RequirementStore()
