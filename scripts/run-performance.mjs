import path from "node:path";
import { spawnSync } from "node:child_process";
import { root, vectorPythonCommand } from "./runtime-paths.mjs";

const result = spawnSync(vectorPythonCommand(), [
  path.join(root, "scripts", "performance-sample.py"), ...process.argv.slice(2)
], { cwd: root, encoding: "utf8", stdio: "inherit", env: process.env });
process.exit(result.status ?? 1);
