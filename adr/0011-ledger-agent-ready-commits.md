# ADR-0011: Result Ledger and agent-ready commits

Status: Proposed
Date: 2026-11-20
Deciders: Bernardo Manfriani, Gianmarco Ferruzzi

## Context
We need a history of results, not only of diffs.

## Decision
`ledger/results.jsonl` append-only in git. Commits extend Aleph ADR-0013 trailers with `Result:` and `Evidence:`.

## Consequences
"Since when is this result true?" becomes a query.
