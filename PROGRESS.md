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
