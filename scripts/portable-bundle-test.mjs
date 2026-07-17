import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { root, runtimeRoot, vectorPythonCommand } from "./runtime-paths.mjs";
const temp=fs.mkdtempSync(path.join(os.tmpdir(),"local-rag-portable-"));
try {
  const bundle=path.join(temp,"pdf-sample.rag.zip"), imported=path.join(temp,"imported"); fs.mkdirSync(imported);
  const python=vectorPythonCommand(), runtime=runtimeRoot();
  let result=spawnSync(python,[path.join(runtime,"rag","portable","export-bundle.py"),"--knowledge-root",root,"--domain","pdf-sample","--out",bundle,"--specialist-skill","arduino-programmer","--specialist-skill","software-architecture","--purpose","IoT operations evidence","--local-files-only"],{encoding:"utf8"});
  assert.equal(result.status,0,result.stderr||result.stdout); const exported=JSON.parse(result.stdout); assert.match(exported.sha256,/^[a-f0-9]{64}$/);
  result=spawnSync(python,[path.join(runtime,"rag","portable","import-bundle.py"),"--bundle",bundle,"--knowledge-root",imported],{encoding:"utf8"});
  assert.equal(result.status,0,result.stderr||result.stdout); const loaded=JSON.parse(result.stdout); assert.equal(loaded.qdrant.chunks,exported.chunks);
  const collection=JSON.parse(fs.readFileSync(path.join(imported,"collections","pdf-sample","collection.json"),"utf8")); assert.deepEqual(collection.specialist_skills,["arduino-programmer","software-architecture"]);
  const importedIndex=JSON.parse(fs.readFileSync(path.join(imported,".local-rag-index","pdf-sample-sample-index.json"),"utf8"));
  assert.ok(importedIndex.chunks.some(x=>x.evidence_ids.includes("PDF-SAMPLE-OVERVIEW-001")));
  assert.equal(path.resolve(importedIndex.knowledge_root),path.resolve(imported));
  assert.ok(importedIndex.chunks.every(x=>x.processing_profile==="technical"&&/^[a-f0-9]{64}$/.test(x.processing_profile_digest)));
  console.log(`Portable bundle passed: ${loaded.manifest.chunks} chunks, ${exported.sha256}.`);
} finally { fs.rmSync(temp,{recursive:true,force:true}); }
