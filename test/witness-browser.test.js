import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { witnessBrowser } from "../witnesses/browser/index.js";
import { sha256File } from "../src/evidence.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const RDD = join(ROOT, "bin", "rdd.js");
const CONTRACT = join(ROOT, "test", "fixtures", "witness-browser.result.yaml");
const BROWSER_CONTRACT = join(ROOT, "results", "examples", "R-014.result.yaml");

function tempDir(t) {
  const dir = mkdtempSync(join(tmpdir(), "rdd-witness-browser-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed: ${result.stderr}`);
  }
  return result;
}

function fakeCliSource({
  exitCode = 0,
  verdict = "observed",
  result = "R-940",
  kind = "browser",
  contractSha = null,
} = {}) {
  return `#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const contractPath = args[0];
const outDir = args[args.indexOf("--out") + 1];
const actualSha = createHash("sha256").update(readFileSync(contractPath)).digest("hex");
const bundle = {
  result: ${JSON.stringify(result)},
  contract_sha256: ${contractSha === null ? "actualSha" : JSON.stringify(contractSha)},
  build: { sha256: "0".repeat(64) },
  witness: { kind: ${JSON.stringify(kind)}, version: "fake" },
  verdict: ${JSON.stringify(verdict)},
  runs: [],
  summary: {},
  at: "2026-01-01T00:00:00.000Z",
};
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "bundle.json"), JSON.stringify(bundle, null, 2) + "\\n");
process.exit(${exitCode});
`;
}

const CLI = "autonomous-qa/witness/bin/rdd-witness-browser.mjs";

function createCheckout(t, options = {}) {
  const dir = tempDir(t);
  run("git", ["init", "-q", dir]);
  mkdirSync(join(dir, "autonomous-qa", "witness", "bin"), { recursive: true });
  writeFileSync(join(dir, CLI), fakeCliSource(options));
  run("git", ["-C", dir, "add", CLI]);
  run("git", [
    "-C",
    dir,
    "-c",
    "user.name=RDD Test",
    "-c",
    "user.email=rdd@example.test",
    "commit",
    "-q",
    "-m",
    "fake browser witness",
  ]);
  const commit = run("git", ["-C", dir, "rev-parse", "HEAD"]).stdout.trim();
  return { dir, pin: { repo: "qursor-it/qursor-qa-tester", commit, cli: CLI } };
}

function assertCode(fn, code) {
  assert.throws(fn, (error) => {
    assert.equal(error.code, code, error.message);
    return true;
  });
}

function diagnostics(stderr) {
  return stderr
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

test("witnessBrowser observes a result through the pinned CLI", (t) => {
  const { dir, pin } = createCheckout(t);
  const out = tempDir(t);

  const result = witnessBrowser({ contractPath: CONTRACT, outDir: out, witnessDir: dir, pin });

  assert.equal(result.verdict, "observed");
  assert.equal(result.exitCode, 0);
  assert.equal(result.bundle.result, "R-940");
  assert.equal(result.bundle.verdict, "observed");
  assert.equal(result.path, join(out, "bundle.json"));
  assert.equal(result.sha256, sha256File(result.path));
  assert.equal(JSON.parse(readFileSync(result.path, "utf8")).result, "R-940");
});

test("witnessBrowser returns a refuted verdict on exit 1", (t) => {
  const { dir, pin } = createCheckout(t, { exitCode: 1, verdict: "refuted" });
  const out = tempDir(t);

  const result = witnessBrowser({ contractPath: CONTRACT, outDir: out, witnessDir: dir, pin });

  assert.equal(result.verdict, "refuted");
  assert.equal(result.exitCode, 1);
});

test("witnessBrowser returns an inconclusive verdict on exit 3", (t) => {
  const { dir, pin } = createCheckout(t, { exitCode: 3, verdict: "inconclusive" });
  const out = tempDir(t);

  const result = witnessBrowser({ contractPath: CONTRACT, outDir: out, witnessDir: dir, pin });

  assert.equal(result.verdict, "inconclusive");
  assert.equal(result.exitCode, 3);
});

test("a checkout at another commit fails the pin check", (t) => {
  const { dir, pin } = createCheckout(t);
  const out = tempDir(t);

  assertCode(
    () =>
      witnessBrowser({
        contractPath: CONTRACT,
        outDir: out,
        witnessDir: dir,
        pin: { ...pin, commit: "0".repeat(40) },
      }),
    "pin",
  );
});

test("a dirty witness tree fails the pin check", (t) => {
  const { dir, pin } = createCheckout(t);
  const out = tempDir(t);
  writeFileSync(join(dir, "autonomous-qa", "witness", "dirty.txt"), "dirty\n");

  assertCode(
    () => witnessBrowser({ contractPath: CONTRACT, outDir: out, witnessDir: dir, pin }),
    "pin",
  );
});

test("a bundle with the wrong contract hash fails the bundle check", (t) => {
  const { dir, pin } = createCheckout(t, { contractSha: "1".repeat(64) });
  const out = tempDir(t);

  assertCode(
    () => witnessBrowser({ contractPath: CONTRACT, outDir: out, witnessDir: dir, pin }),
    "bundle",
  );
});

test("a bundle verdict that disagrees with the exit code fails the bundle check", (t) => {
  const { dir, pin } = createCheckout(t, { exitCode: 1, verdict: "observed" });
  const out = tempDir(t);

  assertCode(
    () => witnessBrowser({ contractPath: CONTRACT, outDir: out, witnessDir: dir, pin }),
    "bundle",
  );
});

test("a child exiting 2 fails the witness run", (t) => {
  const { dir, pin } = createCheckout(t, { exitCode: 2 });
  const out = tempDir(t);

  assertCode(
    () => witnessBrowser({ contractPath: CONTRACT, outDir: out, witnessDir: dir, pin }),
    "witness",
  );
});

test("missing --out is a usage error", () => {
  assertCode(() => witnessBrowser({ contractPath: CONTRACT }), "usage");
});

test("rdd witness exits 2 with code pin for an unpinned browser checkout", (t) => {
  const { dir } = createCheckout(t);
  const out = tempDir(t);

  const result = spawnSync(
    process.execPath,
    [RDD, "witness", BROWSER_CONTRACT, "--out", out],
    {
      cwd: ROOT,
      encoding: "utf8",
      env: { ...process.env, RDD_BROWSER_WITNESS_DIR: dir },
    },
  );

  assert.equal(result.status, 2, result.stderr);
  assert.equal(result.stdout, "");
  const line = diagnostics(result.stderr).find((entry) => entry.level === "error");
  assert.equal(line.code, "pin");
});
