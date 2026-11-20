# ADR-0013: Definitions of the Evidence summary statistics

Status: Proposed
Date: 2026-11-20
Deciders: Bernardo Manfriani, Gianmarco Ferruzzi

## Context
`spec/evidence.schema.json` names `success_rate`, `p50_time_to_result_s`, `p95_time_to_result_s` and `inconclusive_rate` but the spec does not define how they are computed. Spec §5 says inconclusive runs MUST NOT be reported as observed or refuted.

## Decision
- `success_rate` = successes / (successes + failures): conclusive runs only, so an inconclusive run never counts as a failure.
- `inconclusive_rate` = inconclusive runs / all runs.
- `p50` and `p95` use the nearest-rank method over `time_to_result_s` of successful runs.
- A statistic with no data is omitted from `summary`, never null. Values are rounded to 6 decimals for byte-stable bundles.

## Consequences
A run where the Witness could not observe lowers neither the success rate nor raises it. The verdict function must check `inconclusive_rate` separately: with many inconclusive runs the verdict is inconclusive even when `success_rate` is high.
