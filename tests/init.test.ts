import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { initializeHarness } from "../src/commands/init.js";
import { pathExists } from "../src/harness.js";
import {
  HARNESS_BRIDGE_MARKER_END,
  HARNESS_BRIDGE_MARKER_START,
  HARNESS_MARKER_END,
  HARNESS_MARKER_START
} from "../src/templates.js";

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

test("init writes AGENTS guidance for stale-thread recovery and task wrap-up", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "codex-harness-kit-agents-guidance-"));
  await initializeHarness({ targetPath: repoRoot });

  const agentsContent = await readFile(path.join(repoRoot, "AGENTS.md"), "utf8");

  assert.match(agentsContent, /ignore stale chat context until the harness files below have been reread/u);
  assert.match(agentsContent, /Before ending any meaningful task, update the configured state file/u);
  assert.match(agentsContent, /whether the harness state, decisions, or project memory were updated/u);
});

test("init safely activates harness in an existing AGENTS.md repository", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "codex-harness-kit-agents-"));
  const agentsPath = path.join(repoRoot, "AGENTS.md");
  const customAgents = "# Custom Agents\n\nDo not overwrite me.\n";

  await writeFile(agentsPath, customAgents, "utf8");

  const result = await initializeHarness({ targetPath: repoRoot });
  const preservedAgents = await readFile(agentsPath, "utf8");
  const harnessAgents = await readFile(path.join(repoRoot, "AGENTS.harness.md"), "utf8");

  assert.match(preservedAgents, /# Custom Agents/u);
  assert.match(preservedAgents, new RegExp(escapeForRegExp(HARNESS_BRIDGE_MARKER_START), "u"));
  assert.match(preservedAgents, new RegExp(escapeForRegExp(HARNESS_BRIDGE_MARKER_END), "u"));
  assert.match(preservedAgents, /ignore stale chat context until the harness files have been reread/u);
  assert.equal(await pathExists(path.join(repoRoot, "AGENTS.harness.md")), true);
  assert.match(harnessAgents, new RegExp(escapeForRegExp(HARNESS_MARKER_START), "u"));
  assert.match(harnessAgents, new RegExp(escapeForRegExp(HARNESS_MARKER_END), "u"));
  assert.match(harnessAgents, /Before ending any meaningful task, update the configured state file/u);
  assert.equal(result.notes.some((note) => note.includes("activation bridge")), true);
});

test("init does not duplicate the harness bridge on repeated runs", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "codex-harness-kit-idempotent-"));
  const agentsPath = path.join(repoRoot, "AGENTS.md");
  await writeFile(agentsPath, "# Team Rules\n\nKeep this heading.\n", "utf8");

  await initializeHarness({ targetPath: repoRoot });
  await initializeHarness({ targetPath: repoRoot });

  const agentsContent = await readFile(agentsPath, "utf8");

  assert.equal(countOccurrences(agentsContent, HARNESS_BRIDGE_MARKER_START), 1);
  assert.equal(countOccurrences(agentsContent, HARNESS_BRIDGE_MARKER_END), 1);
  assert.match(agentsContent, /# Team Rules/u);
});

function countOccurrences(content: string, needle: string): number {
  return content.split(needle).length - 1;
}

function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
