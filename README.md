# codex-harness-kit

`codex-harness-kit` is a lightweight CLI plus scaffold for making any repository easier to run with a harness-style Codex workflow.

It does not try to become a new agent platform. v1 is intentionally small and only helps with five things:

1. state recovery
2. project memory
3. decision logging
4. task contracts
5. a minimal validation entrypoint

## What Problem It Solves

Long Codex tasks break down when context lives only in chat history. New threads lose the current goal, scope drifts mid-task, repeated failures trigger more guessing, and important decisions disappear.

This toolkit moves the durable parts of the workflow into repository files so a new thread can recover context from the repo itself before writing code.

## Why It Fits Long Tasks and Multi-Thread Collaboration

The harness files make the repo readable by both humans and Codex:

- `docs/harness-state.json` stores the current goal, status, blockers, contract, and last verification result.
- `docs/project-memory.md` stores durable preferences and recurring pitfalls.
- `docs/decisions.md` stores explicit trade-offs and decisions.
- `docs/contracts/` stores task contracts with acceptance and validation notes.
- `AGENTS.md` or `AGENTS.harness.md` tells Codex to restore state first, validate after edits, and stop blind retries after repeated failures.

That means a new thread can start with repository context instead of trying to reconstruct intent from old messages.

## Non-Goals

v1 deliberately does not include:

- multi-agent orchestration
- a background daemon
- a web UI
- a database
- cloud services
- automatic file watching
- plugin or MCP ecosystems
- a new chat interface

## Install and Run

This repository is npm-ready but not published in this iteration.

Local development:

```bash
npm install
npm run build
node dist/src/cli.js --help
```

After linking locally:

```bash
npm link
codex-harness-kit --help
```

After future npm publication, the intended usage is:

```bash
npx codex-harness-kit init
```

## CLI Commands

```bash
codex-harness-kit init [path] [--force]
codex-harness-kit check-state [path]
codex-harness-kit validate-harness [path]
```

### `init`

Generates the minimal harness files in the current directory or a target path.

Files created by default:

- `AGENTS.md` or `AGENTS.harness.md`
- `docs/harness-config.json`
- `docs/harness-state.json`
- `docs/project-memory.md`
- `docs/decisions.md`
- `docs/contracts/README.md`
- `docs/contracts/example-contract.md`

Safety behavior:

- Existing files are not overwritten by default.
- Re-running `init` is safe and mostly results in `unchanged` or `skipped` outcomes.
- If the target repo already has an `AGENTS.md`, this tool preserves it and writes `AGENTS.harness.md` instead.
- Use `--force` only when you explicitly want harness-managed files overwritten.

### `check-state`

Reads the harness config and state, then prints a concise summary:

- current goal
- current status
- current contract
- blockers
- most recent verification result
- next step suggestion

If files are missing or invalid, it prints a clear error plus a recovery hint.

### `validate-harness`

Checks that the key harness files exist, required JSON is valid, and required fields are present.

## Initialize an Empty Repo

Inside the target repository:

```bash
codex-harness-kit init
```

Or from elsewhere:

```bash
codex-harness-kit init /path/to/repo
```

## Initialize an Existing Repo

Run the same `init` command in the existing repo. If the repo already has its own `AGENTS.md`, the tool keeps that file untouched and creates `AGENTS.harness.md` for manual merge or side-by-side use.

## What to Tell Codex After Initialization

These prompts are intentionally simple. The harness files carry the durable details.

Minimal examples:

- `恢复状态并继续`
- `先更新 contract，再实现`
- `先别改代码，告诉我当前阻塞`
- `把这个决定记进项目记忆`

Equivalent English examples:

- `Restore state and continue.`
- `Update the contract first, then implement.`
- `Do not change code yet; tell me the current blockers.`
- `Write this decision into project memory.`

## Recommended Codex Workflow

1. Start by restoring state from the harness files.
2. Update the contract if scope or acceptance changed.
3. Implement only the scoped task.
4. Run the smallest meaningful validation command.
5. Update state, memory, or decisions before ending the thread.

## Customizing Validation Commands

Edit `docs/harness-config.json` after initialization:

```json
{
  "commands": {
    "verifyQuick": "npm test",
    "verifyFull": "npm run verify",
    "docsGenerate": ""
  }
}
```

`check-state` and the `AGENTS` rules assume these commands describe the repo's minimal and fuller validation steps.

## Using It in Other Projects

Until this package is published, the simplest options are:

1. clone this repo
2. run `npm install && npm run build`
3. use `node /path/to/codex-harness-kit/dist/src/cli.js init /path/to/target-repo`

Or link it globally with `npm link`.

## Assumptions in v1

- The default layout uses `docs/` because it stays readable in ordinary repos.
- JSON stays intentionally small and explicit instead of introducing a DSL.
- Validation commands are configured by the repository owner; the toolkit does not guess them.

## Development

```bash
npm run build
npm run typecheck
npm test
npm run verify
```

`npm run verify` currently runs:

1. TypeScript typecheck
2. build
3. Node built-in tests

## Current Limitations

- `check-state` summarizes the active contract path and title, but it does not parse acceptance criteria yet.
- `validate-harness` only validates the minimal v1 file set.
- The CLI does not edit state or contracts for you; it scaffolds and validates the workflow.
