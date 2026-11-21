# ADR-0020: Gatekeeper: touched contracts, verdict, capability diff

Status: Proposed
Date: 2026-11-21
Deciders: Bernardo Manfriani, Gianmarco Ferruzzi

## Context
Spec §2 and §4: the Gatekeeper is a deterministic tool that compares evidence with thresholds, blocks merge on a refuted result and flags every capability diff (ADR-0007, ADR-0008). The spec does not say which contracts a change touches, how the decision is encoded, or where the report goes.

## Options for "touched"
Scored 1-10, 10 best.

- **(a) Paths declared by the contract itself — 8.** A contract is touched when the change modifies the contract file, its oracle sidecar, its hidden oracles, its fixtures directory, its `witness.target` (when it is a repository file), the Witness implementation (`witnesses/<kind>/`), or any file under a path the contract declares in `capabilities.fs.read`. The mapping is owned by the Owner and needs no new file.
- **(b) Witness every contract on every change — 5.** Simple and safe, but browser contracts cost minutes and LLM quota per run.
- **(c) A separate code→contract map file — 4.** One more artifact to keep in sync by hand.

## Decision
Use (a), plus `--contract <path>` (repeatable) to force contracts in, and `--all` for every contract.

`rdd gate --base <ref> --out <dir> [--contract <path>]... [--all] [--ledger <path>] [--text]`:
1. Changed files: `git diff --name-only <base>...HEAD`.
2. Contracts: every `results/**/*.result.yaml` except under `fixtures/`; touched by rule (a).
3. Each touched contract is validated, then witnessed with the same Witness dispatch as `rdd witness`, output in `<out>/<id>/`.
4. Capability diff per touched contract: `capabilities` at `<base>` (absent = new contract) vs HEAD, per key, values added and removed.
5. Undeclared use: every value in the bundle's `capabilities_used` must be declared in the contract (`fs.read`/`fs.write`: equal or under a declared path; other keys: equal).
6. Decision:
   - `block` (exit 1): any refuted verdict, any Witness error or invalid contract, any undeclared capability use;
   - `owner` (exit 3): otherwise, any inconclusive verdict or any capability diff (gate 2 needs the Owner);
   - `pass` (exit 0): otherwise.
7. `<out>/gate.json` holds base, head, changed files, per contract (id, path, why touched, verdict, bundle path and sha256, capability diff, undeclared uses) and the decision. Diagnostics are JSON lines on stderr ending with `{"code":"gate","decision":…}`; `--text` prints a human report on stdout from a separate renderer.
8. With `--ledger <path>`, the Gatekeeper appends every bundle it produced (spec §3: the ledger belongs to the Gatekeeper).

## Consequences
A change to `src/` re-witnesses every contract that declares `fs.read: [src]`, which is the intent. Contracts that declare nothing are touched only by their own files; Owners widen `fs.read` to bind them to code. Browser contracts run only when touched or forced.
