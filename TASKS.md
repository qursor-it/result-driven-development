# TASKS

Format: `- [ ] T-NNN title — refs`. Done: `- [x]`. Blocked: append `BLOCKED: reason`. Work top to bottom.

## M0 — Foundations

- [x] T-000 Repository, manifesto, spec v0.1, schemas, ADR 0001–0012, example contracts, pilots
- [x] T-001 `package.json` (Node 24, ESM), `npm test`, CI script running tests and schema checks — AGENTS.md
- [x] T-002 `rdd validate <contract.yaml>`: validate against `spec/result-contract.schema.json`, JSON diagnostics; validate all `results/examples/` in tests — ADR-0009
- [x] T-003 Evidence writer: bundle per `spec/evidence.schema.json`, sha256 of contract and build, summary statistics (success rate, p50, p95, inconclusive rate) — ADR-0005, ADR-0006
- [x] T-004 Verdict function: thresholds + runs → observed/refuted/inconclusive with reasons; table-driven tests — spec §5–6

## M1 — Pilot Aleph

- [x] T-005 Witness `cli`: run command with args/stdin/timeout N times, check stdout/exit-code oracles, write bundle, exit codes per spec §8 — ADR-0010
- [x] T-006 Witness `aleph`: `aleph check` must be clean, then run interpreter and native build; both must satisfy the oracles — pilots/aleph.md
- [x] T-007 Contracts R-101..R-115 from Aleph `bench/tasks.md`, hidden oracles kept outside the Builder's view — ADR-0004
- [x] T-008 Ledger: append verdicts to `ledger/results.jsonl`; `rdd ledger R-NNN` shows history — ADR-0011

## M2 — Pilot Witness (browser)

- [x] T-009 Witness `browser` adapter: contract → qursor-qa-tester run (intent as goal, budgets as limits) → bundle; reuse its timeline/manifest as artifacts — pilots/witness.md
- [x] T-010 HTTP oracles for browser contracts (final state via API, not via UI)
- [x] T-011 Metrics per run: time to result, steps, errors; a11y and Core Web Vitals as optional thresholds
- [ ] T-012 Contract R-014 observed on the qursor-qa-tester demo server with 20 runs — BLOCKED: human gate — R-014 thresholds (p50 60 s, max_steps 8) are calibrated for a human, observed with the Explorbot agent over 20 runs: p50 125.5 s, steps 12–20 in every successful run, success_rate 0.7 < 0.95 (4 runs started on the empty-form 400 page, 2 runs typed the email with the agent's session-name suffix), anti-result observed (most likely the welcome mail to the suffixed address); bundle 833ee7e4…, evidence/R-014/

## M3 — Gate and Watch

- [x] T-013 Gatekeeper: all contracts touched by a change → witness → block on refuted; capability diff report — ADR-0007, ADR-0008
- [x] T-014 Watch: scheduled re-witness of accepted results, reopen on refuted — ADR-0012
- [x] T-015 Monthly report: results accepted without code review, regressions found by Watch, time from contract to acceptance
