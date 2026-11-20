# ADR-0005: Mandatory, content-addressed Evidence Bundle

Status: Proposed
Date: 2026-11-20
Deciders: Bernardo Manfriani, Gianmarco Ferruzzi

## Context
"Works on my machine" is not evidence.

## Decision
Every verdict produces a bundle per `spec/evidence.schema.json` with build sha256, contract sha256, Witness version, per-run metrics and raw artifacts. No bundle, no verdict.

## Consequences
Every result is reproducible and comparable across builds; a retention policy is needed.
