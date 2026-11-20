# ADR-0015: How the aleph Witness runs a program

Status: Proposed
Date: 2026-11-20
Deciders: Bernardo Manfriani, Gianmarco Ferruzzi

## Context
pilots/aleph.md asks for a Witness `aleph`: `aleph check` clean, then interpreter and native build both satisfy the oracles. The spec does not say where the program's input files (the contract's `given`) live, where the program runs, or how the Witness finds the Aleph toolchain.

## Decision
- The build under test is `--target` (spec §8), falling back to `witness.target`; paths are relative to the working directory, as for the cli Witness.
- Input files for `given` live in `<contract dir>/fixtures/<contract id>/`, written by the Result Owner. Every engine run gets a fresh temporary copy of that directory (empty if absent) as its working directory.
- Order: `aleph check` once (non-zero → refuted), `aleph build` once (failure → refuted), then `thresholds.runs` runs; a run succeeds only if both `aleph run` (interpreter) and the native binary satisfy every oracle. `time_to_result_s` is the native time.
- Files created or changed in the run directory are reported in `capabilities_used.fs.write`; a write not covered by the contract's `fs.write` prefixes is an undeclared capability and refutes the result (spec §7).
- The toolchain is `$ALEPH`, else `aleph` on PATH; the Witness version records the sha256 prefix of that binary. Missing toolchain → inconclusive.
- Oracles use the same grammar as the cli Witness.

## Consequences
Results are observed against a pinned compiler; a fixture directory is part of the contract and only the Owner edits it.
