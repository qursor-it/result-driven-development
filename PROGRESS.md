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
