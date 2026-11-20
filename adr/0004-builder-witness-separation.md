# ADR-0004: Separate Builder and Witness

Status: Proposed
Date: 2026-11-20
Deciders: Bernardo Manfriani, Gianmarco Ferruzzi

## Context
Whoever writes the code tends to verify what was written, not what was needed.

## Decision
The Witness runs in a separate context with no access to the Builder's code or conversation. Contracts may mark oracles `hidden: true`, kept out of the Builder's view (as Aleph's hidden tests).

## Consequences
Higher execution cost; fewer results that are green by construction.
