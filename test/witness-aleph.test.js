import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { compileSchema } from "../src/schemas.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const WITNESS = join(ROOT, "witnesses", "aleph", "witness.js");
const RDD = join(ROOT, "bin", "rdd.js");
const FIXTURES = join(ROOT, "test", "fixtures", "aleph");
const HIDDEN = join(ROOT, "test", "fixtures", "hidden");
const ALEPH = join(ROOT, "test", "fixtures", "fake-aleph.js");
const validateEvidence = compileSchema("evidence");

function tempDir(t) {
  const dir = mkdtempSync(join(tmpdir(), "rdd-witness-aleph-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function runWitness(args, env = {}) {
  return spawnSync(process.execPath, [WITNESS, ...args], {
    cwd: ROOT,
    encoding: "utf8",
    env: { ...process.env, ALEPH, ...env },
  });
}

function runRdd(args, env = {}) {
  return spawnSync(process.execPath, [RDD, ...args], {
    cwd: ROOT,
    encoding: "utf8",
    env: { ...process.env, ALEPH, ...env },
  });
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

test("aleph observes a result on both engines", (t) => {
  const out = tempDir(t);
  const result = runWitness([join(FIXTURES, "observed.result.yaml"), "--out", out]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "");

  const bundle = readBundle(out);
  assert.equal(validateEvidence(bundle), true, JSON.stringify(validateEvidence.errors));
  assert.equal(bundle.result, "R-901");
  assert.equal(bundle.verdict, "observed");
  assert.equal(bundle.witness.kind, "aleph");
  assert.match(bundle.witness.version, /\+aleph\.[0-9a-f]{12}$/);
  assert.equal(bundle.runs.length, 3);
  assert.ok(bundle.runs.every((run) => run.status === "success"));
  assert.equal(bundle.runs[0].oracles.length, 2);
  assert.match(bundle.runs[0].oracles[0].oracle, /^interp: /);
  assert.match(bundle.runs[0].oracles[1].oracle, /^native: /);
  assert.equal(typeof bundle.runs[0].time_to_result_s, "number");
  assert.equal(typeof bundle.runs[0].interp_time_s, "number");

  const lines = diagnostics(result.stderr);
  assert.equal(lines.filter((line) => line.code === "run").length, 3);
  const verdictLine = lines.find((line) => line.code === "verdict");
  assert.equal(verdictLine.verdict, "observed");
  assert.equal(verdictLine.bundle, join(out, "bundle.json"));
  assert.match(verdictLine.sha256, /^[0-9a-f]{64}$/);
});

test("aleph observes a hidden file oracle on both engines", (t) => {
  const out = tempDir(t);
  const result = runWitness([join(HIDDEN, "R-920.result.yaml"), "--out", out], {
    RDD_HIDDEN_DIR: HIDDEN,
  });

  assert.equal(result.status, 0, result.stderr);
  const bundle = readBundle(out);
  assert.equal(bundle.verdict, "observed");
  assert.deepEqual(
    bundle.runs[0].oracles.map((oracle) => oracle.ok),
    [true, true],
  );
  assert.match(bundle.runs[0].oracles[0].oracle, /^interp: file "out\/x.txt" ==/);
  assert.match(bundle.runs[0].oracles[1].oracle, /^native: file "out\/x.txt" ==/);
});

test("a wrong hidden aleph file oracle refutes the result", (t) => {
  const out = tempDir(t);
  const result = runWitness([join(HIDDEN, "R-921.result.yaml"), "--out", out], {
    RDD_HIDDEN_DIR: HIDDEN,
  });

  assert.equal(result.status, 1, result.stderr);
  const bundle = readBundle(out);
  assert.equal(bundle.verdict, "refuted");
  assert.ok(bundle.runs[0].oracles.every((oracle) => oracle.ok === false));
});

test("a failing aleph check refutes the result without running", (t) => {
  const out = tempDir(t);
  const result = runWitness([join(FIXTURES, "check-fail.result.yaml"), "--out", out]);

  assert.equal(result.status, 1, result.stderr);
  const bundle = readBundle(out);
  assert.equal(bundle.verdict, "refuted");
  assert.deepEqual(bundle.runs, []);
  assert.match(bundle.reasons[0], /^aleph check failed: /);
  assert.match(bundle.reasons[0], /check failed/);
});

test("a failing native build refutes the result without running", (t) => {
  const out = tempDir(t);
  const result = runWitness([join(FIXTURES, "build-fail.result.yaml"), "--out", out]);

  assert.equal(result.status, 1, result.stderr);
  const bundle = readBundle(out);
  assert.equal(bundle.verdict, "refuted");
  assert.deepEqual(bundle.runs, []);
  assert.match(bundle.reasons[0], /^aleph build failed: /);
  assert.match(bundle.reasons[0], /build failed/);
});

test("native output differing from the interpreter refutes the result", (t) => {
  const out = tempDir(t);
  const result = runWitness([join(FIXTURES, "mismatch.result.yaml"), "--out", out]);

  assert.equal(result.status, 1, result.stderr);
  const bundle = readBundle(out);
  assert.equal(bundle.verdict, "refuted");
  assert.equal(bundle.runs[0].status, "failure");
  assert.equal(bundle.runs[0].oracles[0].ok, true);
  assert.equal(bundle.runs[0].oracles[1].ok, false);
});

test("a missing toolchain is inconclusive and still writes a bundle", (t) => {
  const out = tempDir(t);
  const result = runWitness(
    [join(FIXTURES, "observed.result.yaml"), "--out", out],
    { ALEPH: "/nonexistent/aleph" },
  );

  assert.equal(result.status, 3, result.stderr);
  const bundle = readBundle(out);
  assert.equal(bundle.verdict, "inconclusive");
  assert.deepEqual(bundle.runs, []);
  assert.deepEqual(bundle.reasons, ["aleph toolchain not found: /nonexistent/aleph"]);
});

test("the program sees a copy of the contract fixture directory", (t) => {
  const out = tempDir(t);
  const result = runWitness([join(FIXTURES, "fixture-visible.result.yaml"), "--out", out]);

  assert.equal(result.status, 0, result.stderr);
  const bundle = readBundle(out);
  assert.equal(bundle.verdict, "observed");
  assert.ok(bundle.runs.every((run) => run.status === "success"));
});

test("declared file writes are reported in capabilities_used", (t) => {
  const out = tempDir(t);
  const result = runWitness([join(FIXTURES, "write-declared.result.yaml"), "--out", out]);

  assert.equal(result.status, 0, result.stderr);
  const bundle = readBundle(out);
  assert.equal(bundle.verdict, "observed");
  assert.deepEqual(bundle.capabilities_used, { "fs.write": ["out/x.txt"] });
});

test("an undeclared file write refutes the result", (t) => {
  const out = tempDir(t);
  const result = runWitness([join(FIXTURES, "write-undeclared.result.yaml"), "--out", out]);

  assert.equal(result.status, 1, result.stderr);
  const bundle = readBundle(out);
  assert.equal(bundle.verdict, "refuted");
  assert.ok(
    bundle.reasons.some((reason) =>
      reason.includes("undeclared capability fs.write: x.txt"),
    ),
    JSON.stringify(bundle.reasons),
  );
});

test("rdd witness dispatches the aleph kind", (t) => {
  const out = tempDir(t);
  const result = runRdd([
    "witness",
    join(FIXTURES, "write-declared.result.yaml"),
    "--out",
    out,
  ]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "");
  const bundle = readBundle(out);
  assert.equal(bundle.witness.kind, "aleph");
  assert.equal(bundle.verdict, "observed");
});

test("the aleph witness rejects a cli contract with exit 2", (t) => {
  const out = tempDir(t);
  const result = runWitness([
    join(ROOT, "results", "R-002.result.yaml"),
    "--out",
    out,
  ]);

  assert.equal(result.status, 2);
  assert.equal(result.stdout, "");
  const line = diagnostics(result.stderr).find((entry) => entry.level === "error");
  assert.equal(line.code, "usage");
  assert.match(line.message, /unsupported witness kind: cli/);
});
