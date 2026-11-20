# ADR-0012: Watch: results decay

Status: Proposed
Date: 2026-11-20
Deciders: Bernardo Manfriani, Gianmarco Ferruzzi

## Context
A result observed in CI may stop holding in production (data, third parties, browsers).

## Decision
Accepted results are re-witnessed in production at `watch.interval`. A refuted verdict reopens the result for the Builder.

## Consequences
Ongoing execution cost; in return the ledger states what is true today.
