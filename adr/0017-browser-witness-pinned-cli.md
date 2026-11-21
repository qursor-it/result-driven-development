# ADR-0017: The browser Witness calls P2's CLI at a pinned commit

Status: Proposed
Date: 2026-11-21
Deciders: Bernardo Manfriani, Gianmarco Ferruzzi

## Context
The `browser` Witness (spec §8) is implemented by P2 (qursor-qa-tester, `autonomous-qa/witness/`): Explorbot on Chromium, an OpenCode-backed model, HTTP oracle sidecars and an Evidence Bundle built with P1's own vendored `decide()`/`summarize()`. P2 needs Playwright, Explorbot and about a thousand npm packages. P1 allows only `ajv` and `yaml`. P2 consumes P1 as a vendored snapshot pinned by commit (P2 ADR-0001).

## Options
Scored 1-10, 10 best.

- **(a) Spawn P2's CLI `autonomous-qa/witness/bin/rdd-witness-browser.mjs` from a local checkout, pinned by commit in `witnesses/browser/PIN.json`, with a check before every run — 9.** No new dependency in P1; the boundary is the spec §8 interface (argv, exit code, `bundle.json`); P1 re-checks the bundle against its own schema and contract hash. Cost: the checkout path is machine-specific (`RDD_BROWSER_WITNESS_DIR`).
- **(b) `import` P2's `witness/index.mjs` from P1 — 5.** Same checkout requirement, but P2's dependency tree loads into P1's process and a P2 change can break P1 at import time.
- **(c) Vendor P2 into P1 — 2.** Brings Playwright and Explorbot into P1: violates the dependency rule and forks P2.
- **(d) npm git dependency on P2 — 2.** Network and SSH keys at install, plus the dependency rule.

## Decision
Use (a).
- `witnesses/browser/PIN.json` records `repo`, `commit` (full sha) and `cli` (path inside the checkout).
- The checkout is `$RDD_BROWSER_WITNESS_DIR`, default `~/projects/qursor-witness`. Before running, the adapter checks that `git rev-parse HEAD` equals the pinned commit and that `git status --porcelain -- autonomous-qa/witness autonomous-qa/vendor` is empty. A mismatch is a usage error (exit 2): the Witness at hand is not the one pinned.
- The adapter passes absolute paths: `<contract> --target <t> --out <dir>`; P2 finds the oracle sidecar at `<contract dir>/oracles/<id>.oracles.yaml`.
- After P2 exits 0/1/3 the adapter checks `bundle.json`: valid against P1 `spec/evidence.schema.json`, `result` equals the contract id, `contract_sha256` equals the sha256 of the contract file, `witness.kind` is `browser`, and the exit code matches the verdict. Any failure is exit 2 with a JSON diagnostic.
- Upgrading P2 = changing `PIN.json` in a commit, after the new commit's E2E is observed.

## Consequences
P1 stays dependency-free and the Witness stays independent of the Builder. A machine without the P2 checkout (or with a different commit) cannot witness browser contracts and says so with exit 2. Chromium system libraries (`LD_LIBRARY_PATH`) and capacity limits (one Chromium, load < 3) are the operator's environment, not the adapter's.
