# Performance Baselines

These receipts record two successful runs on 2026-07-17:

- `json-baseline-2026-07-17.json`: 250 synthetic documents, 500 chunks, and
  100 dependency-free queries.
- `semantic-baseline-2026-07-17.json`: the two committed PDFs, persistent local
  Qdrant, FastEmbed 0.8.0, SQLite graph expansion, and 20 warm queries.

They are comparison evidence for the recorded Windows host only. They are not
portable latency guarantees. Re-run both suites after changing extraction,
chunking, model, dependency versions, vector backend, or graph expansion.
