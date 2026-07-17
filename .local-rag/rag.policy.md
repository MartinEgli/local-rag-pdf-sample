# RAG Policy

- Only PDFs under `sources/pdfs/` are approved for ingestion.
- The fixtures are self-authored and intentionally fictional.
- Do not ingest credentials, personal data, customer data, or unrelated files.
- Treat retrieval results as candidates, not final truth.
- Verify important claims against the PDF, curated extract, source map, and
  evidence register.
- Keep `.local-rag-index/` local and rebuildable.

