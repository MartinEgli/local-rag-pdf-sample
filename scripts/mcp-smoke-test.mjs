import assert from "node:assert/strict";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { pythonCommand, root, runtimeRoot } from "./runtime-paths.mjs";

const requests = [
  { jsonrpc: "2.0", id: 1, method: "initialize", params: {} },
  { jsonrpc: "2.0", method: "notifications/initialized", params: {} },
  { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "knowledge.rebuild_project_index", arguments: { domain: "pdf-sample" } } },
  { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "knowledge.search", arguments: { domain: "pdf-sample", query: "offline gateway buffer 72 hours network outage", top_k: 3 } } },
  { jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "knowledge.list_sources", arguments: { domain: "pdf-sample" } } }
];
const input = `${requests.map((request) => JSON.stringify(request)).join("\n")}\n`;
const server = path.join(runtimeRoot(), "mcp-server", "server.py");
const result = spawnSync(pythonCommand(), [server, "--knowledge-root", root], { input, encoding: "utf8" });
assert.equal(result.status, 0, result.stderr || result.stdout);

const responses = result.stdout.trim().split(/\r?\n/).map((line) => JSON.parse(line));
const payload = (id) => {
  const response = responses.find((candidate) => candidate.id === id);
  assert.ok(response, `missing JSON-RPC response ${id}`);
  assert.ok(response.result, response.error?.message || `JSON-RPC response ${id} has no result`);
  return JSON.parse(response.result.content[0].text);
};
const rebuild = payload(2);
const search = payload(3);
const sources = payload(4);

assert.ok(rebuild.chunks >= 2, `expected at least two chunks, got ${rebuild.chunks}`);
assert.ok(search.results.length > 0, "knowledge.search returned no candidates");
const overview = search.results.find((candidate) => candidate.evidence_ids.includes("PDF-SAMPLE-OVERVIEW-001"));
assert.ok(overview, "expected the overview Evidence ID in retrieval candidates");
assert.match(overview.text, /72 hours/i, "expected the known outage-buffer fact");
assert.match(sources.source_map_text, /PDF-SAMPLE-SOURCE-001/);
assert.match(sources.evidence_register_text, /PDF-SAMPLE-OVERVIEW-001/);

console.log(`MCP smoke test passed: ${rebuild.chunks} chunks, top evidence ${search.results[0].evidence_ids.join(", ")}.`);
