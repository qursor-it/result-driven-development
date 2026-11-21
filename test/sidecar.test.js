import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { validateContractFile, validateSidecar } from "../src/validate.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const FIXTURES = join(ROOT, "test", "fixtures");

function run(args) {
  return spawnSync(process.execPath, ["bin/rdd.js", ...args], { cwd: ROOT, encoding: "utf8" });
}

function tempDir(t) {
  const dir = mkdtempSync(join(tmpdir(), "rdd-sidecar-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function writeYaml(root, relative, object) {
  const path = join(root, relative);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(object, null, 2)}\n`);
  return path;
}

function contract(id, kind, overrides = {}) {
  return {
    id,
    version: 1,
    owner: "Test",
    intent: "A test contract.",
    actor: "tester",
    given: "a temp fixture",
    outcome: [{ text: "the result exists", oracle: "GET /api/projects returns 1 item" }],
    thresholds: { runs: 1, success_rate: 1 },
    capabilities: {},
    witness: { kind },
    ...overrides,
  };
}

function sidecarFiles() {
  return readdirSync(join(ROOT, "results"), { recursive: true })
    .map((entry) => String(entry).split(sep).join("/"))
    .filter((entry) => entry.endsWith(".oracles.yaml"))
    .filter((entry) => !entry.startsWith("examples/fixtures/"))
    .sort();
}

test("results/ sidecars validate through rdd validate", () => {
  const files = sidecarFiles();
  assert.ok(files.length > 0);
  for (const file of files) {
    const result = run(["validate", join("results", file)]);
    assert.equal(result.status, 0, `${file}: ${result.stderr}`);
    assert.equal(result.stdout, "");
  }
});

test("CLI rejects an off-origin sidecar at the get path", () => {
  const result = run(["validate", "results/examples/fixtures/R-010/off-origin.oracles.yaml"]);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  const lines = result.stderr
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  assert.ok(
    lines.some((line) => line.code === "schema" && line.path === "/outcomes/0/get"),
    result.stderr,
  );
});

test("an unknown placeholder is reported at the string path", () => {
  const result = validateSidecar({
    result: "R-001",
    outcomes: [{ outcome: 0, get: "/api/projects?owner={user}" }],
  });
  assert.equal(result.ok, false);
  assert.ok(
    result.errors.some(
      (error) =>
        error.code === "placeholder" &&
        error.path === "/outcomes/0/get" &&
        error.message.includes("{user}"),
    ),
    JSON.stringify(result.errors),
  );
});

test("an unknown placeholder inside expect is reported", () => {
  const result = validateSidecar({
    result: "R-001",
    outcomes: [
      {
        outcome: 0,
        get: "/api/projects",
        expect: { every: { owner: "{user}" } },
      },
    ],
  });
  assert.equal(result.ok, false);
  assert.ok(
    result.errors.some(
      (error) =>
        error.code === "placeholder" && error.path === "/outcomes/0/expect/every/owner",
    ),
    JSON.stringify(result.errors),
  );
});

test("an unknown top-level key is a schema error", () => {
  const result = validateSidecar({ result: "R-001", unexpected: true });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.code === "schema"));
});

test("a none matcher with not is valid", () => {
  const result = validateSidecar({
    result: "R-014",
    anti_results: [
      {
        anti_result: 0,
        get: "/api/outbox",
        expect: { none: { to: { not: "{email}" } } },
      },
    ],
  });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
});

test("a browser contract with an oracle needs a sidecar", (t) => {
  const dir = tempDir(t);
  const path = writeYaml(dir, "R-950.result.yaml", contract("R-950", "browser"));
  const result = validateContractFile(path);
  assert.equal(result.ok, false);
  const error = result.errors.find((entry) => entry.code === "sidecar");
  assert.ok(error, JSON.stringify(result.errors));
  assert.equal(error.path, "/outcome");
  assert.match(error.message, /R-950\.oracles\.yaml/);
});

test("a sidecar result mismatch is reported", (t) => {
  const dir = tempDir(t);
  const path = writeYaml(dir, "R-951.result.yaml", contract("R-951", "browser"));
  writeYaml(dir, "oracles/R-951.oracles.yaml", {
    result: "R-999",
    outcomes: [{ outcome: 0, get: "/api/projects" }],
  });
  const result = validateContractFile(path);
  assert.equal(result.ok, false);
  const error = result.errors.find((entry) => entry.code === "sidecar" && entry.path === "/result");
  assert.ok(error, JSON.stringify(result.errors));
  assert.match(error.sidecar, /oracles[\\/]R-951\.oracles\.yaml$/);
});

test("an oracle outcome without a sidecar entry is reported", (t) => {
  const dir = tempDir(t);
  const path = writeYaml(
    dir,
    "R-952.result.yaml",
    contract("R-952", "browser", {
      outcome: [{ text: "with an oracle", oracle: "GET /api/projects" }, { text: "without" }],
    }),
  );
  writeYaml(dir, "oracles/R-952.oracles.yaml", {
    result: "R-952",
    outcomes: [{ outcome: 1, get: "/api/other" }],
  });
  const result = validateContractFile(path);
  assert.equal(result.ok, false);
  assert.ok(
    result.errors.some(
      (error) => error.code === "sidecar" && error.path === "/outcome/0/oracle",
    ),
    JSON.stringify(result.errors),
  );
});

test("out-of-range sidecar indices are reported at the sidecar entry", (t) => {
  const dir = tempDir(t);
  const path = writeYaml(dir, "R-953.result.yaml", contract("R-953", "browser"));
  writeYaml(dir, "oracles/R-953.oracles.yaml", {
    result: "R-953",
    outcomes: [
      { outcome: 0, get: "/api/projects" },
      { outcome: 3, get: "/api/other" },
    ],
    anti_results: [{ anti_result: 2, get: "/api/outbox" }],
  });
  const result = validateContractFile(path);
  assert.equal(result.ok, false);
  assert.ok(
    result.errors.some(
      (error) => error.code === "sidecar" && error.path === "/outcomes/1/outcome",
    ),
    JSON.stringify(result.errors),
  );
  assert.ok(
    result.errors.some(
      (error) => error.code === "sidecar" && error.path === "/anti_results/0/anti_result",
    ),
    JSON.stringify(result.errors),
  );
});

test("a hidden browser contract needs no sidecar", (t) => {
  const dir = tempDir(t);
  const path = writeYaml(
    dir,
    "R-954.result.yaml",
    contract("R-954", "browser", { hidden: true, outcome: [{ text: "done" }] }),
  );
  const result = validateContractFile(path);
  assert.equal(result.ok, true, JSON.stringify(result.errors));
});

test("cli and aleph contracts do not need a sidecar", (t) => {
  for (const [index, kind] of ["cli", "aleph"].entries()) {
    const dir = tempDir(t);
    const path = writeYaml(dir, `R-95${index + 5}.result.yaml`, contract(`R-95${index + 5}`, kind));
    const result = validateContractFile(path);
    assert.equal(result.ok, true, `${kind}: ${JSON.stringify(result.errors)}`);
  }
});

test("the browser witness fixture still validates with its sidecar", () => {
  const result = validateContractFile(join(FIXTURES, "witness-browser.result.yaml"));
  assert.equal(result.ok, true, JSON.stringify(result.errors));
});
