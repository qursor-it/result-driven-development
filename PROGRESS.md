# PROGRESS

Append-only log written by agents. Newest entries at the bottom.

## 2026-11-20T14:10 T-000 done
- repository initialized by Bernardo Manfriani and Gianmarco Ferruzzi: manifesto, spec v0.1, schemas, ADR 0001–0012, example contracts, pilots
- tests: none yet
- next: T-001

## 2026-11-20T21:00 T-001 done
- package.json (ESM, Node >=24, private), deps ajv@8 + yaml@2 only
- `npm test` = node --test over test/*.test.js; `npm run ci` = Node version check + compile both spec schemas (Ajv 2020, strict) + tests; GitHub workflow runs `npm ci && npm run ci` on Node 24
- src/schemas.js: shared loadSchema/compileSchemas (date-time format inline, allowUnionTypes for thresholds)
- environment: Node 24.22.3 installed in user space at ~/.local/node24 (SHA256 verified); the VPS default is Node 22
- witness (lead, fresh run): npm run ci exit 0, 6/6 tests; under Node 22 ci exits 1 as required
- next: T-002

## 2026-11-20T21:20 T-002 done
- `rdd validate <file>...` (bin/rdd.js dispatcher + src/validate.js): YAML parse, schema check, JSON diagnostics on stderr (codes valid/schema/yaml/io/usage), nothing on stdout; exit 0/1/2
- tests validate every results/**/*.result.yaml; invalid fixtures in test/fixtures/
- contract results/R-002.result.yaml (lead as Owner proxy): witnessed by hand by the lead (cli Witness arrives in T-005): 3/3 runs exit 0, empty stdout, max 0.52s <= p95 2s; no bundle yet
- verified: npm run ci exit 0, 18/18 tests
- next: T-003

## 2026-11-20T21:35 T-003 done
- src/evidence.js: sha256/sha256File, nearest-rank percentile, summarize, buildBundle (fixed key order), writeBundle (schema-validated, deterministic bytes, returns bundle sha256)
- ADR-0013 Proposed: statistic definitions (success_rate over conclusive runs, inconclusive_rate over all, nearest-rank p50/p95 over successful runs, missing stats omitted, 6-decimal rounding) — spec was silent
- witness (lead): npm run ci exit 0, 36/36 tests; independent 20-run input gave 0.894737 / p50 9 / p95 17 / 0.05 as computed by hand; two writes byte-identical
- Result: none (library, no user-facing tool yet)
- next: T-004

## 2026-11-20T21:55 T-004 done
- src/verdict.js: decide({thresholds, runs, antiResults}) → {verdict, reasons}, pure, reuses summarize
- ADR-0014 Proposed: check order (anti-result → run count → inconclusive rate > 0.10 → threshold miss → cannot evaluate → observed), success_rate default 1.0, per-run bounds for max_steps/max_memory_mb/serious_a11y_violations, unmeasured or unknown thresholds → inconclusive
- witness (lead): npm run ci exit 0, 56/56 tests; 6 independent cases (R-001/R-014 shapes, anti-result, unmeasured a11y) gave the expected verdicts
- M0 complete: P2 (browser Witness) can start
- next: T-005

## 2026-11-20T22:30 T-005 done
- Witness `cli`: witnesses/cli/{witness.js,index.js,oracle.js}; `rdd witness <contract> [--target] --out` dispatches by kind (cli only for now; others exit 2)
- oracles: stdout/stderr `==`/`contains` <JSON string>, exit_code `==`/`!=` <int>; spawn error or missing/unsupported oracle → inconclusive run; timeout → failure; exit 0/1/3/2 per spec §8
- npm test now globs test/**/*.test.js (fixture helper scripts are not tests)
- contract results/R-005.result.yaml (cli Witness observes R-002 through itself)
- witness (lead, fresh): npm run ci exit 0, 86/86; R-002 observed (p95 0.68s), R-005 observed (p95 3.56s); wrong --target → refuted exit 1
- evidence committed: evidence/R-002/<build>/bundle.json (sha256 f8e6809f…), evidence/R-005/<build>/bundle.json (sha256 dee3f7b0…)
- known limits (shortcut comments): no anti-result/capability detection; build sha256 of a .js target hashes the entry file only, not its imports
- risk: R-002/R-005 time thresholds include Node startup; on a saturated VPS (load > 4) they can be exceeded
- next: T-006

