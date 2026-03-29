import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { initializeHarness } from "../src/commands/init.js";
import { runValidateHarness } from "../src/commands/validate-harness.js";

test("validate-harness reports missing files in an uninitialized repository", async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "codex-harness-kit-missing-"));
  const result = await runValidateHarness(repoRoot);

  assert.equal(result.ok, false);
  assert.match(result.output, /Missing `AGENTS\.md` or `AGENTS\.harness\.md`/u);
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
