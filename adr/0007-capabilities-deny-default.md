# ADR-0007: Capabilities declared, denied by default

Status: Proposed
Date: 2026-11-20
Deciders: Bernardo Manfriani, Gianmarco Ferruzzi

## Context
Code nobody reads must not hold implicit power.

## Decision
After Aleph ADR-0008: each contract declares net.host, fs.read, fs.write, data, permissions. The Gatekeeper rejects builds using undeclared capabilities when detectable and flags every capability diff.

## Consequences
The capability is the human approval point.
