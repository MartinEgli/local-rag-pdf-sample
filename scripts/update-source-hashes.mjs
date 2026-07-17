import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, "sources", "source-manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

for (const document of manifest.documents) {
  const pdfPath = path.join(root, "sources", document.file);
  const bytes = fs.readFileSync(pdfPath);
  document.sha256 = crypto.createHash("sha256").update(bytes).digest("hex");
}

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Updated ${manifest.documents.length} source hashes.`);

