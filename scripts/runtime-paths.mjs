import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function runtimeRoot() {
  const candidates = [
    process.env.AGENTKNOWLEDGE_RUNTIME_ROOT,
    path.resolve(root, "..", "AgentKnowledgeRuntime")
  ].filter(Boolean);
  const found = candidates.find((candidate) => fs.existsSync(path.join(candidate, "mcp-server", "server.py")));
  if (!found) {
    throw new Error("AgentKnowledgeRuntime not found; clone it beside this repo or set AGENTKNOWLEDGE_RUNTIME_ROOT");
  }
  return found;
}

export function pythonCommand() {
  const localPrograms = process.env.LOCALAPPDATA
    ? path.join(process.env.LOCALAPPDATA, "Programs", "Python")
    : null;
  const localCandidates = localPrograms && fs.existsSync(localPrograms)
    ? fs.readdirSync(localPrograms)
      .filter((name) => name.startsWith("Python"))
      .sort()
      .reverse()
      .map((name) => path.join(localPrograms, name, "python.exe"))
    : [];
  const candidates = [process.env.PYTHON, ...localCandidates, "python3", "python"].filter(Boolean);
  for (const candidate of candidates) {
    const result = spawnSync(candidate, ["--version"], { encoding: "utf8" });
    if (result.status === 0) return candidate;
  }
  throw new Error(`Python 3 not found for ${os.platform()}; install Python or set PYTHON`);
}

export function vectorPythonCommand() {
  const runtime = runtimeRoot();
  const candidate = process.platform === "win32"
    ? path.join(runtime, ".venv", "Scripts", "python.exe")
    : path.join(runtime, ".venv", "bin", "python");
  if (fs.existsSync(candidate)) return candidate;
  throw new Error(`Vector runtime not installed. Create ${path.join(runtime, ".venv")} and install requirements-vector.txt`);
}
