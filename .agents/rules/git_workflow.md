# Git Commit Workflow Rule

> **Operational rule for AI agents: Commit after every meaningful change or completed step. Strictly NEVER push.**

---

## 1. Commit After Every Change
- Whenever a code change, documentation update, test addition, or task step is completed, **stage and commit the changes immediately**.
- Use concise conventional commit messages:
  - `feat: <new capability or endpoint>`
  - `fix: <bug or prompt correction>`
  - `docs: <documentation, research findings, or pitch updates>`
  - `test: <test harness or validation runs>`
  - `refactor: <code cleanup or restructuring>`

---

## 2. STRICT: Never Push (`git push`)
- **NEVER run `git push` under any circumstances.**
- All commits must remain local. The user will handle remote repository pushes manually.
