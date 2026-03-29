import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, symlink } from "node:fs/promises";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import path from "node:path";

const execFileAsync = promisify(execFile);

test("cli runs correctly when invoked through a symlinked bin path", async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), "codex-harness-kit-cli-"));
  const repoRoot = await mkdtemp(path.join(tmpdir(), "codex-harness-kit-cli-repo-"));
  const symlinkPath = path.join(workspace, "codex-harness-kit");
  const cliEntry = path.resolve(process.cwd(), "dist/src/cli.js");

  await symlink(cliEntry, symlinkPath);

  const helpResult = await execFileAsync(process.execPath, [symlinkPath, "--help"], {
    cwd: workspace
  });
  assert.match(helpResult.stdout, /codex-harness-kit/u);

  await execFileAsync(process.execPath, [symlinkPath, "init", repoRoot], {
    cwd: workspace
  });

  const validateResult = await execFileAsync(process.execPath, [symlinkPath, "validate-harness", repoRoot], {
    cwd: workspace
  });
  assert.match(validateResult.stdout, /PASS/u);
});
