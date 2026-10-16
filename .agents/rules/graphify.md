---
trigger: always_on
description: Rules for using and continuously updating the graphify knowledge graph at graphify-out/.
---

# Knowledge Graph Usage & Continuous Graphify Sync Rules

> **Operational rule for AI agents: Always query the knowledge graph before broad codebase searches, and update graphify after code changes.**

---

## 1. Query-First Architecture Navigation Mandate

Before modifying cross-cutting code, tracing data flows, or investigating repository structure:
- **Always consult `graphify-out/graph.json` first** whenever it exists. Never rely on blind brute-force `grep` or dumping dozens of files when a structural knowledge graph is available.
- **Preferred Navigation Channels**:
  1. **MCP Tools** (Fastest & direct):
     - `query_graph`: Natural language search across graph entities and relationships.
     - `shortest_path`: Trace exact dependency or call paths between two symbols/concepts (`source` $\to$ `target`).
     - `get_node` & `get_neighbors`: Inspect specific entity details, signatures, and inbound/outbound connections.
     - `god_nodes`: Identify high-centrality hub components before refactoring or extending interfaces.
     - `get_community`: Understand architectural subsystems and domain clusters.
  2. **CLI Fallback**:
     - `graphify query "<question>"` for BFS architectural exploration.
     - `graphify path "<A>" "<B>"` for connectivity tracing.
     - `graphify explain "<concept>"` for scoped node explanations.
- If `graphify-out/wiki/index.md` exists, navigate community articles instead of scanning raw files.
- Read `graphify-out/GRAPH_REPORT.md` only for broad architecture audits or when targeted queries need broader context.

---

## 2. Continuous Graph Updating Policy

To ensure the knowledge graph never drifts from the actual codebase:
- **Session Code Changes**: After adding or modifying code, endpoints, models, or schemas in a session, **run `graphify update .`** to synchronize the graph.
  - This executes local AST re-extraction on modified files in ~1-2 seconds.
  - It incurs **zero LLM API token cost**.
  - It immediately updates `graphify-out/graph.json`, `graphify-out/graph.html`, and `graphify-out/GRAPH_REPORT.md`.
- **Documentation & Structural Changes**: When new markdown specifications, golden datasets, or architecture docs in `docs/` are substantially modified or added, run `/graphify --update` to re-extract semantic nodes.
- **Pre-Commit Verification**: Ensure the updated code graph is reflected before wrapping up significant architectural milestones.

---

## 3. Graph Integrity & Honesty Rules

- **Zero Edge Fabrication**: Never hallucinate links between components. Extracted links must be structurally verifiable via imports, function calls, or explicit data flows. Unclear connections remain `AMBIGUOUS` or unlinked.
- **Audit Trail Grounding**: Always trace entities back to their concrete `source_location` in the codebase.
- **Shrink-Guard Respect**: Never bypass graph shrink guards unless intentional file deletions have occurred.
