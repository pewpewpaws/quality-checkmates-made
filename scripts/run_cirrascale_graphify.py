#!/usr/bin/env python3
"""
scripts/run_cirrascale_graphify.py

Runs graphify semantic extraction across the codebase using the
Qualcomm Cloud AI 100 inference infrastructure (Cirrascale AI Suite v2).

Architecture:
  1. AST Extraction (Structural): graphify extract on Python codefiles (free, deterministic)
  2. Qualcomm AI 100 Semantic Extraction: Llama-3.3-70B with tool calling on Markdown & PDF docs
  3. Knowledge Graph Fusion: Combines AST + Semantic nodes/edges with schema deduplication
  4. Louvain Community Detection & Cohesion Scoring (NetworkX / graphify)
  5. Qualcomm AI 100 Community Labeling: Llama-3.3-70B semantic titling of clusters
  6. Artifact Generation: graph.json, graph.html, GRAPH_REPORT.md, manifest.json
"""

import os
import sys
import json
import time
import asyncio
from pathlib import Path
from typing import List, Dict, Any, Tuple

import pypdf
from imagine import ImagineAsyncClient, ChatMessage

from graphify.detect import detect, save_manifest
from graphify.extract import collect_files, extract as ast_extract
from graphify.build import build_from_json
from graphify.cluster import cluster, score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate as report_generate
from graphify.export import to_json, to_html

ENDPOINT_URL = os.environ.get("IMAGINE_ENDPOINT_URL", "https://aisuite.cirrascale.com/apis/v2")
API_KEY = os.environ.get("IMAGINE_API_KEY", "278b88a2-8f68-42f7-818e-0442a7d294a3")
MODEL_70B = "Llama-3.3-70B"

TOOL_GRAPH_EXTRACTION = [{
    "type": "function",
    "function": {
        "name": "submit_graph_extraction",
        "description": "Submit extracted knowledge graph nodes and edges from analyzed technical documents.",
        "parameters": {
            "type": "object",
            "properties": {
                "nodes": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "id": {"type": "string", "description": "Lowercase snake_case ID: {relative_path_stem}_{entity}"},
                            "label": {"type": "string", "description": "Human readable name"},
                            "file_type": {"type": "string", "enum": ["document", "paper", "concept", "rationale"]},
                            "source_file": {"type": "string", "description": "Repo path of source file"},
                            "rationale": {"type": "string", "description": "Engineering rationale or design intent"}
                        },
                        "required": ["id", "label", "file_type", "source_file"]
                    }
                },
                "edges": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "source": {"type": "string"},
                            "target": {"type": "string"},
                            "relation": {"type": "string", "description": "calls, implements, references, specifies, enforces, or conceptually_related_to"},
                            "confidence": {"type": "string", "enum": ["EXTRACTED", "INFERRED", "AMBIGUOUS"]},
                            "confidence_score": {"type": "number"},
                            "source_file": {"type": "string"}
                        },
                        "required": ["source", "target", "relation", "confidence", "confidence_score", "source_file"]
                    }
                }
            },
            "required": ["nodes", "edges"]
        }
    }
}]

TOOL_COMMUNITY_LABELING = [{
    "type": "function",
    "function": {
        "name": "submit_community_labels",
        "description": "Submit concise 2-5 word architectural names for each community cluster.",
        "parameters": {
            "type": "object",
            "properties": {
                "labels": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "community_id": {"type": "integer"},
                            "name": {"type": "string", "description": "2-5 word concise technical architectural name"}
                        },
                        "required": ["community_id", "name"]
                    }
                }
            },
            "required": ["labels"]
        }
    }
}]


