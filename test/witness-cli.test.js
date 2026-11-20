import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkOracle, parseOracle } from "../witnesses/cli/oracle.js";
import { compileSchema } from "../src/schemas.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const WITNESS = join(ROOT, "witnesses", "cli", "witness.js");
const RDD = join(ROOT, "bin", "rdd.js");
const FIXTURES = join(ROOT, "test", "fixtures");
const validateEvidence = compileSchema("evidence");

function tempDir(t) {
  const dir = mkdtempSync(join(tmpdir(), "rdd-witness-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function runWitness(args) {
  return spawnSync(process.execPath, [WITNESS, ...args], { cwd: ROOT, encoding: "utf8" });
}

function runRdd(args) {
  return spawnSync(process.execPath, [RDD, ...args], { cwd: ROOT, encoding: "utf8" });
}

function readBundle(dir) {
  return JSON.parse(readFileSync(join(dir, "bundle.json"), "utf8"));
}

function diagnostics(stderr) {
  return stderr
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

const supportedOracles = [
  ['stdout == "3\\n"', { stream: "stdout", op: "==", expected: "3\n" }],
  ['stdout contains "ell"', { stream: "stdout", op: "contains", expected: "ell" }],
  ['stderr == "boom"', { stream: "stderr", op: "==", expected: "boom" }],
  ['stderr contains "warn"', { stream: "stderr", op: "contains", expected: "warn" }],
  ["exit_code == 0", { stream: "exit_code", op: "==", expected: 0 }],
  ["exit_code != 1", { stream: "exit_code", op: "!=", expected: 1 }],
];

for (const [text, expected] of supportedOracles) {
  test(`parseOracle supports ${text}`, () => {
    assert.deepEqual(parseOracle(text), { supported: true, ...expected });
  });
}

test("parseOracle decodes JSON escapes in string literals", () => {
  const oracle = parseOracle('stdout == "a\\"b\\\\c\\n"');
  assert.equal(oracle.supported, true);
  assert.equal(oracle.expected, 'a"b\\c\n');
  assert.equal(checkOracle(oracle, { stdout: 'a"b\\c\n' }).ok, true);
});

const unsupportedOracles = [
  'stdout != "x"',
  'stderr != "x"',
  "exit_code contains 1",
  "stdout == 3",
  'stdout ~ "x"',
  'exit_code == "0"',
  "exit_code == 0.5",
  'stdout contains "unterminated',
  'contains "x"',
  "stdout ==",
  'STDOUT == "x"',
];

for (const text of unsupportedOracles) {
  test(`parseOracle rejects ${text}`, () => {
    assert.equal(parseOracle(text).supported, false);
  });
}

test("checkOracle compares streams and exit codes", () => {
  assert.equal(checkOracle('stdout == "3\\n"', { stdout: "3\n" }).ok, true);
  assert.equal(checkOracle('stdout == "3\\n"', { stdout: "3" }).ok, false);
  assert.equal(checkOracle('stdout contains "ell"', { stdout: "hello" }).ok, true);
  assert.equal(checkOracle('stderr == "boom"', { stderr: "boom" }).ok, true);
  assert.equal(checkOracle("exit_code == 0", { exitCode: 0 }).ok, true);
  assert.equal(checkOracle("exit_code != 0", { exitCode: 1 }).ok, true);
  assert.equal(checkOracle("exit_code == 0", { exitCode: 2 }).ok, false);
});

test("checkOracle reports an unsupported oracle as not ok", () => {
  const result = checkOracle('stdout != "x"', { stdout: "x" });
  assert.equal(result.supported, false);
  assert.equal(result.ok, false);
});

test("checkOracle truncates found stream values to 200 characters", () => {
  const result = checkOracle('stdout contains "x"', { stdout: "x".repeat(300) });
  assert.equal(result.ok, true);
  assert.equal(result.found.length, 200);
});

test("witnessing R-002 observes the result", (t) => {
  const out = tempDir(t);
  const result = runWitness(["results/R-002.result.yaml", "--out", out]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "");

  const bundle = readBundle(out);
  assert.equal(validateEvidence(bundle), true, JSON.stringify(validateEvidence.errors));
  assert.equal(bundle.result, "R-002");
  assert.equal(bundle.verdict, "observed");
  assert.equal(bundle.witness.kind, "cli");
  assert.equal(bundle.runs.length, 3);
  assert.ok(bundle.runs.every((run) => run.status === "success"));

  const lines = diagnostics(result.stderr);
  assert.equal(lines.filter((line) => line.code === "run").length, 3);
  const verdictLine = lines.find((line) => line.code === "verdict");
  assert.equal(verdictLine.verdict, "observed");
  assert.equal(verdictLine.bundle, join(out, "bundle.json"));
  assert.match(verdictLine.sha256, /^[0-9a-f]{64}$/);
});

test("a wrong stdout oracle refutes the result", (t) => {
  const out = tempDir(t);
  const result = runWitness([
    join(FIXTURES, "witness-wrong-stdout.result.yaml"),
    "--out",
    out,
  ]);

  assert.equal(result.status, 1, result.stderr);
  const bundle = readBundle(out);
  assert.equal(bundle.verdict, "refuted");
  assert.equal(bundle.runs[0].status, "failure");
  assert.equal(bundle.runs[0].oracles[0].ok, false);
});

test("a nonexistent target is inconclusive", (t) => {
  const out = tempDir(t);
  const result = runWitness([
    join(FIXTURES, "witness-missing-target.result.yaml"),
    "--out",
    out,
  ]);

  assert.equal(result.status, 3, result.stderr);
  const bundle = readBundle(out);
  assert.equal(bundle.verdict, "inconclusive");
  assert.equal(bundle.runs[0].status, "inconclusive");
});

test("an outcome without an oracle is inconclusive", (t) => {
  const out = tempDir(t);
  const result = runWitness([join(FIXTURES, "witness-no-oracle.result.yaml"), "--out", out]);

  assert.equal(result.status, 3, result.stderr);
  const bundle = readBundle(out);
  assert.equal(bundle.verdict, "inconclusive");
  assert.equal(bundle.runs[0].status, "inconclusive");
});

test("a timed out run is a failure and refutes the result", (t) => {
  const out = tempDir(t);
  const result = runWitness([join(FIXTURES, "witness-timeout.result.yaml"), "--out", out]);

  assert.equal(result.status, 1, result.stderr);
  const bundle = readBundle(out);
  assert.equal(bundle.verdict, "refuted");
  assert.equal(bundle.runs[0].status, "failure");
});

test("missing --out exits 2 with a JSON diagnostic", () => {
  const result = runWitness(["results/R-002.result.yaml"]);

  assert.equal(result.status, 2);
  assert.equal(result.stdout, "");
  const line = diagnostics(result.stderr).find((entry) => entry.level === "error");
  assert.equal(line.code, "usage");
});

test("rdd witness dispatches the cli kind", (t) => {
  const out = tempDir(t);
  const result = runRdd(["witness", "results/R-002.result.yaml", "--out", out]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "");
  const bundle = readBundle(out);
  assert.equal(bundle.verdict, "observed");
  assert.equal(bundle.runs.length, 3);
});

test("rdd witness rejects an unimplemented kind with exit 2", (t) => {
  const out = tempDir(t);
  const result = runRdd(["witness", "results/examples/R-014.result.yaml", "--out", out]);

  assert.equal(result.status, 2);
  assert.equal(result.stdout, "");
  const line = diagnostics(result.stderr).find((entry) => entry.level === "error");
  assert.equal(line.code, "usage");
  assert.match(line.message, /browser/);
});
