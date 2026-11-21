import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  acceptedInMonth,
  contractAddedAt,
  firstObserved,
  monthRange,
  timeToAcceptance,
  watchRegressions,
} from "../src/report.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const FIXTURE_LEDGER = "results/examples/fixtures/R-015/ledger.jsonl";

function tempDir(t) {
  const dir = mkdtempSync(join(tmpdir(), "rdd-report-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function run(args) {
  return spawnSync(process.execPath, ["bin/rdd.js", ...args], {
    cwd: ROOT,
    encoding: "utf8",
  });
}

function git(cwd, args) {
  const result = spawnSync(
    "git",
    ["-c", "user.name=RDD Test", "-c", "user.email=rdd@example.com", ...args],
    { cwd, encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr);
}

test("monthRange returns the UTC half-open month range", () => {
  assert.deepEqual(monthRange("2026-11"), {
    start: Date.UTC(2026, 10, 1),
    end: Date.UTC(2026, 11, 1),
  });
});

test("monthRange crosses the December to January boundary", () => {
  const range = monthRange("2026-12");
  assert.equal(new Date(range.start).toISOString(), "2026-12-01T00:00:00.000Z");
  assert.equal(new Date(range.end).toISOString(), "2027-01-01T00:00:00.000Z");
});

test("monthRange rejects malformed months", () => {
  for (const value of ["2026-13", "2026-00", "2026-1", "202611", "abc", "2026-11-01", ""]) {
    assert.throws(() => monthRange(value), /invalid month/);
  }
});

test("firstObserved keeps the earliest observed entry and ignores other verdicts", () => {
  const observed = firstObserved([
    { result: "R-001", verdict: "refuted", at: "2026-11-01T00:00:00.000Z" },
    { result: "R-001", verdict: "observed", at: "2026-11-20T00:00:00.000Z" },
    { result: "R-001", verdict: "observed", at: "2026-11-10T00:00:00.000Z" },
    { result: "R-002", verdict: "refuted", at: "2026-11-05T00:00:00.000Z" },
  ]);

  assert.deepEqual([...observed], [["R-001", "2026-11-10T00:00:00.000Z"]]);
});

test("acceptedInMonth excludes results first observed in the previous month", () => {
  const entries = [
    { result: "R-008", verdict: "observed", at: "2026-10-31T23:59:59.000Z" },
    { result: "R-008", verdict: "observed", at: "2026-11-15T00:00:00.000Z" },
    { result: "R-002", verdict: "observed", at: "2026-11-20T00:00:00.000Z" },
    { result: "R-005", verdict: "refuted", at: "2026-11-01T00:00:00.000Z" },
  ];

  assert.deepEqual(acceptedInMonth(entries, monthRange("2026-11")), ["R-002"]);
});

test("watchRegressions keeps only watch refutations inside the month", () => {
  const entries = [
    { result: "R-002", verdict: "refuted", source: "watch", at: "2026-11-21T00:00:00.000Z" },
    { result: "R-002", verdict: "refuted", source: "watch", at: "2026-11-21T00:00:00.000Z" },
    { result: "R-003", verdict: "refuted", at: "2026-11-10T00:00:00.000Z" },
    { result: "R-004", verdict: "observed", source: "watch", at: "2026-11-10T00:00:00.000Z" },
    { result: "R-008", verdict: "refuted", source: "watch", at: "2026-12-01T00:00:00.000Z" },
    { result: "R-009", verdict: "refuted", source: "watch", at: "2026-10-31T00:00:00.000Z" },
  ];

  assert.deepEqual(watchRegressions(entries, monthRange("2026-11")), ["R-002"]);
});

test("timeToAcceptance clamps negative time to zero, leaves unknown out and rounds", () => {
  const first = new Map([
    ["R-001", "2026-11-20T10:00:00.000Z"],
    ["R-002", "2026-11-20T10:00:00.000Z"],
    ["R-003", "2026-11-20T10:00:00.000Z"],
    ["R-004", "2026-11-20T10:00:00.000Z"],
  ]);
  const added = new Map([
    ["R-001", "2026-11-20T00:00:00.000Z"],
    ["R-002", "2026-11-21T00:00:00.000Z"],
    ["R-003", null],
    ["R-004", "2026-11-20T06:40:00.000Z"],
  ]);

  const time = timeToAcceptance(["R-001", "R-002", "R-003", "R-004"], first, added);

  assert.deepEqual(time.results, { "R-001": 10, "R-002": 0, "R-003": null, "R-004": 3.33 });
  assert.equal(time.p50, 3.33);
});

test("timeToAcceptance returns a null p50 when there are no known times", () => {
  const time = timeToAcceptance(
    ["R-001"],
    new Map([["R-001", "2026-11-20T10:00:00.000Z"]]),
    new Map([["R-001", null]]),
  );

  assert.deepEqual(time, { p50: null, results: { "R-001": null } });
  assert.deepEqual(timeToAcceptance([], new Map(), new Map()), { p50: null, results: {} });
});

test("contractAddedAt finds the earliest commit that added the file", (t) => {
  const dir = tempDir(t);
  git(dir, ["init"]);
  writeFileSync(join(dir, "contract.yaml"), "id: R-001\n");
  git(dir, ["add", "contract.yaml"]);
  git(dir, ["commit", "-m", "add contract"]);

  const added = contractAddedAt("contract.yaml", { cwd: dir });

  assert.equal(typeof added, "string");
  assert.equal(Number.isNaN(Date.parse(added)), false);
});

test("contractAddedAt returns null for an untracked file", (t) => {
  const dir = tempDir(t);
  git(dir, ["init"]);
  writeFileSync(join(dir, "untracked.yaml"), "id: R-002\n");

  assert.equal(contractAddedAt("untracked.yaml", { cwd: dir }), null);
});

test("CLI report prints the monthly JSON for the fixture", () => {
  const result = run(["report", "--month", "2026-11", "--ledger", FIXTURE_LEDGER]);

  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  assert.ok(result.stdout.includes('"accepted_without_code_review":{"count":2,"results":["R-002","R-005"]}'));
  assert.ok(result.stdout.includes('"regressions_found_by_watch":{"count":1,"results":["R-002"]}'));
  assert.ok(result.stdout.includes('"time_to_acceptance_h":{"p50":'));
});

test("CLI report --text prints human text", () => {
  const result = run(["report", "--month", "2026-11", "--ledger", FIXTURE_LEDGER, "--text"]);

  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  assert.notEqual(result.stdout.trim().startsWith("{"), true);
  assert.match(result.stdout, /monthly report: 2026-11/);
});

test("CLI report requires --month", () => {
  const result = run(["report", "--ledger", FIXTURE_LEDGER]);

  assert.equal(result.status, 2);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /"code":"usage"/);
});

test("CLI report rejects an invalid month", () => {
  const result = run(["report", "--month", "2026-13", "--ledger", FIXTURE_LEDGER]);

  assert.equal(result.status, 2);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /"code":"usage"/);
});
