# Phase 1.5: Multi-Project Workspaces, Charter Freezing & Executive RBAC Findings

> **Comprehensive record of Enterprise Multi-Project Isolation, Architecture Charter Boundary Freezing (HTTP 423), SQLite Write-Through Persistence, and 3-Tier Persona-Based Access Control (RBAC) on the Requirement Quality Copilot.**

---

## 1. Executive Summary

Enterprise requirements engineering teams do not operate in a single unpartitioned namespace, nor do senior executives review chaotic, in-progress requirement drafts. Phase 1.5 hardened the backend data tier to support multi-tenant aerospace, medical, and robotics programs with strict separation of duties:

1. **Multi-Project Workspace Namespaces**: Completely isolated project domains (`ProjectWorkspace`) ensuring requirements, project documentation charters, and dual-key sign-off ledgers never bleed across projects.
2. **Boundary Charter Locking (HTTP 423 Locked)**: Prevents requirement-creep by providing formal cryptographic freezing of foundational architecture specifications. Once frozen, charters reject unauthorized mutation with HTTP 423.
3. **Hierarchical 3-Tier Persona Shielding**:
   - 👔 **Product Manager**: Authoring, editing, and provisional threshold targeting (`DRAFT`, `FLAGGED_TBD`, `PROVISIONAL_PM`, `LOCKED_BASELINE`).
   - 🛠️ **Lead Systems Engineer**: Technical feasibility verification, hardware budget rationale attachment, and sign-off locking (`PROVISIONAL_PM` $\to$ `LOCKED_BASELINE`).
   - 🎖️ **Executive**: Curated, noise-free view restricted exclusively to PM-vetted (`PROVISIONAL_PM` 🟡) or fully verified (`LOCKED_BASELINE` 🟢) assets, shielding leadership from raw drafts.
4. **SQLite Write-Through Persistence (`backend/data/quality_copilot.db`)**: Dual-layer architecture keeping fast in-memory execution backed by acid-compliant disk persistence with zero mock data.
5. **Preloaded Domain Workspaces**: Default initialized workspaces for Industrial Robotics (`default_project`), Avionics Flight Control (`proj-flight`), and Neonatal Infusion Pumps (`proj-med`).

---

## 2. Multi-Project Workspace Architecture

### 2.1 Workspace Data Model
Each project is encapsulated as an isolated entity within `ProjectWorkspace`:

```python
class ProjectWorkspace(BaseModel):
    project_id: str
    name: str
    domain: str
    description: str
    context_text: str = ""
    charter_frozen: bool = False
    created_at: str
    dual_key_signoffs: Dict[str, DualKeySignOff] = Field(default_factory=dict)
```

Requirements within `RequirementStore` maintain explicit `project_id` foreign keys. Any query or ingestion route (`/api/requirements`, `/api/chat`, `/api/projects/{id}/context`) strictly filters against the scoped workspace ID.

### 2.2 Boundary Charter Locking (HTTP 423)
To eliminate requirements volatility during verification stages:
- Endpoint: `POST /api/projects/{id}/freeze-charter`
- Enforcement: When `charter_frozen == True`, any attempt to overwrite project documentation or modify architecture context triggers an immediate HTTP `423 Locked` error with an auditable explanation.

```json
{
  "detail": "Project charter is locked. Unfreeze charter before modifying system context."
}
```

---

## 3. Hierarchical Persona-Based RBAC Matrix

To model enterprise workflows and governance regulations, the system enforces a 3-role persona gate:

| Persona | Allowed States Visible | Ingestion & Draft Creation | Technical Sign-off Gate | Export Privileges |
| :--- | :--- | :--- | :--- | :--- |
| **👔 Product Manager** | `DRAFT`, `FLAGGED_TBD`, `PROVISIONAL_PM`, `LOCKED_BASELINE` | ✅ Full access | ❌ Cannot lock baseline (Needs Tech Lead) | ✅ Internal CSV/JSON |
| **🛠️ Lead Systems Engineer** | `FLAGGED_TBD`, `PROVISIONAL_PM`, `LOCKED_BASELINE` | ✅ Full review & edit | ✅ **Exclusive Gatekeeper** (`PROVISIONAL` $\to$ `LOCKED`) | ✅ Full Engineering Package |
| **🎖️ Senior Executive** | `PROVISIONAL_PM` 🟡, `LOCKED_BASELINE` 🟢 | ❌ Shielded from raw drafts | ❌ Read-only audit lens | ✅ Publication PDF & Certified Baseline |

### Verification of Persona Shielding
When an Executive requests the requirement inventory for a project:
1. Requirements in `FLAGGED_TBD` or `DRAFT` status are automatically omitted from the payload.
2. The UI renders a clean, executive-level health summary showing completion percentages toward contractual baseline sign-off.
3. Unverified placeholders do not pollute executive risk decks.

---

## 4. SQLite Write-Through Persistence Layer

To survive server reboots and venue network fluctuations:
- **Location**: `backend/data/quality_copilot.db`
- **Tables**: `projects`, `requirements`, `dual_key_signoffs`, `documents`.
- **Strategy**: In-memory dictionary reads provide sub-millisecond route performance; writes execute transactionally to SQLite, guaranteeing crash resilience on venue demo hardware.

---

## 5. Automated Verification & Test Results

The workspace isolation and RBAC security layer were validated with automated suites in `backend/tests/test_rbac_and_workspaces.py` and `backend/tests/test_pm_documents.py`:
- Cross-project isolation: Verified that requirement IDs and context strings created in `proj-flight` never appear in `default_project` or `proj-med`.
- HTTP 423 Charter Locking: Verified that context PUT requests fail with 423 once frozen.
- Executive filtering: Verified that executive API calls omit 100% of raw unvetted drafts.
- Dual-key validation: Verified that non-technical roles cannot forge a Lead Systems Engineer sign-off without a recorded hardware rationale.
