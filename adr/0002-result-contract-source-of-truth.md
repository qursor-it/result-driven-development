# ADR-0002: The Result Contract is the source of truth

Status: Proposed
Date: 2026-11-20
Deciders: Bernardo Manfriani, Gianmarco Ferruzzi

## Context
In TDD the truth is the test, in SDD the spec; both are written in terms of the code.

## Decision
The authority is the Result Contract. Specs, plans and internal tests are Builder tools and may be regenerated.

## Consequences
A conflict between code and contract is resolved in favour of the contract, or by a new signed contract.
