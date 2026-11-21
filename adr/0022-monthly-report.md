# ADR-0022: Monthly report from the ledger and git history

Status: Proposed
Date: 2026-11-21
Deciders: Bernardo Manfriani, Gianmarco Ferruzzi

## Context
T-015 asks for a monthly report: results accepted without code review, regressions found by Watch, time from contract to acceptance. The ledger (ADR-0011, T-008) holds every verdict with its time; Watch entries carry `source: "watch"` (ADR-0021); contracts live in git.

## Options
Scored 1-10, 10 best.

- **(a) `rdd report --month YYYY-MM` computed from the ledger plus `git log` of each contract file — 8.** No new data; deterministic for a fixed ledger and history.
- **(b) Keep counters in a separate state file updated by gate and watch — 4.** A second source of truth that can drift from the ledger.
- **(c) Derive "code review" from GitHub PR reviews — 3.** Network, tokens, and RDD does not review code (ADR-0003).

## Decision
Use (a). Months are UTC calendar months.
- **Accepted without code review**: results whose first `observed` ledger entry falls in the month. RDD never reviews code line by line (ADR-0003), so every acceptance counts; the report says the count and the ids.
- **Regressions found by Watch**: ledger entries in the month with `source: "watch"` and verdict `refuted`.
- **Time from contract to acceptance**: for each result accepted in the month, hours from the first commit that added its contract file (`git log --diff-filter=A --format=%aI -- <path>`, earliest) to its first `observed` entry; `p50` with the existing percentile; a contract not found in `--results` or not committed gives `null` for that result and is left out of `p50`; a negative time (witnessed before the contract was committed) counts as 0.
- Output: one JSON object on stdout, keys in this order: `{"month", "accepted_without_code_review": {"count", "results"}, "regressions_found_by_watch": {"count", "results"}, "time_to_acceptance_h": {"p50", "results": {id: hours}}}`; ids sorted, hours rounded to 2 decimals. `--text` prints a human report instead, from a separate renderer.

## Consequences
The report is only as good as the ledger: verdicts produced and not appended do not count. Acceptance through gate 2 with Owner reading (capability diff) is not distinguished yet.
