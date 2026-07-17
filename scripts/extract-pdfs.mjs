import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "sources", "source-manifest.json"), "utf8"));
const extractRoot = path.join(root, "extracted", "pdf-sample");
fs.mkdirSync(extractRoot, { recursive: true });

const sourceRows = [];
const evidenceRows = [];
const projectSourceRows = [];
const projectEvidenceRows = [];

for (const document of manifest.documents) {
  const pdfPath = path.join(root, "sources", document.file);
  const bytes = fs.readFileSync(pdfPath);
  const hash = crypto.createHash("sha256").update(bytes).digest("hex");
  if (hash !== document.sha256) {
    throw new Error(`${document.file}: SHA-256 mismatch; run scripts/update-source-hashes.mjs after an intentional PDF change`);
  }

  const pdf = await getDocument({ data: new Uint8Array(bytes), disableWorker: true }).promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items.map((item) => item.str || "").join(" ").replace(/\s+/g, " ").trim();
    pages.push(`## Page ${pageNumber}\n\nEvidence ID: \`${document.evidence_id}\`\n\n${text}`);
  }

  const basename = path.basename(document.file, ".pdf");
  const extractRelative = `extracted/pdf-sample/${basename}.md`;
  const sourceRelative = `sources/${document.file.replaceAll("\\", "/")}`;
  const markdown = [
    `# ${document.title}`,
    "",
    "## Source Identity",
    "",
    `- Source ID: \`${document.source_id}\``,
    `- Evidence ID: \`${document.evidence_id}\``,
    `- PDF: \`${sourceRelative}\``,
    `- SHA-256: \`${hash}\``,
    `- Pages: ${pdf.numPages}`,
    "",
    "## Extracted Content",
    "",
    ...pages,
    "",
    "## Evidence Receipt",
    "",
    `- Evidence: \`${document.evidence_id}\` extracted from \`${sourceRelative}\`.`,
    "- Inference: none.",
    "- Assumption: PDF.js reading order represents the intended document order.",
    "- Gap: visual layout is not represented in the text index.",
    ""
  ].join("\n");
  fs.writeFileSync(path.join(extractRoot, `${basename}.md`), markdown);

  sourceRows.push(`| \`${extractRelative}\` | \`${document.source_id}\` | \`${document.evidence_id}\` | \`${sourceRelative}\` | \`${hash}\` | PDF.js text extraction |`);
  evidenceRows.push(`| \`${document.evidence_id}\` | \`${document.source_id}\` | Self-authored PDF fixture | High | Extracted | \`${extractRelative}\` | Visual layout excluded from index |`);
  projectSourceRows.push(`| \`${document.source_id}\` | \`${sourceRelative}\` | Approved, committed, CC0 fixture |`);
  projectEvidenceRows.push(`| \`${document.evidence_id}\` | \`${document.source_id}\` | High | Extracted and hash-verified |`);
}

const sourceMap = [
  "# Source Map", "",
  "| Extract | Source ID | Evidence ID | PDF Source | SHA-256 | Method |",
  "| --- | --- | --- | --- | --- | --- |",
  ...sourceRows, ""
].join("\n");
const evidenceRegister = [
  "# Evidence Register", "",
  "| Evidence ID | Source ID | Type | Confidence | Status | Extract | Gap |",
  "| --- | --- | --- | --- | --- | --- | --- |",
  ...evidenceRows, ""
].join("\n");
const projectSources = [
  "# RAG Sources", "",
  "| Source ID | Path | Approval |", "| --- | --- | --- |",
  ...projectSourceRows, ""
].join("\n");
const projectEvidence = [
  "# RAG Evidence", "",
  "| Evidence ID | Source ID | Confidence | Status |", "| --- | --- | --- | --- |",
  ...projectEvidenceRows, "",
  "Canonical detail: `indexes/evidence-register.md`.", ""
].join("\n");

fs.mkdirSync(path.join(root, "indexes"), { recursive: true });
fs.writeFileSync(path.join(root, "indexes", "source-map.md"), sourceMap);
fs.writeFileSync(path.join(root, "indexes", "evidence-register.md"), evidenceRegister);
fs.writeFileSync(path.join(root, ".local-rag", "rag.sources.md"), projectSources);
fs.writeFileSync(path.join(root, ".local-rag", "rag.evidence.md"), projectEvidence);
console.log(`Extracted ${manifest.documents.length} PDFs with stable evidence IDs.`);
