# ADR-0016: Where hidden oracles live

Status: Proposed
Date: 2026-11-20
Deciders: Bernardo Manfriani, Gianmarco Ferruzzi

## Context
ADR-0004 lets a contract mark its oracles hidden (`hidden: true`), kept out of the Builder's view like Aleph's hidden tests. The schema has the flag but no place for the hidden oracles.

## Decision
- A hidden contract keeps the outcome texts in `results/` and carries no `oracle` field; `rdd validate` rejects a hidden contract with an inline oracle.
- Its oracles live in `witnesses/hidden/<id>.oracles.yaml`: `{ id, outcome: [{ oracle }] }`, one entry per contract outcome, same order. Builders never read `witnesses/` (AGENTS.md).
- A Witness loads them only when `hidden: true`. Missing file → inconclusive; id or count mismatch → usage error.
- The oracle grammar gains `file <json-string path> == <json-string>`, e.g. `file "out/up.txt" == "A\n"`: the content of a file in the run directory after the run.

## Consequences
The Builder learns only the intent and the outcome texts; the Owner can add or change oracles without touching the public contract. Hiding is by rule, not by access control, for as long as Builders and Witness share a machine.
