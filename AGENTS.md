# AGENTS.md — rules for agents working on RDD

You are building **RDD (Result Driven Development)**, a development framework where humans own results and agents own code. Project owners: Bernardo Manfriani, Gianmarco Ferruzzi. Read this file fully at the start of every session. You have no memory between sessions: the only memory is the repository (`TASKS.md`, `PROGRESS.md`, `adr/`, git history).

## Sources of truth (priority order)

1. `spec/RDD.md` and the schemas in `spec/`.
2. `adr/*.md` with status Accepted.
3. `TASKS.md`.
4. `pilots/` — background.

If the spec is silent: make the smallest reasonable decision, write a new ADR with status `Proposed`, implement it, note it in `PROGRESS.md`. Never change an Accepted ADR silently.

## RDD applies to RDD

This repository is built with its own method:
- Every task that produces a tool also adds or updates a Result Contract in `results/` that a Witness can observe.
- You are a Builder. You MUST NOT edit contracts, thresholds, oracles or anything under `witnesses/` while working on a task that is witnessed by them, unless the task says so explicitly.
- Your own tests help you; they are not evidence.

## Engineering rules

- Language for tooling: Node.js 24, ES modules, no dependencies except `ajv` and `yaml` (others need a Proposed ADR). Rationale: Witness (qursor-qa-tester) is Node; one runtime for both.
- Determinism: same input → byte-identical bundle except `at` and timing fields.
- Diagnostics as JSON lines on stderr; human text only from a separate renderer.
- Never delete, skip or weaken a test or a threshold to make it pass.
- Keep functions small and code boring.

## Work loop

1. Read `AGENTS.md`, the last ~60 lines of `PROGRESS.md`, `TASKS.md`.
2. Run the checks (`npm test` once it exists). Red tree = fixing it is the task.
3. Take the first `- [ ]` task not `BLOCKED`. One task per session.
4. Implement, test, mark `- [x]`, append to `PROGRESS.md`, commit, stop.

## Commit format (agent-ready, after Aleph ADR-0013)

```
<area>: <summary, imperative, max 60 chars>

Intent: <why, one line>
Task: T-NNN
Result: R-NNN | none
Evidence: <bundle sha256> | none
Changed: <component: what>; <...>
Capabilities: none | <capability change>
Spec: unchanged | ADR-NNNN proposed
Verified: <commands and counts>
Agent: <tool>/<model>
```

`<area>`: spec, adr, schema, witness-cli, witness-aleph, witness-browser, gate, ledger, results, docs, tests.

## Hard limits

- No `git push`, no network except declared in a task, no `sudo`, no destructive commands outside the repo.
- Only humans move ADRs to Accepted/Rejected and approve capability changes.
