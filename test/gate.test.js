import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  capabilityDiff,
  gateDecision,
  listContracts,
  touchReasons,
  undeclaredUses,
} from "../src/gate.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

function tempDir(t) {
  const dir = mkdtempSync(join(tmpdir(), "rdd-gate-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function contract(overrides = {}) {
  return {
    id: "R-001",
    capabilities: { "fs.read": ["src"] },
    witness: { kind: "cli", target: "bin/rdd.js" },
    ...overrides,
  };
}

function diagnostics(stderr) {
  return stderr
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function run(args) {
  return spawnSync(process.execPath, ["bin/rdd.js", ...args], {
    cwd: ROOT,
    encoding: "utf8",
  });
}

test("touchReasons reports the contract file", () => {
  assert.deepEqual(
    touchReasons("results/R-001.result.yaml", contract(), ["results/R-001.result.yaml"]),
    ["contract"],
  );
});

test("touchReasons reports the oracle sidecar", () => {
  const path = "results/examples/R-014.result.yaml";
  assert.deepEqual(
    touchReasons(path, contract({ id: "R-014" }), [
      "results/examples/oracles/R-014.oracles.yaml",
    ]),
    ["sidecar"],
  );
});

test("touchReasons reports hidden oracles", () => {
  assert.deepEqual(
    touchReasons("results/aleph/R-101.result.yaml", contract({ id: "R-101" }), [
      "witnesses/hidden/R-101.oracles.yaml",
    ]),
    ["hidden"],
  );
});

test("touchReasons reports the fixtures directory", () => {
  assert.deepEqual(
    touchReasons("results/aleph/R-107.result.yaml", contract({ id: "R-107" }), [
      "results/aleph/fixtures/R-107/data/in.txt",
    ]),
    ["fixtures"],
  );
});

test("touchReasons reports a repository-relative witness target", () => {
  assert.deepEqual(
    touchReasons("results/R-001.result.yaml", contract(), ["bin/rdd.js"]),
    ["target"],
  );
});

test("touchReasons ignores a URL witness target", () => {
  const url = "https://example.com/app.js";
  assert.deepEqual(
    touchReasons(
      "results/R-001.result.yaml",
      contract({ witness: { kind: "browser", target: url } }),
      [url],
    ),
    [],
  );
});

test("touchReasons reports the witness implementation directory", () => {
  assert.deepEqual(
    touchReasons("results/R-001.result.yaml", contract(), ["witnesses/cli/witness.js"]),
    ["witness:cli"],
  );
});

test("touchReasons matches fs.read by path segments only", () => {
  const path = "results/R-001.result.yaml";

  assert.deepEqual(touchReasons(path, contract(), ["src/a.js"]), ["fs.read:src"]);
  assert.deepEqual(touchReasons(path, contract(), ["src"]), ["fs.read:src"]);
  assert.deepEqual(touchReasons(path, contract(), ["srcx/a.js"]), []);
});

test("capabilityDiff treats a new contract as everything added", () => {
  assert.deepEqual(
    capabilityDiff(null, { "fs.read": ["src"], "net.host": ["api.example.com"] }),
    {
      "fs.read": { added: ["src"], removed: [] },
      "net.host": { added: ["api.example.com"], removed: [] },
    },
  );
});

test("capabilityDiff reports added and removed values per key", () => {
  const base = { "fs.read": ["src", "lib"], "net.host": ["api.example.com"] };
  const head = { "fs.read": ["src", "app"], "net.host": ["api.example.com", "cdn.example.com"] };

  assert.deepEqual(capabilityDiff(base, head), {
    "fs.read": { added: ["app"], removed: ["lib"] },
    "net.host": { added: ["cdn.example.com"], removed: [] },
  });
});

test("capabilityDiff returns {} for unchanged capabilities", () => {
  const caps = { "fs.read": ["src"], "net.host": ["api.example.com"] };
  assert.deepEqual(capabilityDiff(caps, { ...caps }), {});
});

test("undeclaredUses allows equal or nested fs paths", () => {
  const result = undeclaredUses(contract(), {
    capabilities_used: { "fs.read": ["src/a.js", "srcx/a.js", "lib/b.js"] },
  });

  assert.deepEqual(result, [
    { key: "fs.read", value: "srcx/a.js" },
    { key: "fs.read", value: "lib/b.js" },
  ]);
});

test("undeclaredUses requires exact matches for other capability keys", () => {
  const result = undeclaredUses(contract({ capabilities: { "net.host": ["api.example.com"] } }), {
    capabilities_used: {
      "net.host": ["api.example.com", "evil.example.com"],
    },
  });

  assert.deepEqual(result, [{ key: "net.host", value: "evil.example.com" }]);
});

test("undeclaredUses reports every use when nothing is declared", () => {
  const result = undeclaredUses(contract({ capabilities: {} }), {
    capabilities_used: { "fs.write": ["out/x"] },
  });

  assert.deepEqual(result, [{ key: "fs.write", value: "out/x" }]);
});

test("undeclaredUses is empty when the bundle uses nothing", () => {
  assert.deepEqual(undeclaredUses(contract(), {}), []);
});

test("gateDecision follows the ADR priority table", () => {
  assert.equal(gateDecision([]), "pass");
  assert.equal(gateDecision([{ verdict: "observed", capability_diff: {}, undeclared_uses: [] }]), "pass");
  assert.equal(
    gateDecision([{ verdict: "inconclusive", capability_diff: {}, undeclared_uses: [] }]),
    "owner",
  );
  assert.equal(
    gateDecision([
      { verdict: "observed", capability_diff: { "fs.read": { added: ["src"], removed: [] } } },
    ]),
    "owner",
  );
  assert.equal(
    gateDecision([{ verdict: "refuted", capability_diff: {}, undeclared_uses: [] }]),
    "block",
  );
  assert.equal(gateDecision([{ error: "invalid" }]), "block");
  assert.equal(
    gateDecision([
      { verdict: "observed", capability_diff: {}, undeclared_uses: [{ key: "fs.read", value: "x" }] },
    ]),
    "block",
  );
  assert.equal(
    gateDecision([
      { verdict: "inconclusive", capability_diff: {}, undeclared_uses: [] },
      { verdict: "refuted", capability_diff: {}, undeclared_uses: [] },
    ]),
    "block",
  );
});

test("listContracts returns sorted result contracts and skips fixtures", () => {
  const contracts = listContracts(ROOT);

  assert.deepEqual(contracts, [...contracts].sort());
  assert.ok(contracts.includes("results/R-002.result.yaml"));
  assert.ok(contracts.includes("results/examples/R-001.result.yaml"));
  assert.equal(contracts.includes("results/examples/fixtures/R-013/broken.result.yaml"), false);
  assert.equal(contracts.some((path) => path.split("/").includes("fixtures")), false);
});

test("gate blocks a forced refuted contract with empty stdout", (t) => {
  const out = tempDir(t);
  const result = run([
    "gate",
    "--base",
    "HEAD",
    "--contract",
    "results/examples/fixtures/R-013/broken.result.yaml",
    "--out",
    out,
  ]);

  assert.equal(result.status, 1, result.stderr);
  assert.equal(result.stdout, "");

  const lines = diagnostics(result.stderr);
  assert.match(result.stderr, /"decision":"block"/);
  assert.match(result.stderr, /R-913/);

  const gateLine = lines.find((line) => line.code === "gate");
  assert.equal(gateLine.decision, "block");
  assert.equal(gateLine.report, join(out, "gate.json"));

  const contractLine = lines.find((line) => line.code === "gate-contract");
  assert.equal(contractLine.result, "R-913");
  assert.equal(contractLine.verdict, "refuted");
  assert.deepEqual(contractLine.reasons, ["forced"]);

  const report = JSON.parse(readFileSync(join(out, "gate.json"), "utf8"));
  assert.deepEqual(Object.keys(report), ["base", "head", "changed", "contracts", "decision"]);
  assert.equal(report.base, "HEAD");
  assert.deepEqual(report.changed, []);
  assert.equal(report.decision, "block");
  assert.equal(report.contracts.length, 1);
  assert.equal(report.contracts[0].id, "R-913");
  assert.deepEqual(report.contracts[0].reasons, ["forced"]);
});

test("gate passes a forced observed contract with empty stdout", (t) => {
  const out = tempDir(t);
  const ledgerPath = join(out, "results.jsonl");
  const result = run([
    "gate",
    "--base",
    "HEAD",
    "--contract",
    "results/R-002.result.yaml",
    "--out",
    out,
    "--ledger",
    ledgerPath,
  ]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /"decision":"pass"/);

  const report = JSON.parse(readFileSync(join(out, "gate.json"), "utf8"));
  assert.equal(report.decision, "pass");
  assert.equal(report.contracts[0].id, "R-002");
  assert.equal(report.contracts[0].verdict, "observed");
  assert.deepEqual(report.contracts[0].capability_diff, {});
  assert.deepEqual(report.contracts[0].undeclared_uses, []);

  const ledger = readFileSync(ledgerPath, "utf8").trim().split("\n").map((line) => JSON.parse(line));
  assert.equal(ledger.length, 1);
  assert.equal(ledger[0].result, "R-002");
  assert.equal(ledger[0].verdict, "observed");
});

test("gate --text prints the human report on stdout", (t) => {
  const out = tempDir(t);
  const result = run([
    "gate",
    "--base",
    "HEAD",
    "--contract",
    "results/examples/fixtures/R-013/broken.result.yaml",
    "--out",
    out,
    "--text",
  ]);

  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout, /^decision: block$/m);
  assert.match(result.stdout, /R-913/);
  assert.match(result.stderr, /"decision":"block"/);
});

test("gate without --base exits 2", (t) => {
  const out = tempDir(t);
  const result = run(["gate", "--out", out]);

  assert.equal(result.status, 2);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /"code":"usage"/);
});
