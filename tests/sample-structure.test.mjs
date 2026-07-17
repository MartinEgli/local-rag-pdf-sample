import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { root } from "../scripts/runtime-paths.mjs";

const manifest = JSON.parse(fs.readFileSync(path.join(root, "sources", "source-manifest.json"), "utf8"));
const config = JSON.parse(fs.readFileSync(path.join(root, ".local-rag", "project.json"), "utf8"));

test("project configuration uses the Local RAG project schema", () => {
  assert.equal(config.schema, "agentknowledge.local-rag.project.v1");
  assert.equal(config.domain, "pdf-sample");
  assert.deepEqual(config.source_folders, ["sources/pdfs"]);
  assert.equal(config.backend, "qdrant-local");
  assert.equal(config.graph_backend, "sqlite");
  assert.match(config.embedding_model, /multilingual/);
});

test("committed PDF sources are valid and hash-registered", () => {
  assert.equal(manifest.documents.length, 2);
  for (const document of manifest.documents) {
    const pdf = fs.readFileSync(path.join(root, "sources", document.file));
    assert.equal(pdf.subarray(0, 5).toString("ascii"), "%PDF-");
    assert.ok(pdf.length > 1000, `${document.file} is unexpectedly small`);
    assert.match(document.sha256, /^[a-f0-9]{64}$/);
  }
});

test("curated extracts and registers preserve evidence IDs", () => {
  const sourceMap = fs.readFileSync(path.join(root, "indexes", "source-map.md"), "utf8");
  const evidence = fs.readFileSync(path.join(root, "indexes", "evidence-register.md"), "utf8");
  for (const document of manifest.documents) {
    assert.match(sourceMap, new RegExp(document.source_id));
    assert.match(sourceMap, new RegExp(document.evidence_id));
    assert.match(evidence, new RegExp(document.evidence_id));
  }
});
