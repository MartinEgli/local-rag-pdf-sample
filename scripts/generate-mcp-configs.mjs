import path from "node:path";
import { spawnSync } from "node:child_process";
import { pythonCommand, root, runtimeRoot } from "./runtime-paths.mjs";

const output = path.join(root, ".local-rag", "mcp-clients");
const result = spawnSync(pythonCommand(), [
  path.join(runtimeRoot(), "mcp-server", "generate-client-configs.py"),
  "--runtime-root", runtimeRoot(), "--knowledge-root", root, "--output", output,
  "--python-command", pythonCommand()
], { cwd: root, encoding: "utf8", stdio: "inherit" });
process.exit(result.status ?? 1);
