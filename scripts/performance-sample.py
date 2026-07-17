#!/usr/bin/env python3
import argparse
import json
import os
import platform
import statistics
import sys
import time
from datetime import datetime, timezone
from importlib.metadata import version
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RUNTIME = Path(os.environ.get("AGENTKNOWLEDGE_RUNTIME_ROOT", ROOT.parent / "AgentKnowledgeRuntime")).resolve()
sys.path.insert(0, str(RUNTIME / "rag" / "ingest"))
sys.path.insert(0, str(RUNTIME / "rag" / "vector"))
sys.path.insert(0, str(RUNTIME / "rag" / "graph"))

from build_index import build_index
from document_registry import load_registry
from knowledge_graph import build_graph, neighbours
from qdrant_backend import build_qdrant, search_qdrant


def elapsed(start):
    return (time.perf_counter() - start) * 1000


def percentile(values, fraction):
    ordered = sorted(values)
    return ordered[round((len(ordered) - 1) * fraction)]


def run(iterations=20, local_files_only=True):
    start = time.perf_counter()
    index_file, chunks = build_index(ROOT, "pdf-sample")
    index_ms = elapsed(start)
    start = time.perf_counter()
    vector = build_qdrant(index_file, local_files_only=local_files_only)
    vector_ms = elapsed(start)
    start = time.perf_counter()
    graph_file = build_graph(index_file)
    graph_ms = elapsed(start)
    latencies = []
    result_count = 0
    evidence_hits = 0
    graph_edges = 0
    queries = [
        "Wie lange puffert das Gateway Messwerte bei einem Ausfall?",
        "maintenance acknowledgement recovery procedure",
        "sensor network connectivity telemetry",
    ]
    for number in range(iterations):
        start = time.perf_counter()
        results = search_qdrant(
            ROOT, "pdf-sample", queries[number % len(queries)], 3,
            local_files_only=local_files_only,
        )
        latencies.append(elapsed(start))
        result_count += len(results)
        evidence_hits += sum(bool(item.get("evidence_ids")) for item in results)
        if results:
            graph_edges += len(neighbours(graph_file, results[0]["id"], 20))
    start = time.perf_counter()
    registry = load_registry(ROOT, "pdf-sample")
    registry_ms = elapsed(start)
    return {
        "schema": "local-rag-pdf-sample.performance.v1",
        "measured_at": datetime.now(timezone.utc).isoformat(),
        "environment": {
            "python": platform.python_version(), "platform": platform.platform(),
            "processor": platform.processor() or os.environ.get("PROCESSOR_IDENTIFIER", "unknown"),
            "runtime_root": str(RUNTIME), "model_cache": "local-only" if local_files_only else "download-allowed",
            "fastembed": version("fastembed"), "qdrant_client": version("qdrant-client"),
            "embedding_model": vector["model"], "embedding_dimensions": vector["embedding_dimensions"],
        },
        "corpus": {"pdfs": 2, "documents": len(registry["documents"]), "chunks": chunks, "queries": iterations},
        "correctness": {
            "qdrant_chunks": vector["chunks"], "query_results": result_count,
            "results_with_evidence": evidence_hits, "expanded_graph_edges": graph_edges,
        },
        "timings_ms": {
            "json_index_build": round(index_ms, 3), "qdrant_build_with_model_load": round(vector_ms, 3),
            "graph_build": round(graph_ms, 3), "registry_load": round(registry_ms, 3),
            "warm_query_mean": round(statistics.fmean(latencies), 3),
            "warm_query_p50": round(percentile(latencies, 0.50), 3),
            "warm_query_p95": round(percentile(latencies, 0.95), 3),
        },
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--iterations", type=int, default=20)
    parser.add_argument("--allow-download", action="store_true")
    parser.add_argument("--output")
    args = parser.parse_args()
    result = run(args.iterations, not args.allow_download)
    rendered = json.dumps(result, indent=2)
    if args.output:
        Path(args.output).write_text(rendered + "\n", encoding="utf-8")
    print(rendered)


if __name__ == "__main__":
    main()
