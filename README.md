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
- `AGENTS.md` is the active instruction source. In repos that already have a custom `AGENTS.md`, the tool adds a small activation bridge there and writes the detailed harness rules to `AGENTS.harness.md`.

That means a new thread can start with repository context instead of trying to reconstruct intent from old messages.

The generated `AGENTS` templates also tell Codex to ignore stale thread context until it has reread the harness files, and to close each meaningful task by updating harness state plus any durable decision or memory records.

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

This repository is npm-ready. If you are using the source repo directly, use the local development path below. After the package is published, the npm install path becomes available.

Published package, after release:

```bash
npx codex-harness-kit init
```

Local development from this repository:

```bash
npm install
npm run build
node dist/src/cli.js --help
```

Or link the local checkout:

```bash
npm link
codex-harness-kit --help
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

- `AGENTS.md`
- `docs/harness-config.json`
- `docs/harness-state.json`
- `docs/project-memory.md`
- `docs/decisions.md`
- `docs/contracts/README.md`
- `docs/contracts/example-contract.md`

When the target repo already has its own `AGENTS.md`, `init` also writes:

- `AGENTS.harness.md`

Safety behavior:

- Existing files are not overwritten by default.
- Re-running `init` is safe and mostly results in `unchanged` or `skipped` outcomes.
- If the target repo already has an `AGENTS.md`, this tool preserves the existing content and appends a marker-based activation bridge to that file.
- In that same case, the detailed harness rules are written to `AGENTS.harness.md`.
- Re-running `init` does not duplicate the bridge block.
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

Checks that the key harness files exist, required JSON is valid, required fields are present, and the harness is actually activated in `AGENTS.md`.

It does not stop at marker detection. The validator also checks that the codex-harness-kit bridge block and harness block still contain non-empty, recognizable activation/workflow content.

That means `validate-harness` now fails when:

- there is a plain `AGENTS.md` with no codex-harness-kit block
- `AGENTS.harness.md` exists but `AGENTS.md` does not bridge or merge it
- the bridge exists but the harness supplement file is missing or malformed
- the bridge or harness markers still exist, but their actual instructions were hand-edited away and left as empty shells

## Initialize an Empty Repo

Fastest first-use path after installation:

```bash
codex-harness-kit init
codex-harness-kit check-state
codex-harness-kit validate-harness
```

Inside the target repository:

```bash
codex-harness-kit init
```

Or from elsewhere:

```bash
codex-harness-kit init /path/to/repo
```

## Initialize an Existing Repo

Run the same `init` command in the existing repo.

If the repo already has its own `AGENTS.md`, the tool:

1. preserves the existing content
2. appends a clearly marked codex-harness-kit activation bridge to `AGENTS.md`
3. writes the detailed harness workflow to `AGENTS.harness.md`

This keeps the repo safe and readable while still making the harness an active instruction source instead of an ignored sidecar.

## What Counts as "Harness Activated"

The harness is considered activated only when `AGENTS.md` explicitly includes codex-harness-kit instructions.

There are two valid states:

1. `AGENTS.md` contains the full codex-harness-kit harness block.
2. `AGENTS.md` contains the codex-harness-kit bridge block and that bridge points to a valid `AGENTS.harness.md`.

Having an unrelated `AGENTS.md` file is not enough. Having only `AGENTS.harness.md` is not enough either.

## What to Tell Codex After Initialization

These prompts are intentionally simple. The harness files carry the durable details.

Minimal examples:

- `恢复状态并继续`
- `先更新 contract，再实现`
- `先别改代码，告诉我当前阻塞`
- `把这个决定记进项目记忆`
- `忽略旧线程上下文，重新从 harness 恢复状态后继续`
- `先收尾，更新 harness-state，并汇报验证结果和下一步`

Equivalent English examples:

- `Restore state and continue.`
- `Update the contract first, then implement.`
- `Do not change code yet; tell me the current blockers.`
- `Write this decision into project memory.`
- `Ignore old thread context, restore state from the harness files, then continue.`
- `Wrap up by updating harness-state, then report verification and next steps.`

## Recommended Codex Workflow

1. Start by restoring state from the harness files.
2. Update the contract if scope or acceptance changed.
3. Implement only the scoped task.
4. Run the smallest meaningful validation command.
5. Before ending the thread, update state and any durable decision or memory records.

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

## Path Configuration and Recovery

The fixed entrypoint is `docs/harness-config.json`.

The `AGENTS` instructions intentionally tell Codex to read that config first, then follow:

- `paths.stateFile`
- `paths.memoryFile`
- `paths.decisionsFile`
- `paths.contractsDir`

So if you later move the state or memory files, update `docs/harness-config.json` and the harness instructions still hold. The active contract path in the state file should also be updated if contract files move.

## If Initialization Did Not Activate the Harness

Run:

```bash
codex-harness-kit validate-harness
```

If validation fails on activation:

1. rerun `codex-harness-kit init`
2. check that `AGENTS.md` contains the codex-harness-kit block or bridge markers
3. if the repo uses a bridge, check that `AGENTS.harness.md` exists and still contains the harness-managed block

## Using It in Other Projects

Until this package is published, the simplest options are:

1. clone this repo
2. run `npm install && npm run build`
3. use `node /path/to/codex-harness-kit/dist/src/cli.js init /path/to/target-repo`

Or link it globally with `npm link`.

## Optional Local Codex Skills

This repository also includes two optional local Codex skills under
[`extras/codex-skills/`](/Users/gexu/Desktop/codexharness/extras/codex-skills/README.md):

- `codex-harness-workflow`
- `codex-harness-wrap-up`

These are convenience shortcuts for people who use Codex locally and want
shorter start/end prompts. They are not part of the npm package contract, and
the main product still remains:

- the CLI
- the generated repository files
- the `AGENTS.md` workflow

To install them manually into a local Codex setup:

```bash
mkdir -p ~/.codex/skills
cp -R extras/codex-skills/codex-harness-workflow ~/.codex/skills/
cp -R extras/codex-skills/codex-harness-wrap-up ~/.codex/skills/
```

Then start a new Codex thread, or restart the app if the skills do not appear
immediately.

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
