import path from "node:path";
import { spawnSync } from "node:child_process";
import { pythonCommand, root, runtimeRoot } from "./runtime-paths.mjs";

const mode = process.argv[2];
const runtime = runtimeRoot();
const python = pythonCommand();
const script = mode === "build" ? "build-index.py" : "query-index.py";
const args = [
  path.join(runtime, "rag", "ingest", script),
  "--knowledge-root", root,
  "--domain", "pdf-sample"
];
if (mode === "query") {
  args.push("--query", "How long does the gateway buffer readings during a network outage?", "--top-k", "3");
} else if (mode !== "build") {
  throw new Error("Usage: node scripts/runtime-cli.mjs <build|query>");
}

const result = spawnSync(python, args, { cwd: root, encoding: "utf8", stdio: "inherit" });
process.exit(result.status ?? 1);

