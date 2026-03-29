import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  createDefaultConfig,
  createDefaultState,
  renderAgentsTemplate,
  renderContractsReadmeTemplate,
  renderDecisionsTemplate,
  renderExampleContractTemplate,
  renderJsonFile,
  renderProjectMemoryTemplate
} from "../templates.js";
import {
  ensureParentDirectory,
  pathExists,
  relativeToRepo
} from "../harness.js";
import type { FileAction, InitResult } from "../types.js";

export interface InitOptions {
  targetPath?: string;
  force?: boolean;
}

export async function initializeHarness(options: InitOptions = {}): Promise<InitResult> {
  const repoRoot = path.resolve(options.targetPath ?? process.cwd());
  await mkdir(repoRoot, { recursive: true });

  const actions: FileAction[] = [];
  const notes: string[] = [];
  const force = options.force ?? false;

  const templates = new Map<string, string>([
    ["docs/harness-config.json", renderJsonFile(createDefaultConfig())],
    ["docs/harness-state.json", renderJsonFile(createDefaultState())],
    ["docs/project-memory.md", renderProjectMemoryTemplate()],
    ["docs/decisions.md", renderDecisionsTemplate()],
    ["docs/contracts/README.md", renderContractsReadmeTemplate()],
    ["docs/contracts/example-contract.md", renderExampleContractTemplate()]
  ]);

  const agentsAction = await writeAgentsFile(repoRoot, force);
  actions.push(agentsAction.action);
  notes.push(...agentsAction.notes);

  for (const [relativePath, content] of templates) {
    const absolutePath = path.join(repoRoot, relativePath);
    actions.push(await writeTextFileSafely(repoRoot, absolutePath, content, force));
  }

  return {
    repoRoot,
    actions,
    notes
  };
}

async function writeAgentsFile(
  repoRoot: string,
  force: boolean
): Promise<{ action: FileAction; notes: string[] }> {
  const agentsPath = path.join(repoRoot, "AGENTS.md");
  const harnessAgentsPath = path.join(repoRoot, "AGENTS.harness.md");
  const content = renderAgentsTemplate();

  if (!(await pathExists(agentsPath))) {
    const action = await writeTextFileSafely(repoRoot, agentsPath, content, force);
    return { action, notes: [] };
  }

  const existingAgents = await readFile(agentsPath, "utf8");
  if (existingAgents === content) {
    return {
      action: {
        file: "AGENTS.md",
        status: "unchanged"
      },
      notes: []
    };
  }

  const action = await writeTextFileSafely(repoRoot, harnessAgentsPath, content, force);
  const notes = [
    "Existing AGENTS.md was preserved. Harness instructions were written to AGENTS.harness.md so you can merge them manually if desired."
  ];
  return { action, notes };
}

async function writeTextFileSafely(
  repoRoot: string,
  absolutePath: string,
  content: string,
  force: boolean
): Promise<FileAction> {
  const relativePath = relativeToRepo(repoRoot, absolutePath);
  if (!(await pathExists(absolutePath))) {
    await ensureParentDirectory(absolutePath);
    await writeFile(absolutePath, content, "utf8");
    return {
      file: relativePath,
      status: "created"
    };
  }

  const existing = await readFile(absolutePath, "utf8");
  if (existing === content) {
    return {
      file: relativePath,
      status: "unchanged"
    };
  }

  if (!force) {
    return {
      file: relativePath,
      status: "skipped",
      reason: "File already exists. Re-run with --force to overwrite the harness-managed version."
    };
  }

  await ensureParentDirectory(absolutePath);
  await writeFile(absolutePath, content, "utf8");
  return {
    file: relativePath,
    status: "updated",
    reason: "Overwritten because --force was provided."
  };
}

export function renderInitResult(result: InitResult): string {
  const lines: string[] = [];
  lines.push(`Initialized codex-harness-kit in ${result.repoRoot}`);
  for (const action of result.actions) {
    const suffix = action.reason ? ` (${action.reason})` : "";
    lines.push(`- ${action.status}: ${action.file}${suffix}`);
  }

  if (result.notes.length > 0) {
    lines.push("");
    lines.push("Notes:");
    for (const note of result.notes) {
      lines.push(`- ${note}`);
    }
  }

  return lines.join("\n");
}