def parse_tool_call_args(msg: Any) -> Dict[str, Any]:
    """Extract tool arguments or embedded JSON from Imagine API response, unpacking stringified arrays."""
    data = {}
    if getattr(msg, "tool_calls", None) and len(msg.tool_calls) > 0:
        tc = msg.tool_calls[0]
        raw = tc.function.arguments if hasattr(tc, "function") else str(tc)
        try:
            data = json.loads(raw) if isinstance(raw, str) else raw
        except Exception:
            data = {}
    elif getattr(msg, "content", None):
        content = msg.content
        if "{" in content:
            start = content.find("{")
            end = content.rfind("}")
            try:
                data = json.loads(content[start:end+1])
            except Exception:
                data = {}

    if isinstance(data, str):
        try:
            data = json.loads(data)
        except Exception:
            return {}

    if isinstance(data, dict):
        if "parameters" in data and isinstance(data["parameters"], dict):
            data = data["parameters"]
        for k, v in list(data.items()):
            if isinstance(v, str) and (v.strip().startswith("[") or v.strip().startswith("{")):
                try:
                    data[k] = json.loads(v)
                except Exception:
                    pass
    return data if isinstance(data, dict) else {}


def normalize_id(stem: str, entity: str) -> str:
    """Normalize node ID to match graphify format: {stem}_{entity}."""
    clean_stem = stem.replace("/", "_").replace(".", "_").replace("-", "_").lower()
    clean_entity = "".join(c if c.isalnum() or c == "_" else "_" for c in entity.lower()).strip("_")
    return f"{clean_stem}_{clean_entity}" if clean_stem else clean_entity


async def extract_semantic_chunk(
    client: ImagineAsyncClient,
    chunk_files: List[Tuple[str, str]],
    chunk_idx: int,
    total_chunks: int
) -> Dict[str, Any]:
    """Extract semantic nodes and edges from a chunk of documents using Qualcomm AI 100."""
    print(f"  [Cirrascale AI100] Processing Chunk {chunk_idx + 1}/{total_chunks} ({len(chunk_files)} files)...")
    t0 = time.time()

    formatted_docs = []
    for rel_path, content in chunk_files:
        truncated_content = content[:3500]  # Optimal token budget for high-density extraction
        formatted_docs.append(f"<document path=\"{rel_path}\">\n{truncated_content}\n</document>")

    user_prompt = (
        f"You are a Principal Systems Engineer building a knowledge graph for the Requirement Quality Copilot project.\n"
        f"Analyze these {len(chunk_files)} project documents and extract key technical entities, concepts, governance rules, and cross-document relationships.\n\n"
        f"RULES:\n"
        f"1. For each node, assign id: {{path_stem}}_{{entity_name}} in snake_case (e.g. `docs_api_endpoints_rest_endpoints`).\n"
        f"2. Set file_type to 'document', 'paper', 'concept', or 'rationale'.\n"
        f"3. Connect nodes to each other and to existing components (e.g. backend_services_qualcomm_service, dual_key_governance, llama_3_3_70b).\n"
        f"4. Assign relations: implements, references, specifies, enforces, conceptually_related_to.\n"
        f"5. Call submit_graph_extraction with your results.\n\n"
        + "\n\n".join(formatted_docs)
    )

    try:
        resp = await client.chat(
            messages=[
                ChatMessage(role="system", content="You are a knowledge graph extraction agent. Output strictly via submit_graph_extraction."),
                ChatMessage(role="user", content=user_prompt)
            ],
            model=MODEL_70B,
            tools=TOOL_GRAPH_EXTRACTION,
            temperature=0.0
        )
        latency = time.time() - t0
        data = parse_tool_call_args(resp.choices[0].message)
        nodes = data.get("nodes", [])
        if isinstance(nodes, str):
            try:
                nodes = json.loads(nodes)
            except Exception:
                nodes = []
        edges = data.get("edges", [])
        if isinstance(edges, str):
            try:
                edges = json.loads(edges)
            except Exception:
                edges = []

        usage = getattr(resp, "usage", None)
        in_tok = getattr(usage, "prompt_tokens", 0) if usage else 0
        out_tok = getattr(usage, "completion_tokens", 0) if usage else 0

        # Post-process and ensure consistent attributes
        valid_nodes = []
        for n in nodes:
            if isinstance(n, str):
                try:
                    n = json.loads(n)
                except Exception:
                    n = {"id": n, "label": n}
            if not isinstance(n, dict):
                continue
            raw_id = n.get("id") or n.get("name") or n.get("label") or ""
            nid = str(raw_id).lower().replace("-", "_").replace(" ", "_")
            if not nid:
                continue
            valid_nodes.append({
                "id": nid,
                "label": str(n.get("label") or n.get("name") or nid),
                "file_type": n.get("file_type", "document"),
                "source_file": n.get("source_file", chunk_files[0][0]),
                "source_location": None,
                "source_url": None,
                "captured_at": None,
                "author": None,
                "contributor": None,
                "rationale": n.get("rationale")
            })

        valid_edges = []
        for e in edges:
            if isinstance(e, str):
                try:
                    e = json.loads(e)
                except Exception:
                    continue
            if not isinstance(e, dict):
                continue
            src = str(e.get("source", "")).lower().replace("-", "_").replace(" ", "_")
            tgt = str(e.get("target", "")).lower().replace("-", "_").replace(" ", "_")
            if not src or not tgt:
                continue
            valid_edges.append({
                "source": src,
                "target": tgt,
                "relation": e.get("relation", "references"),
                "confidence": e.get("confidence", "INFERRED"),
                "confidence_score": float(e.get("confidence_score", 0.85)),
                "source_file": e.get("source_file", chunk_files[0][0]),
                "source_location": None,
                "weight": 1.0
            })

        print(f"  ✓ Chunk {chunk_idx + 1} completed in {latency:.2f}s ({len(valid_nodes)} nodes, {len(valid_edges)} edges)")
        return {
            "nodes": valid_nodes,
            "edges": valid_edges,
            "input_tokens": in_tok,
            "output_tokens": out_tok
        }
    except Exception as exc:
        print(f"  ✗ Chunk {chunk_idx + 1} failed: {exc}")
        return {"nodes": [], "edges": [], "input_tokens": 0, "output_tokens": 0}


