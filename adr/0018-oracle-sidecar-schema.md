# ADR-0018: HTTP oracle sidecars for browser contracts are part of the spec

Status: Proposed
Date: 2026-11-21
Deciders: Bernardo Manfriani, Gianmarco Ferruzzi

## Context
A browser contract states its outcomes in prose (`oracle: "GET /api/projects returns 1 item owned by the new user"`). The browser Witness (P2, ADR-0017) checks the final state through the target's HTTP API using a sidecar `<contract dir>/oracles/<id>.oracles.yaml` (P2 `docs/witness.md` §5). The spec says oracles are approved by the Owner, but it does not describe the sidecar, so a bad sidecar is found only after a multi-minute browser run, and nothing in P1 checks that it stays on the target origin.

## Options
Scored 1-10, 10 best.

- **(a) `spec/oracle-sidecar.schema.json` plus `rdd validate` for sidecars and for browser contracts — 9.** One schema shared with P2 through its vendored `spec/`; errors surface in milliseconds; the same-origin rule is a schema pattern.
- **(b) Leave validation to P2 at witness time — 4.** Late feedback, and P1 never states the format it relies on.
- **(c) Inline structured oracles inside the contract — 3.** Changes the Accepted-candidate contract schema and mixes Owner prose with machine checks.

## Decision
Use (a).
- `spec/oracle-sidecar.schema.json` describes the format of P2 §5: `result`, optional `before_each.post`, `outcomes[]` with `outcome` index and `anti_results[]` with `anti_result` index, each with `get` and optional `expect` (`status`, `length`, `every`, `some`, `none`). Every path starts with a single `/` (same origin).
- `rdd validate x.oracles.yaml` validates a sidecar against the schema; placeholders in `get` and `expect` values are only `{email}`, `{run}`, `{project}`.
- `rdd validate` on a non-hidden browser contract also loads `<dir>/oracles/<id>.oracles.yaml` when the contract has any outcome with `oracle`: the sidecar must exist, be valid, have `result` equal to the contract id, have an entry for every outcome with `oracle`, and reference only existing outcome and anti-result indices.
- The sidecar is owned like the contract: Builders do not edit it.

## Consequences
A wrong sidecar fails before any browser starts. P2 picks the schema up on its next re-vendor of P1 `spec/`.
