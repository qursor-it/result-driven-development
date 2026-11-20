# ADR-0014: Verdict rules

Status: Proposed
Date: 2026-11-20
Deciders: Bernardo Manfriani, Gianmarco Ferruzzi

## Context
Spec §5–6 define the three verdicts but not the order of the checks, the default when a contract gives no `success_rate`, the inconclusive limit, or what to do with a threshold the Witness did not measure.

## Decision
The verdict function takes the contract thresholds, the runs and the anti-results observed. Checks, in this order; the first rule that fires sets the verdict, but every finding is listed in `reasons`:
1. Any anti-result observed → `refuted`.
2. Fewer runs than `thresholds.runs` → `inconclusive`.
3. `inconclusive_rate` > `max_inconclusive_rate` (default 0.10, spec §5) → `inconclusive`.
4. A threshold missed → `refuted`. `success_rate` defaults to 1.0 (spec §5: every outcome holds). `p50`/`p95_time_to_result_s` are upper bounds on the summary statistics of ADR-0013. `max_steps`, `max_memory_mb`, `serious_a11y_violations` are upper bounds on every conclusive run (run fields `steps`, `memory_mb`, `serious_a11y_violations`).
5. A threshold that cannot be evaluated (metric missing from the runs, or an unknown threshold key) → `inconclusive`.
6. Otherwise `observed`.

## Consequences
A clear failure is reported as refuted even when other metrics are missing; a contract with a threshold no Witness measures can never be observed, which makes the gap visible.
