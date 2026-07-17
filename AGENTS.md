# Local RAG Sample Policy

- Use `local-rag` when answering questions that depend on the committed PDFs
  under `sources/pdfs/`.
- Ingest only `sources/pdfs/`; do not ingest `.git`, `node_modules`, generated
  indexes, credentials, or unrelated local files.
- Treat retrieved chunks as candidates. Verify important claims against the
  PDF, its curated extract, `indexes/source-map.md`, and
  `indexes/evidence-register.md`.
- Preserve Source IDs, Evidence IDs, exact filenames, hashes, assumptions, and
  gaps.
- Keep `documents/pdf-sample/document-registry.json` aligned with the PDF
  manifest and curated extracts. Preserve lifecycle tombstones, Document IDs,
  SHA-256, categories, and attributes through chunks and retrieval.
- Rebuild the chunk index, Qdrant collection, and graph after document content,
  lifecycle, categories, or attributes change.
- Use a domain skill after retrieval when interpretation goes beyond locating
  facts in the sample documents.
- Start MCP through the sibling `AgentKnowledgeRuntime` repository or set
  `AGENTKNOWLEDGE_RUNTIME_ROOT` explicitly.
