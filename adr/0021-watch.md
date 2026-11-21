# ADR-0021: Watch: when to re-witness, where, and what "reopen" means

Status: Proposed
Date: 2026-11-21
Deciders: Bernardo Manfriani, Gianmarco Ferruzzi

## Context
ADR-0012 (Proposed): accepted results are re-witnessed in production at `watch.interval`, and a refuted verdict reopens the result. The spec does not say what "accepted" is in data, where production is, who schedules the runs, or how a reopen is recorded.

## Options
Scored 1-10, 10 best.

- **(a) A one-shot `rdd watch` that decides what is due from the ledger; any scheduler (cron, systemd timer, CI schedule) calls it; reopen = a refuted ledger entry with `source: "watch"` plus a diagnostic and exit 1 — 8.** Deterministic, testable with `--now`, no daemon, the ledger stays the single memory.
- **(b) A long-running daemon in P1 — 4.** State outside the ledger, process supervision on a shared VPS.
- **(c) Reopen by editing TASKS.md or opening an issue — 3.** Network or free-text side effects from a deterministic tool.

## Decision
Use (a).
- Accepted: the latest ledger entry of the result is `observed`. A result never observed, or whose latest entry is refuted or inconclusive, is not watched (it belongs to the Builder, the Gatekeeper re-witnesses it on the next change).
- Due: the contract has `watch.interval` and `now - latest.at >= interval` (`m`, `h`, `d`).
- Production: optional `watch.target` in the contract; it overrides `witness.target` for Watch only. Added to `spec/result-contract.schema.json`.
- `rdd watch --out <dir> [--results <dir>] [--ledger <path>] [--now <iso>] [--dry-run] [--text]`: for each due contract, run its Witness (output `<out>/<id>/`), append the bundle to the ledger with `source: "watch"` (not with `--dry-run`), write `<out>/watch.json`.
- A due result whose verdict is refuted is reopened: diagnostic `{"code":"reopen","result":…}`; its latest ledger entry is now refuted, so it leaves Watch until observed again.
- Exit 1 if any result was reopened; otherwise 3 if any verdict was inconclusive or a Witness failed; otherwise 0.
- Scheduling example: `0 * * * * cd <repo> && rdd watch --out /var/tmp/rdd-watch` (hourly; each contract still runs only at its own interval).

## Consequences
The ledger gets an optional `source` field (`watch`; absent = Gatekeeper or manual). The monthly report (T-015) counts regressions found by Watch from it.
