import assert from "node:assert/strict";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { root, runtimeRoot, vectorPythonCommand } from "./runtime-paths.mjs";

const runtime = runtimeRoot();
const python = vectorPythonCommand();
const run = (script, args) => {
  const result = spawnSync(python, [path.join(runtime, ...script), ...args], { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result;
};

run(["rag", "ingest", "build-index.py"], ["--knowledge-root", root, "--domain", "pdf-sample"]);
run(["rag", "vector", "build-qdrant.py"], ["--knowledge-root", root, "--domain", "pdf-sample", "--local-files-only"]);
run(["rag", "graph", "build-graph.py"], ["--knowledge-root", root, "--domain", "pdf-sample"]);

const request = {
  jsonrpc: "2.0", id: 1, method: "tools/call",
  params: { name: "knowledge.search", arguments: {
    domain: "pdf-sample",
    query: "Wie lange puffert das Gateway Messwerte bei einem Ausfall?",
    top_k: 3,
    backend: "qdrant-local",
    local_files_only: true,
    expand_graph: true,
    category: "document_type",
    category_value: "overview"
  } }
};
const result = spawnSync(python, [path.join(runtime, "mcp-server", "server.py"), "--knowledge-root", root], {
  cwd: root, input: `${JSON.stringify(request)}\n`, encoding: "utf8"
});
assert.equal(result.status, 0, result.stderr || result.stdout);
const response = JSON.parse(result.stdout.trim());
assert.ok(response.result, response.error?.message);
const payload = JSON.parse(response.result.content[0].text);
const overview = payload.results.find((item) =>
  item.evidence_ids.includes("PDF-SAMPLE-OVERVIEW-001") && /72 hours/i.test(item.text)
);
assert.ok(overview, "semantic retrieval missed PDF-SAMPLE-OVERVIEW-001");
assert.match(overview.text, /72 hours/i);
assert.ok(overview.graph_context.some((item) => item.edge_kind === "CITES_EVIDENCE"));
assert.deepEqual(overview.categories.document_type, ["overview"]);
assert.match(overview.source_sha256, /^[a-f0-9]{64}$/);
assert.equal(overview.embedding_backend, "fastembed");
assert.match(overview.embedding_model, /multilingual/);
assert.ok(overview.embedding_dimensions > 0);
assert.match(overview.embedding_fingerprint_sha256, /^[a-f0-9]{64}$/);
assert.match(overview.fastembed_version, /^\d+\.\d+/);
console.log(`KAG smoke test passed: ${payload.backend}, ${overview.chunk_id}, ${overview.evidence_ids.join(", ")}.`);
