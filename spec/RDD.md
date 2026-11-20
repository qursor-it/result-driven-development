# RDD — Result Driven Development, method v0.1 (draft)

Status: draft. Authors: Bernardo Manfriani, Gianmarco Ferruzzi.
Keywords MUST, MUST NOT, SHOULD follow RFC 2119.

## 1. Principle

The developer is accountable for the **result**, not for the code. Code is produced by agents (Builders), is disposable and regenerable, and is not reviewed line by line. Humans approve three things: the Result Contract, the capabilities, the Evidence.

## 2. Roles

| Role | Who | Does | Does not |
|---|---|---|---|
| Result Owner | human developer | writes and signs Result Contracts, approves capabilities and oracles, accepts evidence | review code line by line |
| Builder | agents | writes code, internal tests, refactors; iterates until the Witness observes the result | edit contracts, thresholds, Witnesses or oracles |
| Witness | separate agent or runner | pursues the intent as a user or client, collects the Evidence Bundle | read the Builder's code or context, propose fixes |
| Gatekeeper | deterministic CI tool | compares evidence with thresholds, blocks merge/deploy, flags new capabilities | make judgment calls |
| Steward | human, rotating | reviews Proposed ADRs, curates Witness catalog and contract quality | accept results on the Owner's behalf |

Tests written by the Builder are tools for the Builder. They MUST NOT count as evidence.

## 3. Artifacts

| Artifact | Path | Author |
|---|---|---|
| Result Contract | `results/R-NNN.result.yaml` | Result Owner |
| Capability manifest | inside the contract (`capabilities`) | Result Owner |
| Witness | `witnesses/<kind>/` | Steward + agents |
| Oracle | inside the Witness, referenced by the contract | agents, approved by the Owner |
| Evidence Bundle | `evidence/<R-id>/<build-hash>/bundle.json` | Witness |
| Result Ledger | `ledger/results.jsonl` | Gatekeeper |

Schemas: `spec/result-contract.schema.json`, `spec/evidence.schema.json`.

## 4. Lifecycle

1. **Declare** — the Owner writes a Result Contract.
2. **Approve** (gate 1) — the Owner approves contract and capabilities.
3. **Build** — Builders iterate freely. No code review.
4. **Witness** — an independent Witness runs the contract `runs` times against the build and writes an Evidence Bundle.
5. **Accept** (gate 2) — automatic if every threshold is observed and no capability changed; otherwise the Owner reads the evidence.
6. **Watch** — accepted results are re-witnessed in production at the contract's `watch.interval`. A refuted verdict reopens the result.

## 5. Verdicts

- `observed`: every outcome holds and every threshold is met; no anti-result occurred.
- `refuted`: an outcome does not hold, a threshold is missed, or an anti-result occurred.
- `inconclusive`: the Witness could not observe (automation error, environment down, budget exhausted).

`inconclusive` MUST NOT be reported as `observed` or `refuted`. A Witness SHOULD keep inconclusive runs under 10%.

## 6. Thresholds

Every threshold names a statistic and a run count, e.g. `success_rate >= 0.95 over 20 runs`, `p50 time_to_result <= 60s`. A single run proves nothing for non-deterministic Witnesses.

## 7. Capabilities

Deny by default (after Aleph ADR-0008). A contract declares `net.host`, `fs.read`, `fs.write`, `data`, `permissions`. The Gatekeeper MUST reject a build that uses an undeclared capability when the Witness can detect it, and MUST flag every capability diff for human approval.

## 8. Witness interface

A Witness is an executable: `witness <contract.yaml> --target <target> --out <dir>`. It writes `bundle.json` conforming to `spec/evidence.schema.json` and exits 0 (observed), 1 (refuted), 3 (inconclusive), 2 (usage error). Initial kinds: `cli`, `aleph`, `browser`.

## 9. Ledger and commits

`ledger/results.jsonl` is append-only, one JSON object per verdict. Commits carry the agent-ready trailers of Aleph ADR-0013 plus `Result: R-NNN` and `Evidence: <bundle sha256>`.
