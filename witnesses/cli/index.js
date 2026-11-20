import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { parse } from "yaml";
import { buildBundle, sha256, writeBundle } from "../../src/evidence.js";
import { validateContractFile } from "../../src/validate.js";
import { decide } from "../../src/verdict.js";
import { checkOracle, parseOracle } from "./oracle.js";

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

function loadContract(contractPath) {
  const validation = validateContractFile(contractPath);
  if (!validation.ok) {
    const error = usage("contract", `invalid contract: ${contractPath}`);
    error.errors = validation.errors;
    throw error;
  }
  return parse(readFileSync(contractPath, "utf8"));
}

function buildFields(target) {
  try {
    if (statSync(target).isFile()) return { buildPath: target };
  } catch {
    // not a file: fall back to hashing the target string
  }
  return { buildSha256: sha256(target) };
}

function runOnce({ n, target, args, stdin, timeout, parsedOracles, unobservable }) {
  const script = target.endsWith(".js");
  const command = script ? process.execPath : target;
  const commandArgs = script ? [target, ...args] : args;
  const started = process.hrtime.bigint();

  let result;
  if (script && !existsSync(target)) {
    result = {
      error: { code: "ENOENT", message: `no such file: ${target}` },
      status: null,
      signal: null,
      stdout: "",
      stderr: "",
    };
  } else {
    result = spawnSync(command, commandArgs, {
      input: stdin,
      timeout,
      cwd: process.cwd(),
      encoding: "utf8",
    });
  }

  const time = round6(Number(process.hrtime.bigint() - started) / 1e9);
  const spawnError = Boolean(result.error) && result.error.code !== "ETIMEDOUT";
  const timedOut =
    result.error?.code === "ETIMEDOUT" ||
    (result.signal !== undefined && result.signal !== null);

  const observed = {
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    exitCode: result.status,
  };

  const oracles = parsedOracles.map(({ text, parsed }) => {
    const check = checkOracle(parsed, observed);
    return { oracle: text, ok: check.ok, found: check.found };
  });

  let status;
  if (spawnError) {
    status = "inconclusive";
  } else if (unobservable) {
    status = "inconclusive";
  } else if (timedOut) {
    status = "failure";
  } else if (oracles.every((oracle) => oracle.ok)) {
    status = "success";
  } else {
    status = "failure";
  }

  return { n, status, time_to_result_s: time, oracles };
}

export function witnessCli({ contractPath, target, outDir }) {
  if (!outDir) throw usage("usage", "--out is required");

  const contract = loadContract(contractPath);
  if (contract.witness.kind !== "cli") {
    throw usage("usage", `unsupported witness kind: ${contract.witness.kind}`);
  }

  const resolvedTarget = target ?? contract.witness.target;
  if (!resolvedTarget) {
    throw usage("usage", "missing target: pass --target or witness.target");
  }

  const args = contract.witness.args ?? [];
  const stdin = contract.witness.stdin ?? "";
  const timeout = (contract.witness.timeout_s ?? 60) * 1000;

  const outcomes = contract.outcome ?? [];
  const oracleTexts = outcomes
    .filter((outcome) => outcome.oracle !== undefined && outcome.oracle !== null)
    .map((outcome) => outcome.oracle);
  const missingOracle = outcomes.some(
    (outcome) => outcome.oracle === undefined || outcome.oracle === null,
  );
  const parsedOracles = oracleTexts.map((text) => ({ text, parsed: parseOracle(text) }));
  const unsupported = parsedOracles.some(({ parsed }) => !parsed.supported);
  const unobservable = missingOracle || parsedOracles.length === 0 || unsupported;

  const runs = [];
  for (let index = 0; index < contract.thresholds.runs; index++) {
    const run = runOnce({
      n: index + 1,
      target: resolvedTarget,
      args,
      stdin,
      timeout,
      parsedOracles,
      unobservable,
    });
    runs.push(run);
    write({ level: "info", code: "run", n: run.n, status: run.status });
  }

  // shortcut: the cli Witness does not detect anti-results or capability use yet, upgrade when a sandbox is available.
  const { verdict, reasons } = decide({
    thresholds: contract.thresholds,
    runs,
    antiResults: [],
  });

  const bundle = buildBundle({
    result: contract.id,
    contractPath,
    ...buildFields(resolvedTarget),
    witness: { kind: "cli", version: VERSION },
    verdict,
    reasons,
    runs,
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
