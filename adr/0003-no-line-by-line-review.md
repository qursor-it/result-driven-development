# ADR-0003: Code is not reviewed line by line

Status: Proposed
Date: 2026-11-20
Deciders: Bernardo Manfriani, Gianmarco Ferruzzi

## Context
Agents produce more code than a human can read; mandatory review becomes a formal bottleneck.

## Decision
No mandatory code review. Exceptions requiring human approval: capability changes, Witnesses, oracles, secrets handling.

## Consequences
Internal quality is governed by measurable budgets (size, dependencies, build time), not by reviewer taste.
