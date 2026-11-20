import { spawnSync } from "node:child_process";
import {
  accessSync,
  constants,
  cpSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join, relative, resolve, sep } from "node:path";
import { loadContract, prepareOracles } from "../../src/contract.js";
import { buildBundle, sha256, sha256File, writeBundle } from "../../src/evidence.js";
import { decide } from "../../src/verdict.js";
import { checkOracle } from "../cli/oracle.js";

const VERSION = JSON.parse(
  readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
).version;

const EXIT_CODES = { observed: 0, refuted: 1, inconclusive: 3 };

function write(fields) {
  process.stderr.write(`${JSON.stringify(fields)}\n`);
}

function usage(code, message) {
  const error = new Error(message);
  error.code = code;
  error.usage = true;
  return error;
}

function round6(value) {
  return Math.round(value * 1e6) / 1e6;
}

function buildFields(target) {
  try {
    if (statSync(target).isFile()) return { buildPath: target };
  } catch {
    // not a file: fall back to hashing the target string
  }
  return { buildSha256: sha256(target) };
}

function resolveToolchain(aleph) {
  const candidates = aleph.includes("/") || aleph.includes("\\")
    ? [aleph]
    : (process.env.PATH ?? "")
        .split(delimiter)
        .filter(Boolean)
        .map((entry) => join(entry, aleph));

  for (const candidate of candidates) {
    try {
      if (!statSync(candidate).isFile()) continue;
      accessSync(candidate, constants.X_OK);
      return candidate;
    } catch {
      // keep looking
    }
  }
  return null;
}

function witnessVersion(aleph) {
  const resolved = resolveToolchain(aleph);
  if (!resolved) return `${VERSION}+aleph.unknown`;
  try {
    return `${VERSION}+aleph.${sha256File(resolved).slice(0, 12)}`;
  } catch {
    return `${VERSION}+aleph.unknown`;
  }
}

function excerpt(result) {
  return `${result.stderr ?? ""}${result.stdout ?? ""}`.slice(0, 500);
}

function walk(root, base, files) {
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const full = join(root, entry.name);
    if (entry.isDirectory()) {
      walk(full, base, files);
    } else if (entry.isFile()) {
      files.set(relative(base, full).split(sep).join("/"), sha256File(full));
    }
  }
  return files;
}

function snapshot(root) {
  if (!existsSync(root)) return new Map();
  return walk(root, root, new Map());
}

function writtenSince(before, after) {
  return [...after.entries()]
    .filter(([path, hash]) => before.get(path) !== hash)
    .map(([path]) => path)
    .sort();
}

function fixturesFor(contractPath, id) {
  const dir = join(dirname(contractPath), "fixtures", id);
  return existsSync(dir) ? dir : null;
}

function freshFixtureDir(fixtures) {
  const dir = mkdtempSync(join(tmpdir(), "rdd-aleph-run-"));
  if (fixtures) cpSync(fixtures, dir, { recursive: true });
  return dir;
}

function runEngine({ command, commandArgs, cwd, stdin, timeout, parsedOracles, label }) {
  const before = snapshot(cwd);
  const started = process.hrtime.bigint();
  const result = spawnSync(command, commandArgs, {
    input: stdin,
    timeout,
    cwd,
    encoding: "utf8",
  });
  const time = round6(Number(process.hrtime.bigint() - started) / 1e9);
  const written = writtenSince(before, snapshot(cwd));

  const spawnError = Boolean(result.error) && result.error.code !== "ETIMEDOUT";
  const timedOut =
    result.error?.code === "ETIMEDOUT" ||
    (result.signal !== undefined && result.signal !== null);

  const observed = {
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    exitCode: result.status,
    readFile: (path) => {
      try {
        return readFileSync(join(cwd, path), "utf8");
      } catch {
        return null;
      }
    },
  };

  const oracles = parsedOracles.map(({ text, parsed }) => {
    const check = checkOracle(parsed, observed);
    return { oracle: `${label}: ${text}`, ok: check.ok, found: check.found };
  });

  return { time, spawnError, timedOut, oracles, written };
}

function capabilityResults(contract, written) {
  const declared = contract.capabilities?.["fs.write"] ?? [];
  const undeclared = written.filter(
    (path) => !declared.some((prefix) => path === prefix || path.startsWith(`${prefix}/`)),
  );
  return {
    capabilitiesUsed: written.length > 0 ? { "fs.write": written } : undefined,
    antiResults: undeclared.map((path) => `undeclared capability fs.write: ${path}`),
  };
}

function finish({
  contract,
  contractPath,
  fields,
  version,
  verdict,
  reasons,
  runs,
  capabilitiesUsed,
  outDir,
}) {
  const bundle = buildBundle({
    result: contract.id,
    contractPath,
    ...fields,
    witness: { kind: "aleph", version },
    verdict,
    reasons,
    runs,
    capabilitiesUsed,
  });
  const written = writeBundle(bundle, outDir);
  write({
    level: "info",
    code: "verdict",
    verdict,
    bundle: written.path,
    sha256: written.sha256,
  });

  return {
    verdict,
    exitCode: EXIT_CODES[verdict],
    bundlePath: written.path,
    bundleSha256: written.sha256,
  };
}

