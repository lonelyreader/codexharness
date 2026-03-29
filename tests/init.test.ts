import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { initializeHarness } from "../src/commands/init.js";
import { pathExists } from "../src/harness.js";

test("init generates the harness files in an empty directory", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "codex-harness-kit-init-"));
  const result = await initializeHarness({ targetPath: repoRoot });

  assert.equal(result.actions.some((action) => action.file === "AGENTS.md"), true);

  const expectedFiles = [
    "AGENTS.md",
    "docs/harness-config.json",
    "docs/harness-state.json",
    "docs/project-memory.md",
    "docs/decisions.md",
    "docs/contracts/README.md",
    "docs/contracts/example-contract.md"
  ];

  for (const relativePath of expectedFiles) {
    assert.equal(await pathExists(path.join(repoRoot, relativePath)), true, `${relativePath} should exist`);
  }
});

test("init preserves an existing AGENTS.md and writes AGENTS.harness.md instead", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "codex-harness-kit-agents-"));
  const agentsPath = path.join(repoRoot, "AGENTS.md");
  const customAgents = "# Custom Agents\n\nDo not overwrite me.\n";

  await initializeHarness({ targetPath: repoRoot });
  await import("node:fs/promises").then(({ writeFile }) => writeFile(agentsPath, customAgents, "utf8"));

  const result = await initializeHarness({ targetPath: repoRoot });
  const preservedAgents = await readFile(agentsPath, "utf8");

  assert.equal(preservedAgents, customAgents);
  assert.equal(await pathExists(path.join(repoRoot, "AGENTS.harness.md")), true);
  assert.equal(result.notes.some((note) => note.includes("Existing AGENTS.md was preserved")), true);
});