## 2026-11-20T23:00 T-006 done
- Witness `aleph`: witnesses/aleph/{witness.js,index.js}; registered in `rdd witness`; shared contract/oracle helpers moved to src/contract.js
- ADR-0015 Proposed: --target is the build, fixtures in <contract dir>/fixtures/<id>/ copied fresh per engine run, check → build → N runs (interp + native both must pass), written files reported as capabilities_used.fs.write and undeclared writes refute, toolchain from $ALEPH, version = pkg+aleph.<binary sha12>
- fixture results/examples/fixtures/R-001/data/in.txt ("uno due tre") added by the lead as Owner proxy (the contract's given)
- toolchain: aleph built read-only from a detached worktree ~/projects/.worktrees/aleph-ro at aleph a96ce3e (sha256 cd41f508…), CARGO_BUILD_JOBS=1 nice
- R-001 observed against Aleph's own program tests/aph/bench_wordcount.aph (a96ce3e): 3/3, interp and native print "3\n", p95 native 0.0056s; bundle sha256 de429379…
  reproduce: ALEPH=<aleph-ro>/target/release/aleph node bin/rdd.js witness results/examples/R-001.result.yaml --target <aleph-ro>/tests/aph/bench_wordcount.aph --out <dir>
- negative: bench_linecount and bench_upper as target → refuted exit 1
- tests hermetic with test/fixtures/fake-aleph.js; npm run ci exit 0, 96/96
- next: T-007

## 2026-11-20T23:50 T-007 done
- contracts results/aleph/R-101..R-115, one per task in Aleph bench/tasks.md, written by the lead as Owner proxy from Aleph's goldens (tests/aph/bench_*.out/.args, expect/out/up.txt); hidden: true, outcome texts only
- hidden oracles in witnesses/hidden/R-1NN.oracles.yaml (stdout/file + exit_code == 0 + stderr == ""); fixtures results/aleph/fixtures/R-107,R-108,R-113 (Aleph data/in.txt, out/ for upper)
- ADR-0016 Proposed: hidden oracle location, validate rejects inline oracles on hidden contracts, new `file "<path>" == "<text>"` oracle
- builder implemented loading (RDD_HIDDEN_DIR override for tests) and the file oracle without reading witnesses/hidden/
- R-109 covers the arguments case of maxmin; the no-arguments error case (bench_maxmin_none) is not a contract yet
- witness (lead, aleph a96ce3e, Aleph's own programs as builds): R-101..R-115 all observed 3/3, p95 native ≤ 0.087s; R-101 with bench_evens → refuted; hidden dir missing → inconclusive exit 3
- tests: the two observed cli tests now use test/fixtures/witness-validate.result.yaml (R-002 without its time bound) — under VPS load 5 the 2s bound flaked once inside the parallel test run; R-002 itself unchanged
- verified: npm run ci exit 0, 124/124
- bundle sha256:
  - R-101 cfec9a6aa0ba83a6493523ab22be22b3edf02db82fb5e3eb1fb78f9f334349ba
  - R-102 2d20b23ce5591ec445456764bafb67bfbeb71bd3dc3dd2fee34f4f01f0226283
  - R-103 398f90eff354213871a32a29226c61590b5ed1fb80eac0e32235c58045e08b21
  - R-104 cdec51413f87aefb13bfdcb75cd2b647b3e1dde26b367d2363cbcc5141440ae3
  - R-105 82e7c787c4f32dd4e38800a244775db0678d3e6728a1d207ce5d7b4c7d81f59f
  - R-106 26587570837740922aed4e5e027b8f5bbb0f2f85d51a27fa07927f537a7e5955
  - R-107 dffb130618b9cf876ae531a0b176218895dbaf78c5c7fa31057d8042d42cf245
  - R-108 acc46af770b0ee3fb409af90ef65e391b59f84a2eca307c7f59dc14efd19aa48
  - R-109 a5447705afd499f5e5d2c6f688be09da6bba6dec15eb1584ee50fef4ec30f8ea
  - R-110 cdaf57c4daffb6ff840f97b9b0b4da7b3467890c0ba55a46fc06d959e34c4f27
  - R-111 c63c6babcf46f8d5ecd050f66edfb2c95e32d9b0b737f4b23e507f60b6af3e8f
  - R-112 cb96ddcc628cbc9c0aff3d7449b68853445fdc908139775c9aab82cf2949364f
  - R-113 dbb9da422dfe98d173bf40e31eea7285d63dcdf8f2978cfdcb789e589cf50c56
  - R-114 128515c29f5fc5e518fd0ed5a3e77dd75ffc41c115254e0a5ccd14d5143cb23f
  - R-115 52a0ce5e87de74d72d5960e571b8e6a56857f893ce6e628317fccffd3128069d
- next: T-008

## 2026-11-21T00:10 T-008 done
- src/ledger.js: append-only ledger entries {result, verdict, at, bundle_sha256, contract_sha256, build_sha256, witness, reasons?}, idempotent by bundle sha256, schema-validated, never rewrites lines; src/render-ledger.js: human table + "since <at>" / "not observed"
- `rdd ledger append <bundle>...` and `rdd ledger R-NNN [--text]` (JSON lines on stdout as stored)
- contract results/R-008.result.yaml; ledger/results.jsonl backfilled by the lead (Gatekeeper role) with the 18 committed bundles, then R-008's own bundle (19 lines)
- witness (lead): npm run ci exit 0, 143/143; R-008 observed 3/3 (bundle dd8e21c6…); re-append → 0 appended 18 skipped; unknown id → empty, exit 0; bad id → exit 2
- M1 complete. Lead stops here: M2 (T-009+) needs P2 (browser Witness)

## 2026-11-21T06:55 T-009 done
- ADR-0017 Proposed: the browser Witness spawns P2's CLI (`autonomous-qa/witness/bin/rdd-witness-browser.mjs`) from a local checkout pinned in `witnesses/browser/PIN.json` (qursor-qa-tester ee4284c); scores (a) CLI at pinned commit 9, (b) import 5, (c) vendor 2, (d) npm git dep 2
- witnesses/browser/: pin check (HEAD == pin, clean `autonomous-qa/witness` + `vendor`, CLI exists) → exit 2 code `pin`; P2 exit 2/signal/timeout → exit 2 code `witness`; bundle re-checked against P1 evidence schema, contract id, contract sha256, kind browser, exit code ↔ verdict → exit 2 code `bundle`; checkout path `RDD_BROWSER_WITNESS_DIR` (default ~/projects/qursor-witness); registered in `rdd witness`
- contract results/R-009.result.yaml + sidecar results/oracles/R-009.oracles.yaml (demo signup → first project, 1 run)
- witness (lead, P2 demo on 127.0.0.1:4318, `rdd witness results/R-009.result.yaml`):
  - attempt 1 refuted (bundle a7faef1d…): Explorbot's research phase submitted the empty signup form, the test then started on the 400 validation page; agent flakiness, the adapter behaved correctly
  - attempt 2 observed (bundle 82ccbc99…): oracle ok (1 project owned by the user), 16 steps, 139.2 s, a11y 0
  - both verdicts appended to the ledger
- tests: test/witness-browser.test.js offline with fake pinned checkouts; the old "browser kind unimplemented" test now asserts exit 2 code `pin` for a missing checkout
- verified: npm run ci exit 0, 154/154
- environment note: Chromium on this VPS needs `LD_LIBRARY_PATH=~/.local/pw-libs/root/usr/lib/aarch64-linux-gnu`; one Chromium at a time, load < 3 (operator's job, ADR-0017)

## 2026-11-21T07:10 T-010 done
- ADR-0018 Proposed: HTTP oracle sidecars (`<contract dir>/oracles/<id>.oracles.yaml`, format of P2 docs/witness.md §5) get a schema in the spec: `spec/oracle-sidecar.schema.json`; every path starts with a single `/` (same origin). Scores: (a) schema + rdd validate 9, (b) leave it to P2 at witness time 4, (c) inline structured oracles 3
- src/validate.js: `validateSidecar`/`validateSidecarFile` (schema, placeholders only {email} {run} {project}, result id); `rdd validate x.oracles.yaml`; a non-hidden browser contract with oracles needs a valid sidecar covering every oracle outcome with in-range indices (code `sidecar`)
- results: R-010 (cli Witness on `rdd validate` of an off-origin sidecar), fixture results/examples/fixtures/R-010/off-origin.oracles.yaml; results/examples/oracles/R-014.oracles.yaml copied byte for byte from P2 (needed by R-014 and T-012)
- the final state via API is checked by P2's Witness (T-009): R-009 attempt 1 was refuted by that oracle (0 projects for the user), attempt 2 observed it (1 project)
- witness (lead): R-010 observed 3/3 (bundle febb59f6…); with the fixture made valid → refuted; R-014 example without its sidecar → validate exit 1 code sidecar
- verified: npm run ci exit 0, 168/168, oracle-sidecar schema check ok
- P2 note: P1 src/validate.js and spec/ changed; P2's vendored snapshot (47f27db) stays valid until it re-vendors

## 2026-11-21T07:40 T-011 done
- ADR-0019 Proposed: per-run metric vocabulary. Existing `max_steps`/`steps` and `serious_a11y_violations`; new optional upper bounds `max_errors`/`errors`, `max_lcp_ms`/`lcp_ms`, `max_cls`/`cls`, `max_inp_ms`/`inp_ms`; a set bound whose field a Witness does not emit is inconclusive. Scores: (a) name now 8, (b) wait for P2 5, (c) p75 Web Vitals 6
- src/verdict.js: the four bounds in RUN_BOUNDS/KNOWN_KEYS; spec/evidence.schema.json: run fields typed (non-negative integers/numbers)
- time to result, steps and a11y per run come from P2's browser Witness; errors and Web Vitals are not emitted by P2 yet (request to the MASTER)
- contract results/R-011.result.yaml + sidecar (3 runs, p50 ≤ 300 s, max_steps 30, a11y 0, anti-result: mail to another address)
- witness (lead): R-011 observed 3/3 (bundle 88057ad7…): steps 13/13/13, time 167.0/92.9/168.2 s, a11y 0, oracle and anti-result oracle ok; independent decide() cases for the new keys give the expected verdicts
- verified: npm run ci exit 0, 183/183; all committed bundles validate against the updated evidence schema

## 2026-11-21T08:00 T-013 done
- ADR-0020 Proposed: Gatekeeper. A contract is touched by a change to its own file, sidecar, hidden oracles, fixtures, repo-file witness.target, its Witness (`witnesses/<kind>/`) or anything under its `capabilities.fs.read`; `--contract` forces, `--all` takes all. Scores: (a) contract-declared paths 8, (b) witness everything 5, (c) separate map file 4. Decision block (exit 1: refuted, Witness error, invalid contract, undeclared capability use) / owner (exit 3: inconclusive or capability diff) / pass (exit 0)
- `rdd gate --base <ref> --out <dir> [--contract p]... [--all] [--ledger p] [--text]`: src/gate.js, src/render-gate.js, src/witnesses.js (Witness registry shared with `rdd witness`); report `<out>/gate.json`; capability diff vs `git show <base>:<contract>`; undeclared use from bundle `capabilities_used`
- contract results/R-013.result.yaml (gate blocks a broken result, named, exit 1) with fixture results/examples/fixtures/R-013/broken.result.yaml (R-913, a cli result that does not hold)
- witness (lead): R-013 observed 3/3 (bundle b3e3acdb…); fixture made to hold → R-013 refuted; real gate `--base main` on the T-013 change: touched R-002, R-005, R-008, R-010, R-013, all observed, decision owner (R-013 is new, so its capabilities are a diff), browser and aleph contracts not touched
- verified: npm run ci exit 0, 206/206

## 2026-11-21T06:25 T-014 done
- ADR-0021 Proposed: one-shot `rdd watch` decides due results from the ledger; any scheduler calls it. Accepted = latest ledger entry `observed`; due = `now - latest.at >= watch.interval` (m/h/d); `watch.target` overrides `witness.target` for Watch only; reopen = refuted ledger entry with `source: "watch"` + `reopen` diagnostic + exit 1. Scores: (a) one-shot 8, (b) daemon 4, (c) edit TASKS/issue 3
- src/watch.js: `parseInterval`, `latestEntries` (later line wins ties), `watchPlan` (due/not-due/not-accepted, no-interval absent), `runWatch` (runs due contracts sorted by path via src/witnesses.js, writes `<out>/watch.json`, appends bundles with `source: "watch"` unless `--dry-run`); src/render-watch.js for `--text`
- src/ledger.js: optional `source` on `ledgerEntry`/`appendBundles` (absent for Gatekeeper/manual entries, key order unchanged); src/gate.js: `listContracts(root, dir = "results")` so Watch can walk another results dir
- bin/rdd.js: `watch --out <dir> [--results] [--ledger] [--now] [--dry-run] [--text]`, JSON diagnostics on stderr (`watch-contract`, `reopen`, `watch`), usage exit 2 for missing `--out` / bad `--now`
- contract results/R-016.result.yaml + fixtures R-916 (due, refuted → reopened) and R-917 (not-due), watch.interval 24h; spec watch.target added in T-014 setup
- verified: npm run ci exit 0, 220/220; R-016 command line exits 1 with empty stdout and writes watch.json (R-916 due/refuted/reopened, R-917 not-due); fixture ledger byte-identical under --dry-run; a copied ledger gains exactly one `source: "watch"` refuted R-916 line
- witness (lead): R-016 observed 3/3 (bundle 410768b8…), fixture ledger byte-identical; R-916 made to hold → R-016 refuted; real `rdd watch --dry-run` on this repo: only R-014 has watch.interval, state not-accepted (never observed), exit 0
- note: the times in the headings of the T-009..T-013 entries above were estimates written by the lead, not wall-clock times; from this entry on, headings use `date -u`

## 2026-11-21T06:30 T-015 done
- ADR-0022 Proposed: `rdd report --month YYYY-MM [--ledger] [--results] [--text]` from the ledger plus git history. Accepted without code review = first observed in the month (ADR-0003: no line-by-line review ever); regressions found by Watch = refuted entries with source watch; time to acceptance = hours from the commit that added the contract to its first observed, negative → 0, p50. Scores: (a) ledger + git 8, (b) separate counters 4, (c) GitHub reviews 3
- src/report.js, src/render-report.js, `rdd report` in bin/rdd.js; compact JSON on stdout, --text for humans
- contract results/R-015.result.yaml with fixture ledger results/examples/fixtures/R-015/ledger.jsonl (October and December entries to test the month bounds)
- witness (lead): R-015 observed 3/3 (bundle 81b137cb…); fixture without source watch → R-015 refuted
- real report for 2026-11 on this repo: 24 results accepted, 0 regressions found by Watch, time to acceptance p50 0 h — contracts here were committed with the code after the witness, so the metric is 0 by construction; it becomes meaningful when the Owner commits the contract (gate 1) before the Builder starts
- verified: npm run ci exit 0, 235/235
