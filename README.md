# Local RAG PDF Sample

Reproducible sample project for the `local-rag` skill. Two self-authored PDF
documents are committed under `sources/pdfs/`, extracted locally, indexed by
`AgentKnowledgeRuntime`, and queried through its MCP server.

## What This Proves

- PDF source files can live inside a project repository.
- Stable Source IDs and Evidence IDs survive extraction and retrieval.
- Curated Markdown stays traceable to PDF filename and SHA-256 hash.
- `knowledge.rebuild_project_index`, `knowledge.search`, and
  `knowledge.list_sources` work against the project as knowledge root.
- The runtime itself can extract the committed PDFs page by page while keeping
  SHA-256, Document ID, Evidence ID, category, attribute, and page lineage.
- Generated JSON, Qdrant, model-cache, and SQLite graph data remains local and unversioned.

The normal test keeps the dependency-free JSON backend for fast checks. The
optional KAG smoke test uses persistent local Qdrant, multilingual FastEmbed
embeddings, contextual chunks, and a source-traceable SQLite graph.

`.local-rag/project.json` also demonstrates two configured source locations.
Each location has a stable source ID and its own `include` and `exclude` globs.

`documents/pdf-sample/` contains the curated document manifest and generated
lifecycle registry. The registry records stable Document/Evidence IDs,
SHA-256, active/removal state, history, multi-valued categories, and attributes.
The PDF extraction script synchronises this registry through
`AgentKnowledgeRuntime`; unchanged runs are idempotent.

## Prerequisites

- Node.js 22.13+ or 24+
- Python 3.13 or another Python 3 version supported by
  `AgentKnowledgeRuntime`
- A sibling clone at `../AgentKnowledgeRuntime`, or the environment variable
  `AGENTKNOWLEDGE_RUNTIME_ROOT`

```powershell
git clone https://github.com/MartinEgli/AgentKnowledgeRuntime.git ..\AgentKnowledgeRuntime
npm install
python -m venv ..\AgentKnowledgeRuntime\.venv
..\AgentKnowledgeRuntime\.venv\Scripts\python -m pip install -r ..\AgentKnowledgeRuntime\requirements-vector.txt
..\AgentKnowledgeRuntime\.venv\Scripts\python -m pip install -r ..\AgentKnowledgeRuntime\requirements-documents.txt
```

## Run The Sample

Extract the committed PDFs into traceable Markdown:

```powershell
npm run extract
```

Build and query the local demo index:

```powershell
npm run rag:build
npm run rag:query
```

Run structural tests and the MCP retrieval smoke test:

```powershell
npm test
```

Generate resolved MCP configurations for Codex, Claude Code, Cursor, Windsurf,
and Cline:

```powershell
npm run mcp:configs
```

The files are written below `.local-rag/mcp-clients/` and intentionally remain
unversioned because they contain machine-specific absolute paths.

Run the semantic vector plus graph path after the model has been downloaded
once (the build command performs the initial download):

```powershell
..\AgentKnowledgeRuntime\.venv\Scripts\python ..\AgentKnowledgeRuntime\rag\vector\build-qdrant.py --knowledge-root . --domain pdf-sample
npm run rag:kag:smoke
```

Run the measured semantic and graph performance suite with a provisioned local
model cache:

```powershell
npm run perf -- --iterations 20
```

The result separates model/index construction from warm query p50/p95 latency.
It is evidence for the measured host, not a portable performance guarantee.
Recorded receipts from the current implementation are under `benchmarks/`.

## Profiles And Portable Collection

`rag/config/processing-profiles.json` stores separate `technical` and
`narrative` settings. The PDF fixtures use the technical profile; profile ID,
snapshot, and digest survive registry, chunks, embeddings, and retrieval.

`collections/pdf-sample/collection.json` binds this collection declaratively to
`arduino-programmer` and `software-architecture`. Run the cross-machine bundle
test with:

```powershell
npm run portable:test
```

It exports extracts, settings, registry, chunks, real FastEmbed vectors, and
skill bindings into a checksummed ZIP, imports it into a fresh knowledge root,
and reconstructs Qdrant without re-embedding the documents. The target still
needs the declared model for new query embeddings.

The project config demonstrates a provider-neutral `portable_bundle_store`.
Point its path to a local directory or an already synchronised OneDrive,
Google Drive, Dropbox, or Synology Drive folder. Git LFS and provider SDKs are
not required. Each collection receives versioned bundles and a checksummed
`latest.json` import receipt; do not commit live Qdrant storage.

The smoke query is German while the PDF is English. It verifies that the
multilingual semantic result contains `72 hours`, preserves
`PDF-SAMPLE-OVERVIEW-001`, filters `document_type=overview`, preserves the
source SHA-256, and exposes a `CITES_EVIDENCE` graph edge.

The smoke query asks how long the gateway buffers readings during an outage.
The expected candidate contains `72 hours` and Evidence ID
`PDF-SAMPLE-OVERVIEW-001`.

## Regenerate The PDF Fixtures

The PDFs are intentionally fictional and self-authored. Regenerate them from
the checked-in HTML fixtures with Microsoft Edge or Google Chrome:

```powershell
.\scripts\generate-pdfs.ps1
node .\scripts\update-source-hashes.mjs
```

Review and commit the resulting PDF and manifest changes together.

## Repository Layout

```text
.local-rag/                  Project config, source policy, evidence summary
fixtures/pdf-source/         Reproducible HTML used only to build test PDFs
sources/pdfs/                Committed RAG source PDFs
extracted/pdf-sample/        Curated PDF text with traceability metadata
documents/pdf-sample/        Curated manifest and lifecycle registry
indexes/                     Source map and evidence register
rag/config/                  Runtime chunking configuration
scripts/                     Extraction, runtime, and MCP smoke-test commands
tests/                       Structural sample validation
```

## Evidence Receipt

| Claim | Evidence | Type | Gap |
| --- | --- | --- | --- |
| PDFs are repository sources | `sources/pdfs/*.pdf` | Artifact | None |
| Extracts trace to exact PDFs | Source map, Evidence Register, SHA-256 manifest | Tool result | PDF text order depends on PDF.js extraction |
| Retrieval works through MCP | `npm test` and `npm run rag:kag:smoke` | Tool result | Model quality is corpus-dependent |
| Runtime PDF ingestion preserves page lineage | `npm run rag:pdf:integration` | Tool result | OCR and visual layout remain explicit gaps |
| Performance is reproducibly measurable | `npm run perf` and `benchmarks/` | Tool result | Timings are host- and cache-specific |
| Document lifecycle is registered | `documents/pdf-sample/document-registry.json` | Generated registry | Removal is demonstrated by Runtime unit tests, not by deleting committed fixtures |
| Fixture content may be redistributed | `sources/pdfs/LICENSE.md` | Supplied licence declaration | Not representative of third-party PDF rights |
