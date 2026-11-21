import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { latestEntries, parseInterval, watchPlan } from "../src/watch.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const FIXTURE = "results/examples/fixtures/R-016";

function tempDir(t) {
  const dir = mkdtempSync(join(tmpdir(), "rdd-watch-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function run(args) {
  return spawnSync(process.execPath, ["bin/rdd.js", ...args], {
    cwd: ROOT,
    encoding: "utf8",
  });
}

function contract(id, watch) {
  return {
    path: `results/${id}.result.yaml`,
    contract: watch === undefined ? { id } : { id, watch },
  };
}

test("parseInterval converts m, h and d to milliseconds", () => {
  assert.equal(parseInterval("15m"), 15 * 60_000);
  assert.equal(parseInterval("24h"), 24 * 3_600_000);
  assert.equal(parseInterval("2d"), 2 * 86_400_000);
});

test("parseInterval rejects invalid intervals", () => {
  for (const value of ["", "24", "h", "-1h", "1.5h", "24w", "24 h"]) {
    assert.throws(() => parseInterval(value), /invalid interval/);
  }
});

test("latestEntries keeps the latest entry per result, later line wins ties", () => {
  const latest = latestEntries([
    { result: "R-001", at: "2026-11-20T12:00:00.000Z", verdict: "observed" },
    { result: "R-002", at: "2026-11-20T13:00:00.000Z", verdict: "observed" },
    { result: "R-001", at: "2026-11-20T14:00:00.000Z", verdict: "refuted" },
    { result: "R-002", at: "2026-11-20T13:00:00.000Z", verdict: "refuted" },
  ]);

  assert.equal(latest.get("R-001").verdict, "refuted");
  assert.equal(latest.get("R-001").at, "2026-11-20T14:00:00.000Z");
  assert.equal(latest.get("R-002").verdict, "refuted");
});

test("watchPlan marks due, not-due, not-accepted and ignores contracts without an interval", () => {
  const now = new Date("2026-11-21T00:00:00Z");
  const contracts = [
    contract("R-001", { interval: "24h" }),
    contract("R-002", { interval: "24h" }),
    contract("R-003", { interval: "24h" }),
    contract("R-004", { interval: "24h" }),
    contract("R-005"),
  ];
  const entries = [
    { result: "R-001", at: "2026-11-20T00:00:00.000Z", verdict: "observed" },
    { result: "R-002", at: "2026-11-20T12:00:00.000Z", verdict: "observed" },
    { result: "R-003", at: "2026-11-20T00:00:00.000Z", verdict: "refuted" },
  ];

  const plan = watchPlan(contracts, entries, now);

  assert.deepEqual(
    plan.map((item) => item.id),
    ["R-001", "R-002", "R-003", "R-004"],
  );
  assert.deepEqual(plan[0], {
    id: "R-001",
    path: "results/R-001.result.yaml",
    last_at: "2026-11-20T00:00:00.000Z",
    state: "due",
  });
  assert.equal(plan[1].state, "not-due");
  assert.equal(plan[2].state, "not-accepted");
  assert.equal(plan[2].last_at, "2026-11-20T00:00:00.000Z");
  assert.equal(plan[3].state, "not-accepted");
  assert.equal(plan[3].last_at, null);
});

test("watchPlan treats the exact interval boundary as due", () => {
  const contracts = [contract("R-001", { interval: "1h" })];
  const entries = [
    { result: "R-001", at: "2026-11-20T23:00:00.000Z", verdict: "observed" },
  ];

  const plan = watchPlan(contracts, entries, new Date("2026-11-21T00:00:00.000Z"));

  assert.equal(plan[0].state, "due");
});

test("rdd watch --dry-run reopens R-916 without touching the fixture ledger", (t) => {
  const ledgerPath = join(ROOT, FIXTURE, "ledger.jsonl");
  const before = readFileSync(ledgerPath);
  const out = tempDir(t);

  const result = run([
    "watch",
    "--results",
    `${FIXTURE}/results`,
    "--ledger",
    `${FIXTURE}/ledger.jsonl`,
    "--now",
    "2026-11-21T00:00:00Z",
    "--dry-run",
    "--out",
    out,
  ]);

  assert.equal(result.status, 1, result.stderr);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /"reopened":\["R-916"\]/);
  assert.match(result.stderr, /"code":"reopen"/);
  assert.deepEqual(readFileSync(ledgerPath), before);

  const report = JSON.parse(readFileSync(join(out, "watch.json"), "utf8"));
  assert.deepEqual(report.reopened, ["R-916"]);
  assert.equal(report.now, "2026-11-21T00:00:00.000Z");

  const reopened = report.contracts.find((entry) => entry.id === "R-916");
  assert.equal(reopened.state, "due");
  assert.equal(reopened.verdict, "refuted");
  assert.equal(reopened.reopened, true);

  const notDue = report.contracts.find((entry) => entry.id === "R-917");
  assert.equal(notDue.state, "not-due");
  assert.equal(notDue.reopened, false);
});

test("rdd watch appends one source:watch refuted entry to a copied ledger", (t) => {
  const before = readFileSync(join(ROOT, FIXTURE, "ledger.jsonl"));
  const root = tempDir(t);
  const ledgerPath = join(root, "ledger.jsonl");
  writeFileSync(ledgerPath, before);
  const out = tempDir(t);

  const result = run([
    "watch",
    "--results",
    `${FIXTURE}/results`,
    "--ledger",
    ledgerPath,
    "--now",
    "2026-11-21T00:00:00Z",
    "--out",
    out,
  ]);

  assert.equal(result.status, 1, result.stderr);
  assert.equal(result.stdout, "");

  const after = readFileSync(ledgerPath, "utf8");
  const lines = after.trimEnd().split("\n");
  const beforeLines = before.toString("utf8").trimEnd().split("\n");

  assert.equal(lines.length, beforeLines.length + 1);
  assert.equal(lines.slice(0, beforeLines.length).join("\n"), beforeLines.join("\n"));

  const appended = JSON.parse(lines.at(-1));
  assert.equal(appended.result, "R-916");
  assert.equal(appended.verdict, "refuted");
  assert.equal(appended.source, "watch");
});

test("rdd watch without --out exits 2", () => {
  const result = run(["watch", "--results", `${FIXTURE}/results`]);

  assert.equal(result.status, 2);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /"code":"usage"/);
});

test("rdd watch with an unparsable --now exits 2", (t) => {
  const out = tempDir(t);
  const result = run([
    "watch",
    "--out",
    out,
    "--results",
    `${FIXTURE}/results`,
    "--now",
    "not-a-date",
  ]);

  assert.equal(result.status, 2);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /"code":"usage"/);
});
