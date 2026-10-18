# Graph Report - frontend  (2026-10-18)

## Corpus Check
- 15 files · ~11,558 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: .css 3, (none) 1)

## Summary
- 65 nodes · 107 edges · 9 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9b862bdd`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- package.json
- react
- App.jsx
- ScrambledText.jsx
- .oxlintrc.json
- devDependencies
- dependencies
- scripts
- React + Vite

## God Nodes (most connected - your core abstractions)
1. `react` - 11 edges
2. `lucide-react` - 7 edges
3. `App()` - 7 edges
4. `api` - 6 edges
5. `scripts` - 5 edges
6. `InteractiveText()` - 4 edges
7. `RequirementDetail()` - 4 edges
8. `ScrambledText()` - 4 edges
9. `StartProjectHero()` - 4 edges
10. `rules` - 3 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `StartProjectHero()`  [EXTRACTED]
  src/App.jsx → src/components/StartProjectHero.jsx
- `RequirementDetail()` --calls--> `InteractiveText()`  [EXTRACTED]
  src/components/RequirementDetail.jsx → src/components/InteractiveText.jsx
- `App()` --calls--> `Header()`  [EXTRACTED]
  src/App.jsx → src/components/Header.jsx
- `App()` --calls--> `IngestModal()`  [EXTRACTED]
  src/App.jsx → src/components/IngestModal.jsx
- `App()` --calls--> `RequirementDetail()`  [EXTRACTED]
  src/App.jsx → src/components/RequirementDetail.jsx

## Import Cycles
- None detected.

## Communities (9 total, 0 thin omitted)

### Community 0 - "package.json"
Cohesion: 0.20
Nodes (9): name, private, type, version, oxlint, @types/react, @types/react-dom, vite (+1 more)

### Community 1 - "react"
Cohesion: 0.45
Nodes (5): lucide-react, react, InteractiveText(), TbdPopover(), api

### Community 2 - "App.jsx"
Cohesion: 0.33
Nodes (6): react-dom, App(), Header(), IngestModal(), RequirementDetail(), Sidebar()

### Community 3 - "ScrambledText.jsx"
Cohesion: 0.43
Nodes (5): gsap, falloff(), PHYSICAL, ScrambledText(), StartProjectHero()

### Community 4 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 5 - "devDependencies"
Cohesion: 0.33
Nodes (6): devDependencies, oxlint, @types/react, @types/react-dom, vite, @vitejs/plugin-react

### Community 6 - "dependencies"
Cohesion: 0.40
Nodes (5): dependencies, gsap, lucide-react, react, react-dom

### Community 7 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, preview

### Community 8 - "React + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + Vite

## Knowledge Gaps
- **3 isolated node(s):** `@types/react`, `@types/react-dom`, `oxlint`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 29 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `package.json`, `App.jsx`, `ScrambledText.jsx`?**
  _High betweenness centrality (0.244) - this node is a cross-community bridge._
- **What connects `@types/react`, `@types/react-dom`, `oxlint` to the rest of the system?**
  _3 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.126) - this node is a cross-community bridge._
- **Why does `scripts` connect `scripts` to `package.json`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._