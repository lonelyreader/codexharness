# Optional Codex Skills

These local skills are optional shortcuts for people who use `codex-harness-kit`
inside Codex regularly.

They are not part of the npm package contract, and the core product still
remains:

- the CLI
- the generated repository files
- the `AGENTS.md` workflow

Use these skills only if you want faster prompt shortcuts in your personal Codex
setup.

## Included Skills

- `codex-harness-workflow`
- `codex-harness-wrap-up`

## Manual Install

Copy the skill folders into your local Codex skills directory:

```bash
mkdir -p ~/.codex/skills
cp -R extras/codex-skills/codex-harness-workflow ~/.codex/skills/
cp -R extras/codex-skills/codex-harness-wrap-up ~/.codex/skills/
```

Then start a new Codex thread, or restart the Codex app if the new skills do
not appear immediately.

## What They Do

`codex-harness-workflow` helps a thread start correctly:

- restore repo state from harness files
- initialize or validate the harness when needed
- ignore stale thread context in older conversations
- summarize current goal, contract, blockers, and next step before coding

`codex-harness-wrap-up` helps a thread end correctly:

- update harness state
- record durable decisions or project memory when needed
- report what verification ran and what did not run
- leave the next step in repo artifacts instead of only in chat

## Typical Usage

```text
Use $codex-harness-workflow and continue.
```

```text
Use $codex-harness-wrap-up.
```