async def label_communities_cirrascale(
    client: ImagineAsyncClient,
    G: Any,
    communities: Dict[int, List[str]]
) -> Dict[int, str]:
    """Label communities using Qualcomm Cloud AI 100."""
    print("  [Cirrascale AI100] Labeling community clusters with Llama-3.3-70B...")
    prompt_lines = []
    for cid, members in communities.items():
        sample_labels = [G.nodes[n].get("label", n) for n in members[:8] if n in G.nodes]
        prompt_lines.append(f"Cluster {cid}: {', '.join(sample_labels)}")

    prompt = (
        "You are an expert Systems Architect naming clusters in a software project knowledge graph.\n"
        "For each cluster, assign a concise 2-5 word technical domain name (e.g. 'Dual-Key Governance & Workspaces', "
        "'Qualcomm AI 100 SDK & Inference', 'Deterministic Verification & Test Blueprints').\n"
        "Call submit_community_labels.\n\n"
        + "\n".join(prompt_lines)
    )

    try:
        resp = await client.chat(
            messages=[
                ChatMessage(role="system", content="You are a cluster labeling specialist. Output strictly via submit_community_labels."),
                ChatMessage(role="user", content=prompt)
            ],
            model=MODEL_70B,
            tools=TOOL_COMMUNITY_LABELING,
            temperature=0.0
        )
        data = parse_tool_call_args(resp.choices[0].message)
        labels_raw = data.get("labels", [])
        if isinstance(labels_raw, str):
            try:
                labels_raw = json.loads(labels_raw)
            except Exception:
                labels_raw = []

        result = {}
        if isinstance(labels_raw, dict):
            for k, v in labels_raw.items():
                try:
                    result[int(k)] = str(v)
                except Exception:
                    pass
        elif isinstance(labels_raw, list):
            for item in labels_raw:
                if isinstance(item, dict):
                    cid = item.get("community_id")
                    name = item.get("name")
                    if cid is not None and name:
                        result[int(cid)] = str(name)

        # Fill any missing
        for cid in communities.keys():
            if cid not in result:
                result[cid] = f"Subsystem {cid}"
        return result
    except Exception as exc:
        print(f"  ✗ Community labeling error ({exc}), using fallback labels")
        return {cid: f"Component Cluster {cid}" for cid in communities.keys()}


