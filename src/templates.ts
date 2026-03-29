import type { HarnessConfig, HarnessState } from "./types.js";

export const DEFAULT_CONFIG_PATH = "docs/harness-config.json";
export const HARNESS_MARKER_START = "<!-- codex-harness-kit:start -->";
export const HARNESS_MARKER_END = "<!-- codex-harness-kit:end -->";

export function createDefaultConfig(): HarnessConfig {
  return {
    version: 1,
    paths: {
      stateFile: "docs/harness-state.json",
      memoryFile: "docs/project-memory.md",
      decisionsFile: "docs/decisions.md",
      contractsDir: "docs/contracts"
    },
    commands: {
      verifyQuick: "",
      verifyFull: "",
      docsGenerate: ""
    },
    rules: {
      maxRepeatedFailures: 2
    }
  };
}

export function createDefaultState(now = new Date()): HarnessState {
  return {
    currentGoal: "",
    status: "idle",
    currentContract: "docs/contracts/example-contract.md",
    blockers: [],
    nextStep: "Update the current goal and contract before making code changes.",
    lastUpdated: now.toISOString(),
    verification: {
      lastCommand: "",
      lastResult: "unknown",
      notes: "No verification has been recorded yet."
    }
  };
}

export function renderJsonFile(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function renderAgentsTemplate(): string {
  return `${HARNESS_MARKER_START}
# AGENTS

## Codex Harness Workflow

1. Before changing code, read these files in order:
   - \`docs/harness-config.json\`
   - \`docs/harness-state.json\`
   - the active contract referenced by \`currentContract\`
   - \`docs/decisions.md\`
   - \`docs/project-memory.md\`
2. Restore state before editing. Do not jump straight into implementation.
3. Keep the contract current. If scope or acceptance changes, update the contract before more code changes.
4. After edits, run the smallest meaningful verification command and record the result in \`docs/harness-state.json\`.
5. If the same class of failure happens twice in a row, stop trial-and-error and write a short diagnosis with evidence, suspected root cause, and the safest next move.
6. Capture durable context:
   - long-lived preferences and quirks go in \`docs/project-memory.md\`
   - explicit trade-offs and architectural choices go in \`docs/decisions.md\`
7. Final responses must always say:
   - what changed
   - what verification ran
   - what verification did not run

## Restore Prompt

When a new Codex thread starts, begin by reading the harness files above. A good prompt is:

> Restore state and continue from the harness files before making changes.

## Guardrails

- Prefer the existing repo layout over inventing a new framework.
- Keep this harness lightweight; do not turn it into a platform.
- If validation is not configured yet, say so explicitly instead of claiming full verification.
${HARNESS_MARKER_END}
`;
}

export function renderProjectMemoryTemplate(): string {
  return `# Project Memory

Use this file for durable context that should survive across threads.

## Product and Repo Context

- What this repository is for.
- Constraints that matter every time.

## Working Preferences

- Coding style choices that are stable over time.
- Review preferences or release expectations.

## Known Pitfalls

- Repeated mistakes, flaky areas, or environment traps.

## Open Questions Worth Tracking

- Questions that are not blockers today but should not disappear.
`;
}

export function renderDecisionsTemplate(): string {
  return `# Decisions

Record notable technical or product decisions here so they do not live only in chat history.

## Entry Template

### YYYY-MM-DD - Short Decision Title

- Context:
- Decision:
- Consequences:
- Follow-up:
`;
}

export function renderContractsReadmeTemplate(): string {
  return `# Contracts

Contracts define the current unit of work before code changes begin.

Each contract should answer:

1. What is being changed right now?
2. What is explicitly out of scope?
3. How will we know it is done?
4. What is the smallest verification that proves progress?

Suggested flow:

1. Update or create a contract.
2. Point \`docs/harness-state.json\` at that contract.
3. Implement against the contract.
4. Run verification.
5. Update state and decisions.
`;
}

export function renderExampleContractTemplate(): string {
  return `# Example Contract

## Goal

Describe the current objective in one or two sentences.

## In Scope

- The smallest changes that count as success.

## Out of Scope

- Anything intentionally deferred.

## Acceptance Criteria

- A reader can tell whether the task is done.
- Validation steps are explicit.

## Verification Plan

- Quick check:
- Full check:

## Notes

- Risks, assumptions, or sequencing notes.
`;
}