export function witnessAleph({
  contractPath,
  target,
  outDir,
  aleph = process.env.ALEPH || "aleph",
}) {
  if (!outDir) throw usage("usage", "--out is required");

  const contract = loadContract(contractPath);
  if (contract.witness.kind !== "aleph") {
    throw usage("usage", `unsupported witness kind: ${contract.witness.kind}`);
  }

  const resolvedTarget = target ?? contract.witness.target;
  if (!resolvedTarget) {
    throw usage("usage", "missing target: pass --target or witness.target");
  }

  const version = witnessVersion(aleph);
  const absoluteTarget = resolve(resolvedTarget);
  const fixtures = fixturesFor(contractPath, contract.id);

  const check = spawnSync(aleph, ["check", absoluteTarget], { encoding: "utf8" });
  if (check.error && (check.error.code === "ENOENT" || check.error.code === "EACCES")) {
    return finish({
      contract,
      contractPath,
      fields: buildFields(resolvedTarget),
      version,
      verdict: "inconclusive",
      reasons: [`aleph toolchain not found: ${aleph}`],
      runs: [],
      outDir,
    });
  }
  if (check.error || check.status !== 0) {
    return finish({
      contract,
      contractPath,
      fields: buildFields(resolvedTarget),
      version,
      verdict: "refuted",
      reasons: [`aleph check failed: ${excerpt(check)}`],
      runs: [],
      outDir,
    });
  }

  const buildDir = mkdtempSync(join(tmpdir(), "rdd-aleph-build-"));
  try {
    if (fixtures) cpSync(fixtures, buildDir, { recursive: true });
    const program = join(buildDir, "prog");
    const build = spawnSync(aleph, ["build", absoluteTarget, "-o", program], {
      cwd: buildDir,
      encoding: "utf8",
    });

    if (build.error && (build.error.code === "ENOENT" || build.error.code === "EACCES")) {
      return finish({
        contract,
        contractPath,
        fields: buildFields(resolvedTarget),
        version,
        verdict: "inconclusive",
        reasons: [`aleph toolchain not found: ${aleph}`],
        runs: [],
        outDir,
      });
    }
    if (build.error || build.status !== 0) {
      return finish({
        contract,
        contractPath,
        fields: buildFields(resolvedTarget),
        version,
        verdict: "refuted",
        reasons: [`aleph build failed: ${excerpt(build)}`],
        runs: [],
        outDir,
      });
    }

    const args = contract.witness.args ?? [];
    const stdin = contract.witness.stdin ?? "";
    const timeout = (contract.witness.timeout_s ?? 60) * 1000;
    const { parsedOracles, unobservable, missingHidden } = prepareOracles(contract);

    const runs = [];
    const allWritten = new Set();

    for (let index = 0; index < contract.thresholds.runs; index++) {
      const n = index + 1;
      const interpDir = freshFixtureDir(fixtures);
      const nativeDir = freshFixtureDir(fixtures);

      let interp;
      let native;
      try {
        interp = runEngine({
          command: aleph,
          commandArgs: ["run", absoluteTarget, ...args],
          cwd: interpDir,
          stdin,
          timeout,
          parsedOracles,
          label: "interp",
        });
        native = runEngine({
          command: program,
          commandArgs: args,
          cwd: nativeDir,
          stdin,
          timeout,
          parsedOracles,
          label: "native",
        });
      } finally {
        rmSync(interpDir, { recursive: true, force: true });
        rmSync(nativeDir, { recursive: true, force: true });
      }

      for (const path of [...interp.written, ...native.written]) allWritten.add(path);

      let status;
      if (interp.spawnError || native.spawnError || unobservable) {
        status = "inconclusive";
      } else if (interp.timedOut || native.timedOut) {
        status = "failure";
      } else if ([...interp.oracles, ...native.oracles].every((oracle) => oracle.ok)) {
        status = "success";
      } else {
        status = "failure";
      }

      const run = {
        n,
        status,
        time_to_result_s: native.time,
        interp_time_s: interp.time,
        oracles: [...interp.oracles, ...native.oracles],
      };
      runs.push(run);
      write({ level: "info", code: "run", n: run.n, status: run.status });
    }

    const written = [...allWritten].sort();
    const { capabilitiesUsed, antiResults } = capabilityResults(contract, written);
    const decision = decide({
      thresholds: contract.thresholds,
      runs,
      antiResults,
    });
    const { reasons } = decision;
    let { verdict } = decision;
    if (missingHidden) {
      reasons.push(`hidden oracles not found: ${missingHidden}`);
      if (verdict === "observed") verdict = "inconclusive";
    }

    return finish({
      contract,
      contractPath,
      fields: buildFields(resolvedTarget),
      version,
      verdict,
      reasons,
      runs,
      capabilitiesUsed,
      outDir,
    });
  } finally {
    rmSync(buildDir, { recursive: true, force: true });
  }
}

export const witness = witnessAleph;
