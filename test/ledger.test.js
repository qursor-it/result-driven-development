import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildBundle, sha256, writeBundle } from "../src/evidence.js";
import { appendBundles, history, ledgerEntry, readLedger } from "../src/ledger.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const CONTRACT = join(ROOT, "spec", "result-contract.schema.json");

function tempDir(t) {
  const dir = mkdtempSync(join(tmpdir(), "rdd-ledger-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function makeBundle(root, name, overrides = {}) {
  const bundle = buildBundle({
    result: "R-001",
    contractPath: CONTRACT,
    buildSha256: "b".repeat(64),
    witness: { kind: "cli", version: "0.1.0" },
    verdict: "observed",
    runs: [],
    at: "2026-11-20T12:00:00.000Z",
    ...overrides,
  });
  return writeBundle(bundle, join(root, "evidence", name)).path;
}

function run(args) {
  return spawnSync(process.execPath, ["bin/rdd.js", ...args], {
    cwd: ROOT,
    encoding: "utf8",
  });
}

test("ledgerEntry has a fixed key order and maps bundle fields", () => {
  const bundle = buildBundle({
    result: "R-001",
    contractPath: CONTRACT,
    buildSha256: "b".repeat(64),
    witness: { kind: "cli", version: "0.1.0" },
    verdict: "observed",
    runs: [],
    at: "2026-11-20T12:00:00.000Z",
  });

  const entry = ledgerEntry(bundle, "a".repeat(64));

  assert.deepEqual(Object.keys(entry), [
    "result",
    "verdict",
    "at",
    "bundle_sha256",
    "contract_sha256",
    "build_sha256",
    "witness",
  ]);
  assert.equal(entry.result, "R-001");
  assert.equal(entry.verdict, "observed");
  assert.equal(entry.at, bundle.at);
  assert.equal(entry.bundle_sha256, "a".repeat(64));
  assert.equal(entry.contract_sha256, bundle.contract_sha256);
  assert.equal(entry.build_sha256, "b".repeat(64));
  assert.equal(entry.witness, "cli@0.1.0");
});

test("ledgerEntry includes reasons last only when non-empty", () => {
  const base = {
    result: "R-001",
    contractPath: CONTRACT,
    buildSha256: "b".repeat(64),
    witness: { kind: "cli", version: "0.1.0" },
    verdict: "refuted",
    runs: [],
    at: "2026-11-20T12:00:00.000Z",
  };

  const empty = ledgerEntry(buildBundle({ ...base, reasons: [] }), "a".repeat(64));
  assert.equal("reasons" in empty, false);

  const entry = ledgerEntry(buildBundle({ ...base, reasons: ["one", "two"] }), "a".repeat(64));
  assert.deepEqual(Object.keys(entry).slice(-1), ["reasons"]);
  assert.deepEqual(entry.reasons, ["one", "two"]);
});

test("appendBundles appends sorted entries and readLedger returns them", (t) => {
  const root = tempDir(t);
  const ledgerPath = join(root, "ledger", "results.jsonl");
  const later = makeBundle(root, "later", { at: "2026-11-20T13:00:00.000Z" });
  const earlier = makeBundle(root, "earlier", { at: "2026-11-20T12:00:00.000Z" });

  const result = appendBundles([later, earlier], { ledgerPath });

  assert.deepEqual(result, { appended: 2, skipped: 0 });
  const entries = readLedger(ledgerPath);
  assert.deepEqual(
    entries.map((entry) => entry.at),
    ["2026-11-20T12:00:00.000Z", "2026-11-20T13:00:00.000Z"],
  );
  assert.equal(entries[0].bundle_sha256, sha256(readFileSync(earlier)));
  assert.equal(entries[1].bundle_sha256, sha256(readFileSync(later)));
  assert.equal(readFileSync(ledgerPath, "utf8"), `${entries.map((entry) => JSON.stringify(entry)).join("\n")}\n`);
});

test("appending the same bundle twice is skipped and leaves the file unchanged", (t) => {
  const root = tempDir(t);
  const ledgerPath = join(root, "ledger", "results.jsonl");
  const bundle = makeBundle(root, "bundle");

  assert.deepEqual(appendBundles([bundle], { ledgerPath }), { appended: 1, skipped: 0 });
  const before = readFileSync(ledgerPath);

  assert.deepEqual(appendBundles([bundle], { ledgerPath }), { appended: 0, skipped: 1 });
  assert.deepEqual(readFileSync(ledgerPath), before);
});

test("existing lines are byte-identical after a later append", (t) => {
  const root = tempDir(t);
  const ledgerPath = join(root, "ledger", "results.jsonl");
  const first = makeBundle(root, "first", { at: "2026-11-20T12:00:00.000Z" });
  const second = makeBundle(root, "second", { at: "2026-11-20T13:00:00.000Z" });

  appendBundles([first], { ledgerPath });
  const before = readFileSync(ledgerPath);

  appendBundles([second], { ledgerPath });
  const after = readFileSync(ledgerPath);

  assert.equal(after.subarray(0, before.length).toString("utf8"), before.toString("utf8"));
  assert.ok(after.length > before.length);
});

test("an invalid bundle throws and appends nothing", (t) => {
  const root = tempDir(t);
  const ledgerPath = join(root, "ledger", "results.jsonl");
  const good = makeBundle(root, "good");
  const invalid = join(root, "invalid.json");
  writeFileSync(invalid, JSON.stringify({ result: "R-001" }));

  appendBundles([good], { ledgerPath });
  const before = readFileSync(ledgerPath, "utf8");
  const later = makeBundle(root, "later", { at: "2026-11-20T13:00:00.000Z" });

  assert.throws(
    () => appendBundles([later, invalid], { ledgerPath }),
    /invalid evidence bundle/,
  );
  assert.equal(readFileSync(ledgerPath, "utf8"), before);
});

test("an invalid bundle does not create a missing ledger", (t) => {
  const root = tempDir(t);
  const ledgerPath = join(root, "ledger", "results.jsonl");
  const invalid = join(root, "invalid.json");
  writeFileSync(invalid, "{}\n");

  assert.throws(
    () => appendBundles([invalid], { ledgerPath }),
    /invalid evidence bundle/,
  );
  assert.equal(existsSync(ledgerPath), false);
});

test("history filters by result id in file order", (t) => {
  const root = tempDir(t);
  const ledgerPath = join(root, "ledger", "results.jsonl");
  const bundles = [
    makeBundle(root, "one", { result: "R-001", at: "2026-11-20T12:00:00.000Z" }),
    makeBundle(root, "two", { result: "R-002", at: "2026-11-20T13:00:00.000Z" }),
    makeBundle(root, "three", { result: "R-001", at: "2026-11-20T14:00:00.000Z" }),
  ];
  appendBundles(bundles, { ledgerPath });

  const selected = history(readLedger(ledgerPath), "R-001");

  assert.deepEqual(
    selected.map((entry) => entry.at),
    ["2026-11-20T12:00:00.000Z", "2026-11-20T14:00:00.000Z"],
  );
});

test("readLedger returns [] for a missing file", (t) => {
  const root = tempDir(t);
  assert.deepEqual(readLedger(join(root, "missing.jsonl")), []);
});

test("readLedger reports the line number of a malformed line", (t) => {
  const root = tempDir(t);
  const ledgerPath = join(root, "results.jsonl");
  writeFileSync(ledgerPath, `${JSON.stringify({ result: "R-001" })}\nnot json\n`);

  assert.throws(() => readLedger(ledgerPath), /line 2/);
});

test("CLI append then ledger history prints stored JSON lines", (t) => {
  const root = tempDir(t);
  const ledgerPath = join(root, "ledger", "results.jsonl");
  const first = makeBundle(root, "first", { at: "2026-11-20T12:00:00.000Z" });
  const second = makeBundle(root, "second", { at: "2026-11-20T13:00:00.000Z" });

  const append = run(["ledger", "append", first, second, "--ledger", ledgerPath]);
  assert.equal(append.status, 0);
  assert.equal(append.stdout, "");
  assert.deepEqual(JSON.parse(append.stderr.trim()), {
    level: "info",
    code: "ledger",
    appended: 2,
    skipped: 0,
  });

  const historyResult = run(["ledger", "R-001", "--ledger", ledgerPath]);
  assert.equal(historyResult.status, 0);
  assert.equal(historyResult.stderr, "");
  assert.equal(historyResult.stdout, readFileSync(ledgerPath, "utf8"));
});

test("CLI ledger --text prints a table and since the first observed of the run", (t) => {
  const root = tempDir(t);
  const ledgerPath = join(root, "ledger", "results.jsonl");
  const first = makeBundle(root, "first", { at: "2026-11-20T12:00:00.000Z" });
  const second = makeBundle(root, "second", { at: "2026-11-20T13:00:00.000Z" });
  appendBundles([first, second], { ledgerPath });

  const result = run(["ledger", "R-001", "--ledger", ledgerPath, "--text"]);
  const entries = readLedger(ledgerPath);
  const lines = result.stdout.trimEnd().split("\n");

  assert.equal(result.status, 0);
  assert.deepEqual(lines, [
    `${entries[0].at}  observed  ${entries[0].bundle_sha256.slice(0, 12)}  cli@0.1.0`,
    `${entries[1].at}  observed  ${entries[1].bundle_sha256.slice(0, 12)}  cli@0.1.0`,
    "since 2026-11-20T12:00:00.000Z",
  ]);
});

test("CLI ledger --text says not observed after a refuted last verdict", (t) => {
  const root = tempDir(t);
  const ledgerPath = join(root, "ledger", "results.jsonl");
  const observed = makeBundle(root, "observed", { at: "2026-11-20T12:00:00.000Z" });
  const refuted = makeBundle(root, "refuted", {
    at: "2026-11-20T13:00:00.000Z",
    verdict: "refuted",
    reasons: ["threshold missed"],
  });
  appendBundles([observed, refuted], { ledgerPath });

  const result = run(["ledger", "R-001", "--ledger", ledgerPath, "--text"]);

  assert.equal(result.status, 0);
  assert.equal(result.stdout.trimEnd().split("\n").at(-1), "not observed");
});

test("CLI ledger rejects a bad result id with exit 2", (t) => {
  const root = tempDir(t);
  const ledgerPath = join(root, "ledger", "results.jsonl");

  const result = run(["ledger", "foo", "--ledger", ledgerPath]);

  assert.equal(result.status, 2);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /"code":"usage"/);
});

test("CLI ledger for an unknown id prints nothing and exits 0", (t) => {
  const root = tempDir(t);
  const ledgerPath = join(root, "ledger", "results.jsonl");

  const result = run(["ledger", "R-999", "--ledger", ledgerPath]);

  assert.equal(result.status, 0);
  assert.equal(result.stdout, "");
});

test("CLI ledger append without bundles exits 2", (t) => {
  const root = tempDir(t);
  const ledgerPath = join(root, "ledger", "results.jsonl");

  const result = run(["ledger", "append", "--ledger", ledgerPath]);

  assert.equal(result.status, 2);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /"code":"usage"/);
});

test("CLI ledger append of an invalid bundle exits 1 and appends nothing", (t) => {
  const root = tempDir(t);
  const ledgerPath = join(root, "ledger", "results.jsonl");
  const invalid = join(root, "invalid.json");
  writeFileSync(invalid, "{}\n");

  const result = run(["ledger", "append", invalid, "--ledger", ledgerPath]);

  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /"level":"error"/);
  assert.equal(existsSync(ledgerPath), false);
});

test("CLI ledger reports a malformed ledger with exit 1", (t) => {
  const root = tempDir(t);
  const ledgerPath = join(root, "results.jsonl");
  writeFileSync(ledgerPath, "not json\n");

  const result = run(["ledger", "R-001", "--ledger", ledgerPath]);

  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /"code":"ledger"/);
  assert.match(result.stderr, /line 1/);
});
