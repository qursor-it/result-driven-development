# ADR-0010: Pluggable Witnesses with a common interface

Status: Proposed
Date: 2026-11-20
Deciders: Bernardo Manfriani, Gianmarco Ferruzzi

## Context
A result can live in a browser, a CLI, an API or an Aleph program.

## Decision
A Witness is `witness <contract> --target <t> --out <dir>`, writes a bundle, exits 0/1/3 for observed/refuted/inconclusive (2 = usage). First kinds: cli, aleph, browser (Witness / qursor-qa-tester).

## Consequences
The Gatekeeper ignores Witness internals; kinds are added without touching the rest.
