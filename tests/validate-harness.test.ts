import test from "node:test";
import assert from "node:assert/strict";
import { cp, mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { initializeHarness } from "../src/commands/init.js";
import { runValidateHarness } from "../src/commands/validate-harness.js";

test("validate-harness reports missing files in an uninitialized repository", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "codex-harness-kit-missing-"));
  const result = await runValidateHarness(repoRoot);

  assert.equal(result.ok, false);
  assert.match(result.output, /Missing `AGENTS\.md`/u);
  assert.match(result.output, /Missing harness config file/u);
});

test("validate-harness reports invalid JSON in the state file", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "codex-harness-kit-invalid-json-"));
  await initializeHarness({ targetPath: repoRoot });

  await writeFile(path.join(repoRoot, "docs/harness-state.json"), "{\n  \"currentGoal\":\n", "utf8");

  const result = await runValidateHarness(repoRoot);

  assert.equal(result.ok, false);
  assert.match(result.output, /docs\/harness-state\.json: Invalid JSON/u);
});

test("validate-harness fails when a sidecar exists but AGENTS.md does not activate it", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "codex-harness-kit-inactive-"));
  const agentsPath = path.join(repoRoot, "AGENTS.md");
  await writeFile(agentsPath, "# Existing Rules\n\nNo harness here.\n", "utf8");
  await initializeHarness({ targetPath: repoRoot });

  await writeFile(agentsPath, "# Existing Rules\n\nStill no harness bridge.\n", "utf8");

  const result = await runValidateHarness(repoRoot);

  assert.equal(result.ok, false);
  assert.match(
    result.output,
    /AGENTS\.harness\.md` exists, but `AGENTS\.md` does not activate it with a codex-harness-kit bridge or merged harness block/u
  );
});

test("validate-harness passes when an existing AGENTS.md has been bridged", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "codex-harness-kit-bridge-pass-"));
  await writeFile(path.join(repoRoot, "AGENTS.md"), "# Repo Rules\n\nKeep me.\n", "utf8");
  await initializeHarness({ targetPath: repoRoot });

  const result = await runValidateHarness(repoRoot);

  assert.equal(result.ok, true);
  assert.match(result.output, /^Harness validation .*?\nPASS/mu);
});

test("validate-harness follows custom configured paths and AGENTS stays config-driven", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "codex-harness-kit-custom-paths-"));
  await initializeHarness({ targetPath: repoRoot });

  const configPath = path.join(repoRoot, "docs/harness-config.json");
  const statePath = path.join(repoRoot, "docs/harness-state.json");
  const config = JSON.parse(await readFile(configPath, "utf8")) as {
    paths: {
      stateFile: string;
      memoryFile: string;
      decisionsFile: string;
      contractsDir: string;
    };
  };
  const state = JSON.parse(await readFile(statePath, "utf8")) as {
    currentContract: string;
  };

  config.paths = {
    stateFile: ".codex-harness/state.json",
    memoryFile: ".codex-harness/memory.md",
    decisionsFile: ".codex-harness/decisions.md",
    contractsDir: ".codex-harness/contracts"
  };
  state.currentContract = ".codex-harness/contracts/example-contract.md";

  await mkdir(path.join(repoRoot, ".codex-harness/contracts"), { recursive: true });
  await cp(path.join(repoRoot, "docs/harness-state.json"), path.join(repoRoot, ".codex-harness/state.json"));
  await cp(path.join(repoRoot, "docs/project-memory.md"), path.join(repoRoot, ".codex-harness/memory.md"));
  await cp(path.join(repoRoot, "docs/decisions.md"), path.join(repoRoot, ".codex-harness/decisions.md"));
  await cp(
    path.join(repoRoot, "docs/contracts/README.md"),
    path.join(repoRoot, ".codex-harness/contracts/README.md")
  );
  await cp(
    path.join(repoRoot, "docs/contracts/example-contract.md"),
    path.join(repoRoot, ".codex-harness/contracts/example-contract.md")
  );

  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  await writeFile(path.join(repoRoot, ".codex-harness/state.json"), `${JSON.stringify(state, null, 2)}\n`, "utf8");

  const result = await runValidateHarness(repoRoot);
  const agentsContent = await readFile(path.join(repoRoot, "AGENTS.md"), "utf8");

  assert.equal(result.ok, true);
  assert.match(agentsContent, /paths\.stateFile/u);
  assert.doesNotMatch(agentsContent, /docs\/harness-state\.json/u);
});
