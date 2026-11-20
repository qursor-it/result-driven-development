# ADR-0006: Statistical thresholds and three verdicts

Status: Proposed
Date: 2026-11-20
Deciders: Bernardo Manfriani, Gianmarco Ferruzzi

## Context
Agent-based Witnesses are non-deterministic; one run proves nothing.

## Decision
Every threshold names a run count and a statistic (success rate, p50, p95). Verdicts: observed, refuted, inconclusive.

## Consequences
Unstable results become visible as such instead of ignored flaky tests.
