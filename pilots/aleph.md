# Pilot 1 — Aleph

Repository: `qursor-it/aleph`, branch `agent/aleph-m3`.

Aleph is already close to RDD: its spec states that human readability of source is not a goal and that humans read `aleph explain`. State on 20 Nov 2026: 48/53 tasks done, 94 loop commits, 378 tests (interpreter vs native byte for byte), median Aleph/Python tokens 0.81 on 61 verified HumanEval programs.

| RDD concept | Aleph today | Missing |
|---|---|---|
| Result Contract | mandatory `ex` lines (ADR-0010), hidden tests in `bench/tasks.md`, EXP-001..004 | program-level contract with thresholds (time, memory, tokens) |
| Capability | `use fs.read`, `net.host`, deny by default (ADR-0008); listed by `aleph explain` | nothing |
| Witness | `aleph check`/`test`, differential tests, replay (T-054), reward function (T-042) | formal separation from the Builder, one command |
| Evidence | JSON diagnostics (ADR-0011), `Verified:` trailer | bundle with build and contract hashes |
| Ledger | `PROGRESS.md`, agent-ready trailers (ADR-0013) | `Result:` and `Evidence:` trailers |
| Human view | `aleph explain` | `aleph result`: result, verdict, evidence on one page |

Steps:
1. Witness `aleph` (T-006) and contracts R-101..R-115 from `bench/tasks.md` (T-007).
2. Make RDD explicit in Aleph's `AGENTS.md`: the opencode loop is the Builder; owners approve ADRs, capabilities and results only.
3. Measure: results accepted without reading code, regressions caught by the Witness, time from contract to acceptance, tokens per result.

Hypothesis: Aleph is the natural Builder language for RDD (code not meant for humans + declared capabilities + deterministic explain).
