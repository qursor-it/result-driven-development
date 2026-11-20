import { test } from "node:test";
import assert from "node:assert/strict";
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
import {
  buildBundle,
  percentile,
  sha256,
  sha256File,
  summarize,
  writeBundle,
} from "../src/evidence.js";
import { compileSchema } from "../src/schemas.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const CONTRACT = join(ROOT, "spec", "result-contract.schema.json");
const validateEvidence = compileSchema("evidence");

function tempDir(t) {
  const dir = mkdtempSync(join(tmpdir(), "rdd-evidence-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function bundleInput(overrides = {}) {
  return {
    result: "R-001",
    contractPath: CONTRACT,
    buildSha256: "b".repeat(64),
    witness: { kind: "cli", version: "0.1.0" },
    verdict: "observed",
    runs: [],
    at: "2026-11-20T12:00:00.000Z",
    ...overrides,
  };
}

test("sha256 of a string", () => {
  assert.equal(
    sha256("abc"),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
});

test("sha256 of a buffer matches the string", () => {
  assert.equal(sha256(Buffer.from("abc", "utf8")), sha256("abc"));
});

test("sha256File hashes the file bytes", (t) => {
  const dir = tempDir(t);
  const file = join(dir, "abc.txt");
  writeFileSync(file, "abc");
  assert.equal(sha256File(file), sha256("abc"));
});

test("percentile uses nearest-rank on a sorted copy", () => {
  const values = [10, 1, 9, 2, 8, 3, 7, 4, 6, 5];
  const cases = [
    { values, p: 50, expected: 5 },
    { values, p: 95, expected: 10 },
    { values, p: 0, expected: 1 },
    { values, p: 100, expected: 10 },
    { values: [42], p: 50, expected: 42 },
    { values: [], p: 50, expected: undefined },
  ];

  for (const { values: input, p, expected } of cases) {
    assert.equal(percentile(input, p), expected, `p${p} of ${JSON.stringify(input)}`);
  }
});

test("percentile does not mutate its input", () => {
  const values = [3, 1, 2];
  percentile(values, 50);
  assert.deepEqual(values, [3, 1, 2]);
});

test("summarize mixed runs", () => {
  const runs = [
    { n: 1, status: "success", time_to_result_s: 1 },
    { n: 2, status: "success", time_to_result_s: 2 },
    { n: 3, status: "success", time_to_result_s: 3 },
    { n: 4, status: "failure" },
    { n: 5, status: "inconclusive" },
  ];

  assert.deepEqual(summarize(runs), {
    success_rate: 0.75,
    p50_time_to_result_s: 2,
    p95_time_to_result_s: 3,
    inconclusive_rate: 0.2,
  });
});

test("summarize only uses success times and rounds statistics", () => {
  const runs = [
    { n: 1, status: "success", time_to_result_s: 1.23456789 },
    { n: 2, status: "failure", time_to_result_s: 100 },
    { n: 3, status: "success", time_to_result_s: 2 },
  ];

  assert.deepEqual(summarize(runs), {
    success_rate: 0.666667,
    p50_time_to_result_s: 1.234568,
    p95_time_to_result_s: 2,
    inconclusive_rate: 0,
  });
});

test("summarize all inconclusive", () => {
  assert.deepEqual(summarize([{ n: 1, status: "inconclusive" }]), {
    inconclusive_rate: 1,
  });
});

test("summarize empty runs", () => {
  assert.deepEqual(summarize([]), {});
});

test("buildBundle builds the fixed shape", () => {
  const bundle = buildBundle(bundleInput());

  assert.deepEqual(Object.keys(bundle), [
    "result",
    "contract_sha256",
    "build",
    "witness",
    "verdict",
    "runs",
    "summary",
    "at",
  ]);
  assert.equal(bundle.contract_sha256, sha256File(CONTRACT));
  assert.equal(bundle.build.sha256, "b".repeat(64));
  assert.deepEqual(bundle.summary, {});
});

test("buildBundle includes optional keys when given", () => {
  const bundle = buildBundle(
    bundleInput({
      commit: "abc123",
      reasons: ["threshold met"],
      capabilitiesUsed: { net: ["localhost"] },
    }),
  );

  assert.equal(bundle.build.commit, "abc123");
  assert.deepEqual(bundle.reasons, ["threshold met"]);
  assert.deepEqual(bundle.capabilities_used, { net: ["localhost"] });
  assert.deepEqual(Object.keys(bundle), [
    "result",
    "contract_sha256",
    "build",
    "witness",
    "verdict",
    "reasons",
    "runs",
    "summary",
    "capabilities_used",
    "at",
  ]);
});

test("buildBundle hashes buildPath when buildSha256 is absent", (t) => {
  const dir = tempDir(t);
  const build = join(dir, "build.bin");
  writeFileSync(build, "build bytes");

  const bundle = buildBundle(bundleInput({ buildSha256: undefined, buildPath: build }));
  assert.equal(bundle.build.sha256, sha256("build bytes"));
});

test("buildBundle throws with neither buildPath nor buildSha256", () => {
  assert.throws(
    () => buildBundle(bundleInput({ buildSha256: undefined })),
    /exactly one of buildPath or buildSha256/,
  );
});

test("buildBundle throws with both buildPath and buildSha256", (t) => {
  const dir = tempDir(t);
  const build = join(dir, "build.bin");
  writeFileSync(build, "build bytes");

  assert.throws(
    () => buildBundle(bundleInput({ buildPath: build })),
    /exactly one of buildPath or buildSha256/,
  );
});

test("buildBundle defaults at to an ISO timestamp", () => {
  const bundle = buildBundle(bundleInput({ at: undefined }));
  assert.equal(bundle.at, new Date(bundle.at).toISOString());
});

test("writeBundle writes a schema-valid file and returns its sha256", (t) => {
  const dir = tempDir(t);
  const bundle = buildBundle(bundleInput());

  const written = writeBundle(bundle, join(dir, "evidence"));
  assert.equal(written.path, join(dir, "evidence", "bundle.json"));
  assert.equal(existsSync(written.path), true);

  const content = readFileSync(written.path, "utf8");
  assert.equal(content, `${JSON.stringify(bundle, null, 2)}\n`);
  assert.equal(written.sha256, sha256(content));

  const parsed = JSON.parse(content);
  assert.equal(validateEvidence(parsed), true, JSON.stringify(validateEvidence.errors));
});

test("writing twice with the same at is byte-identical", (t) => {
  const dir = tempDir(t);
  const first = writeBundle(buildBundle(bundleInput()), join(dir, "a"));
  const second = writeBundle(buildBundle(bundleInput()), join(dir, "b"));

  assert.equal(first.sha256, second.sha256);
  assert.equal(readFileSync(first.path, "utf8"), readFileSync(second.path, "utf8"));
});

test("writeBundle rejects an invalid bundle and writes nothing", (t) => {
  const dir = tempDir(t);
  const outDir = join(dir, "evidence");
  const bundle = buildBundle(bundleInput({ verdict: "maybe" }));

  assert.throws(() => writeBundle(bundle, outDir), /invalid evidence bundle/);
  assert.equal(existsSync(join(outDir, "bundle.json")), false);
});
