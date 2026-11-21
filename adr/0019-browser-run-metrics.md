# ADR-0019: Per-run browser metrics and optional thresholds

Status: Proposed
Date: 2026-11-21
Deciders: Bernardo Manfriani, Gianmarco Ferruzzi

## Context
T-011 asks for per-run metrics (time to result, steps, errors) with accessibility and Core Web Vitals as optional thresholds. P2's browser Witness already writes `time_to_result_s`, `steps` and `serious_a11y_violations` per run (P2 docs/witness.md §7). The verdict function knows `max_steps` and `serious_a11y_violations`; it treats any other threshold as unknown (inconclusive), and the evidence schema does not type these fields.

## Options
Scored 1-10, 10 best.

- **(a) Name the missing metrics now as per-run upper bounds, typed in the evidence schema; a set threshold whose metric a Witness does not emit is inconclusive (ADR-0014 rule) — 8.** Owners can write the thresholds today; nothing is ever observed by default; Witnesses add metrics without touching the verdict.
- **(b) Wait until P2 measures errors and Web Vitals — 5.** No vocabulary for Owners; P1 and P2 would invent names separately.
- **(c) Percentile thresholds for Web Vitals (p75 like CrUX) — 6.** Closer to field practice but needs a new statistic in `summarize()`; can come later as `p75_*` keys.

## Decision
Use (a). Per-run fields and their thresholds (upper bounds, every conclusive run must satisfy them):

| Threshold | Run field | Meaning |
|---|---|---|
| `max_steps` | `steps` | agent steps (existing; P2 ADR-0004 may narrow it to interactions) |
| `serious_a11y_violations` | `serious_a11y_violations` | serious or critical a11y issues (existing) |
| `max_errors` | `errors` | page errors seen in the run: uncaught exceptions, console errors, failed same-origin requests |
| `max_lcp_ms` | `lcp_ms` | Largest Contentful Paint of the result page, ms |
| `max_cls` | `cls` | Cumulative Layout Shift over the run |
| `max_inp_ms` | `inp_ms` | Interaction to Next Paint, worst interaction, ms |

`spec/evidence.schema.json` types `steps`, `serious_a11y_violations`, `errors` as non-negative integers and `lcp_ms`, `cls`, `inp_ms`, `memory_mb` as non-negative numbers. `time_to_result_s` stays as it is.

## Consequences
A contract may set `max_errors` or Web Vitals bounds today; until the browser Witness emits the field the verdict is inconclusive, never observed. P2 needs these fields (request recorded for the MASTER) and a re-vendor of P1 `src/verdict.js` and `spec/`.
