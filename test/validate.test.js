import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { validateContract, validateContractFile } from "../src/validate.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const FIXTURES = join(ROOT, "test", "fixtures");

const validContract = {
  id: "R-001",
  version: 1,
  intent: "The user can list projects.",
  actor: "developer",
  given: "an empty database",
  outcome: [{ text: "one project is returned", oracle: "GET /api/projects returns 1 item" }],
  thresholds: { runs: 20 },
  capabilities: {},
  witness: { kind: "cli" },
};

function resultFiles() {
  return readdirSync(join(ROOT, "results"), { recursive: true })
    .map((entry) => String(entry))
    .filter((entry) => entry.endsWith(".result.yaml"))
    .sort();
}

function run(args) {
  return spawnSync(process.execPath, ["bin/rdd.js", ...args], { cwd: ROOT, encoding: "utf8" });
}

const files = resultFiles();

test("results/ contains contracts, including examples", () => {
  assert.ok(files.length > 0);
  assert.ok(files.some((file) => file.startsWith("examples")));
});

for (const file of files) {
  test(`results/${file} validates`, () => {
    const result = validateContractFile(join(ROOT, "results", file));
    assert.equal(result.ok, true, JSON.stringify(result.errors));
  });
}

test("invalid YAML fails with code yaml", () => {
  const result = validateContractFile(join(FIXTURES, "invalid-yaml.yaml"));
  assert.equal(result.ok, false);
  assert.equal(result.errors[0].code, "yaml");
});

test("a contract with an unknown top-level key fails", () => {
  const result = validateContractFile(join(FIXTURES, "unknown-key.yaml"));
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.code === "schema"));
});

test("validateContract reports schema errors as paths", () => {
  const result = validateContract({ ...validContract, unexpected: true });
  assert.equal(result.ok, false);
  assert.ok(result.errors.every((error) => typeof error.path === "string"));
});

test("missing file fails with code io", () => {
  const result = validateContractFile(join(FIXTURES, "does-not-exist.yaml"));
  assert.equal(result.ok, false);
  assert.equal(result.errors[0].code, "io");
});

test("CLI accepts a valid contract with exit 0 and empty stdout", () => {
  const result = run(["validate", "results/examples/R-001.result.yaml"]);
  assert.equal(result.status, 0);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /"code":"valid"/);
});

test("CLI rejects an invalid contract with exit 1 and empty stdout", () => {
  const args = ["validate", "test/fixtures/unknown-key.yaml"];
  const result = run(args);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /"code":"schema"/);
  assert.equal(result.stderr, run(args).stderr);
});

test("CLI with no arguments exits 2 with a usage diagnostic", () => {
  const result = run([]);
  assert.equal(result.status, 2);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /"code":"usage"/);
});

test("CLI validate without files exits 2 with a usage diagnostic", () => {
  const result = run(["validate"]);
  assert.equal(result.status, 2);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /"code":"usage"/);
});
