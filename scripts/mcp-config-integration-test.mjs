import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { pythonCommand, root, runtimeRoot } from "./runtime-paths.mjs";

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "local-rag-mcp-configs-"));
try {
  const result = spawnSync(pythonCommand(), [
    path.join(runtimeRoot(), "mcp-server", "generate-client-configs.py"),
    "--knowledge-root", root, "--output", temporary, "--python-command", pythonCommand()
  ], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  for (const client of ["claude", "cursor", "windsurf", "cline"]) {
    const payload = JSON.parse(fs.readFileSync(path.join(temporary, `${client}.mcp.json`), "utf8"));
    const server = payload.mcpServers["local-rag"];
    assert.equal(server.args.at(-1), root);
    assert.equal(server.args.at(-2), "--knowledge-root");
    assert.ok(fs.existsSync(server.args[0]));
  }
  const codex = fs.readFileSync(path.join(temporary, "codex.config.toml"), "utf8");
  assert.match(codex, /\[mcp_servers\.local-rag\]/);
  assert.match(codex, /--knowledge-root/);
  console.log("MCP client configuration integration passed: 5 clients.");
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
