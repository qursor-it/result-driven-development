# ADR-0001: Record decisions as ADRs

Status: Accepted
Date: 2026-11-20
Deciders: Bernardo Manfriani, Gianmarco Ferruzzi

## Context
RDD is built largely by agents with no memory between sessions.

## Decision
Every decision is `adr/NNNN-title.md` with Status, Date, Context, Decision, Consequences. Status: Proposed, Accepted, Superseded by ADR-NNNN, Rejected. Agents create only Proposed ADRs; only the project owners accept or reject.

## Consequences
Decisions survive sessions; owners review Proposed ADRs regularly.
