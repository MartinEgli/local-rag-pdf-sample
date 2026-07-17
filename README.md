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
- Generated `.local-rag-index/` data remains local and unversioned.

The runtime currently uses its local JSON hash-vector demo backend. This sample
does not claim semantic-embedding quality or production vector-store
durability.

## Prerequisites

- Node.js 22.13+ or 24+
- Python 3.13 or another Python 3 version supported by
  `AgentKnowledgeRuntime`
- A sibling clone at `../AgentKnowledgeRuntime`, or the environment variable
  `AGENTKNOWLEDGE_RUNTIME_ROOT`

```powershell
git clone https://github.com/MartinEgli/AgentKnowledgeRuntime.git ..\AgentKnowledgeRuntime
npm install
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
| Retrieval works through MCP | `npm test` smoke-test output | Tool result | Demo hash-vector backend only |
| Fixture content may be redistributed | `sources/pdfs/LICENSE.md` | Supplied licence declaration | Not representative of third-party PDF rights |

