import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { root, runtimeRoot, vectorPythonCommand } from "./runtime-paths.mjs";

const temp=fs.mkdtempSync(path.join(os.tmpdir(),"local-rag-visual-"));
try {
  const runtime=runtimeRoot(), python=vectorPythonCommand(), source=path.join(root,"sources","diagrams");
  let result=spawnSync(python,[path.join(runtime,"rag","ingest","crunch-folder.py"),"--knowledge-root",temp,
    "--source-folder",source,"--domain","visual-sample","--source-id","reviewed-diagrams","--include","**/*.svg",
    "--copy-raw","--visual-description-policy","reviewed-only"],{encoding:"utf8"});
  assert.equal(result.status,0,result.stderr||result.stdout); const ingested=JSON.parse(result.stdout); assert.equal(ingested.processed_count,1);
  result=spawnSync(python,[path.join(runtime,"rag","ingest","build-index.py"),"--knowledge-root",temp,"--domain","visual-sample"],{encoding:"utf8"});
  assert.equal(result.status,0,result.stderr||result.stdout);
  const index=JSON.parse(fs.readFileSync(path.join(temp,".local-rag-index","visual-sample-sample-index.json"),"utf8"));
  assert.ok(index.chunks.length>0); assert.ok(index.chunks.every(chunk=>chunk.visual_ids.includes("sensor-gateway-context")));
  assert.ok(index.chunks.some(chunk=>chunk.text.includes("Operations service")));
  assert.ok(index.chunks.some(chunk=>chunk.text.includes("Interpretations (Inference)")));
  assert.ok(fs.existsSync(path.join(temp,"raw","visual-sample","reviewed-diagrams","system-context.svg")));
  assert.ok(fs.existsSync(path.join(temp,"raw","visual-sample","reviewed-diagrams","system-context.svg.visual.json")));
  console.log(`Visual-description RAG passed: ${index.chunks.length} chunks with reviewed visual evidence.`);
} finally { fs.rmSync(temp,{recursive:true,force:true}); }