async def main():
    print("=" * 70)
    print("🚀 GRAPHIFY SEMANTIC EXTRACTION VIA QUALCOMM CLOUD AI 100")
    print(f"   Inference Endpoint : {ENDPOINT_URL}")
    print(f"   Model Accelerator  : {MODEL_70B} (AI100 Accelerated)")
    print("=" * 70)

    out_dir = Path("graphify-out")
    out_dir.mkdir(exist_ok=True)

    # Step 1: Detect Files
    print("\n🔍 Step 1: Scanning project corpus...")
    detection = detect(Path("."))
    code_files = [Path(f) for f in detection.get("files", {}).get("code", [])]
    doc_files = [Path(f) for f in detection.get("files", {}).get("document", [])]
    paper_files = [Path(f) for f in detection.get("files", {}).get("paper", [])]

    print(f"   Found {detection['total_files']} total files:")
    print(f"     - Code files     : {len(code_files)}")
    print(f"     - Document files : {len(doc_files)}")
    print(f"     - Paper files    : {len(paper_files)}")

    # Step 2: Part A - Deterministic AST Extraction
    print("\n⚡ Step 2: Performing AST Structural Extraction on code files...")
    ast_res = ast_extract(code_files, cache_root=Path("."))
    ast_nodes = ast_res.get("nodes", [])
    ast_edges = ast_res.get("edges", [])
    print(f"   ✓ AST Extracted: {len(ast_nodes)} nodes, {len(ast_edges)} edges")

    # Step 3: Part B - Qualcomm Cloud AI 100 Semantic Extraction
    print(f"\n🧠 Step 3: Extracting Semantic Entities via Cirrascale AI 100 ({MODEL_70B})...")
    client = ImagineAsyncClient(endpoint=ENDPOINT_URL, api_key=API_KEY, timeout=90.0)

    # Load contents for documents and papers
    all_semantic_docs: List[Tuple[str, str]] = []
    for f in doc_files:
        try:
            rel = str(f.relative_to(Path(".").resolve()) if f.is_absolute() else f)
            text = f.read_text(encoding="utf-8", errors="ignore")
            all_semantic_docs.append((rel, text))
        except Exception:
            pass

    for f in paper_files:
        try:
            rel = str(f.relative_to(Path(".").resolve()) if f.is_absolute() else f)
            reader = pypdf.PdfReader(str(f))
            pdf_text = "\n".join([page.extract_text() or "" for page in reader.pages])
            all_semantic_docs.append((rel, pdf_text))
        except Exception:
            pass

    # Group into dense, focused chunks of 3 documents each
    chunk_size = 3
    chunks = [all_semantic_docs[i:i + chunk_size] for i in range(0, len(all_semantic_docs), chunk_size)]
    print(f"   Grouped {len(all_semantic_docs)} documents into {len(chunks)} chunks.")

    semantic_nodes = []
    semantic_edges = []
    total_in_tok = 0
    total_out_tok = 0

    t_sem_start = time.time()
    for idx, ch in enumerate(chunks):
        res = await extract_semantic_chunk(client, ch, idx, len(chunks))
        semantic_nodes.extend(res.get("nodes", []))
        semantic_edges.extend(res.get("edges", []))
        total_in_tok += res.get("input_tokens", 0)
        total_out_tok += res.get("output_tokens", 0)

    sem_duration = time.time() - t_sem_start
    print(f"   ✓ Semantic Extraction Finished in {sem_duration:.2f}s:")
    print(f"     - Semantic Nodes: {len(semantic_nodes)}")
    print(f"     - Semantic Edges: {len(semantic_edges)}")
    print(f"     - Tokens Used   : {total_in_tok:,} in / {total_out_tok:,} out")

    # Step 4: Part C - Merge AST + Semantic
    print("\n🔗 Step 4: Merging AST and Semantic Graphs...")
    seen_ids = set()
    merged_nodes = []
    for n in ast_nodes:
        if n["id"] not in seen_ids:
            seen_ids.add(n["id"])
            merged_nodes.append(n)
    for n in semantic_nodes:
        if n["id"] not in seen_ids:
            seen_ids.add(n["id"])
            merged_nodes.append(n)

    merged_edges = ast_edges + semantic_edges
    extract_data = {
        "nodes": merged_nodes,
        "edges": merged_edges,
        "hyperedges": [],
        "input_tokens": total_in_tok,
        "output_tokens": total_out_tok
    }
    (out_dir / ".graphify_extract.json").write_text(json.dumps(extract_data, indent=2), encoding="utf-8")
    print(f"   ✓ Unified Graph: {len(merged_nodes)} total nodes, {len(merged_edges)} total edges")

    # Step 5: Build Graph & Community Clustering
    print("\n📊 Step 5: Building NetworkX graph & detecting communities...")
    G = build_from_json(extract_data, root=".", directed=False)
    communities = cluster(G)
    cohesion = score_all(G, communities)
    gods = god_nodes(G)
    surprises = surprising_connections(G, communities)
    print(f"   ✓ Clustered into {len(communities)} modular communities")

    # Step 6: Community Labeling with Cirrascale AI 100
    print("\n🏷️  Step 6: Technical Community Labeling with Llama-3.3-70B...")
    labels = await label_communities_cirrascale(client, G, communities)
    for cid, name in sorted(labels.items()):
        size = len(communities.get(cid, []))
        print(f"     • Cluster {cid:2d} ({size:2d} nodes): {name}")

    # Step 7: Suggested Questions & Report
    questions = suggest_questions(G, communities, labels)
    tokens = {"input": total_in_tok, "output": total_out_tok}
    report = report_generate(
        G, communities, cohesion, labels, gods, surprises, detection, tokens, ".", suggested_questions=questions
    )
    (out_dir / "GRAPH_REPORT.md").write_text(report, encoding="utf-8")
    (out_dir / ".graphify_labels.json").write_text(json.dumps({str(k): v for k, v in labels.items()}, indent=2), encoding="utf-8")

    # Step 8: Export Artifacts
    print("\n💾 Step 8: Exporting graph artifacts...")
    to_json(G, communities, "graphify-out/graph.json", force=True, community_labels=labels)
    to_html(G, communities, "graphify-out/graph.html", community_labels=labels)

    # Save manifest for future incremental updates
    corpus_dict = detection.get("all_files") or detection["files"]
    save_manifest(corpus_dict, root=".")

    print("\n" + "=" * 70)
    print("✅ GRAPHIFY PIPELINE COMPLETE")
    print(f"   📁 Output Artifacts in: {Path('graphify-out').resolve()}")
    print("     - graph.html        (Interactive 3D/2D visualization)")
    print("     - graph.json        (GraphRAG unified knowledge graph)")
    print("     - GRAPH_REPORT.md   (Audit report & architectural insights)")
    print("=" * 70)

    # Print God Nodes and Questions
    print("\n🌟 Top God Nodes (Architectural Hubs):")
    for g in gods[:5]:
        print(f"   • {g.get('label', g['id'])} (Degree: {g.get('degree', 0)})")

    print("\n❓ Suggested Architectural Questions:")
    for q in questions[:3]:
        print(f"   • {q.get('question')}")


if __name__ == "__main__":
    asyncio.run(main())
