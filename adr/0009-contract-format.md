# ADR-0009: Result Contract format

Status: Proposed
Date: 2026-11-20
Deciders: Bernardo Manfriani, Gianmarco Ferruzzi

## Context
Contracts must be readable by humans and machines.

## Decision
YAML validated by `spec/result-contract.schema.json`, one file per result, required: id, version, intent, actor, given, outcome, thresholds, capabilities, witness.

## Consequences
Validation in CI; an Aleph-native form may follow the pilot.
