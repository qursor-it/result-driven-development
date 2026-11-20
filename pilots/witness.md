# Pilot 2 — Witness (front-end and browser)

Repository: `qursor-it/qursor-qa-tester` (autonomous-qa).

## Today (POC 20 Oct 2026)

- Local GUI (Node, plain HTML/CSS/JS): queue of URLs and goals, sequential Explorbot campaigns on Chromium, model `opencode-go/deepseek-v4.1-flash` through the OpenCode CLI.
- Real campaign: 3/3 scenarios passed in 8m14s; saved login profiles, per-run timeline and manifest, reports readable without AI calls.
- Key limit: generated Playwright regressions pass 0/3 on replay, 1/3 after the matcher fix.

## Why RDD removes the limit

In RDD generated test code is not the truth and nobody maintains it. The truth is the Result Contract, re-observed on every build by an agent pursuing the intent, with a deterministic oracle on the final state.

| Component | Today | In RDD |
|---|---|---|
| Input | URL + free-text goal | Result Contract YAML: intent, thresholds, anti-results |
| Execution | 1 campaign, 1–20 agent-chosen scenarios | N runs of the same intent, optionally with different user profiles |
| Judgment | Explorbot report, human reading | API/DB oracle + metrics → observed/refuted/inconclusive |
| Metrics | scenario outcome, duration | success rate, time to result, steps, errors, a11y, Core Web Vitals |
| Output | HTML/Markdown reports, screenshots | Evidence Bundle + ledger line; current reports kept as artifacts |
| Regression | Playwright export | re-witness of the same contract on the new build |

"Optimize how people interact with the browser" becomes measurable: interaction cost per intent (steps, time, errors) is a contract threshold. The Builder changes the UI; the Witness says whether the cost went down.

## Milestones

- W0: one contract, the demo site (`demo/server.mjs`), one oracle, JSON verdict.
- W1: N runs, statistical thresholds, bundle with hashes.
- W2: Gatekeeper in CI blocking merge on refuted.
- W3: Watch in production with saved login profiles.

Aleph later: oracles (HTTP + JSON checks) can be written in Aleph (`fetch`, `json`, `net.host`). The browser stays outside Aleph.
