import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { root, runtimeRoot, vectorPythonCommand } from "./runtime-paths.mjs";

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "local-rag-pdf-integration-"));
try {
  const source = path.join(temporary, "sources", "pdfs");
  fs.mkdirSync(path.join(temporary, ".local-rag"), { recursive: true });
  fs.mkdirSync(source, { recursive: true });
  for (const name of ["sensor-network-overview.pdf", "maintenance-runbook.pdf"]) {
    fs.copyFileSync(path.join(root, "sources", "pdfs", name), path.join(source, name));
  }
  fs.writeFileSync(path.join(temporary, ".local-rag", "project.json"), JSON.stringify({
    schema: "agentknowledge.local-rag.project.v1",
    project_root: ".",
    knowledge_root: ".",
    domain: "pdf-integration",
    exclude: [],
    sources: [{
      id: "repo-pdfs", path: "sources/pdfs", include: ["**/*.pdf"], exclude: [],
      categories: { document_type: ["fixture"], source_format: ["pdf"] },
      attributes: { suite: "runtime-pdf-integration" }
    }]
  }, null, 2));
  const result = spawnSync(vectorPythonCommand(), [
    path.join(runtimeRoot(), "rag", "ingest", "crunch-project.py"),
    "--project-root", temporary
  ], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const registry = JSON.parse(fs.readFileSync(
    path.join(temporary, "documents", "pdf-integration", "document-registry.json"), "utf8"
  ));
  assert.equal(registry.documents.length, 2);
  for (const document of registry.documents) {
    assert.equal(document.status, "active");
    assert.equal(document.extraction.method, "pypdf");
    assert.equal(document.extraction.status, "extracted");
    assert.ok(document.extraction.page_count >= 1);
    assert.ok(document.extraction.text_page_count >= 1);
    assert.deepEqual(document.categories.document_type, ["fixture"]);
    const sourceFile = path.join(temporary, document.source_path);
    const hash = crypto.createHash("sha256").update(fs.readFileSync(sourceFile)).digest("hex");
    assert.equal(document.sha256, hash);
    const extract = fs.readFileSync(path.join(temporary, document.extract_path), "utf8");
    assert.match(extract, new RegExp(`${document.evidence_id}#page=1`));
    assert.doesNotMatch(extract, /Extraction Placeholder/);
  }
  console.log("Runtime PDF integration passed: 2 PDFs with page evidence and registry lineage.");
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
