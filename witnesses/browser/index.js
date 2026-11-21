import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { loadContract } from "../../src/contract.js";
import { sha256File } from "../../src/evidence.js";
import { compileSchema } from "../../src/schemas.js";

const validateEvidence = compileSchema("evidence");

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

function loadPin() {
  return JSON.parse(readFileSync(new URL("./PIN.json", import.meta.url), "utf8"));
}

function git(witnessDir, args) {
  return spawnSync("git", ["-C", witnessDir, ...args], { encoding: "utf8" });
}

function checkPin(witnessDir, pin) {
  const head = git(witnessDir, ["rev-parse", "HEAD"]);
  if (head.error || head.status !== 0) {
    throw usage("pin", `cannot read witness checkout HEAD: ${head.error?.message ?? head.stderr.trim()}`);
  }
  const commit = head.stdout.trim();
  if (commit !== pin.commit) {
    throw usage("pin", `witness checkout is not pinned: expected ${pin.commit}, found ${commit}`);
  }

  const status = git(witnessDir, [
    "status",
    "--porcelain",
    "--",
    "autonomous-qa/witness",
    "autonomous-qa/vendor",
  ]);
  if (status.error || status.status !== 0) {
    throw usage("pin", `cannot read witness checkout status: ${status.error?.message ?? status.stderr.trim()}`);
  }
  if (status.stdout.trim() !== "") {
    throw usage("pin", `witness checkout is dirty: ${status.stdout.trim().split("\n")[0]}`);
  }

  const cli = join(witnessDir, pin.cli);
  if (!existsSync(cli)) {
    throw usage("pin", `witness CLI not found: ${cli}`);
  }
  return cli;
}

function runChild({ cli, contractPath, outDir, target, witnessDir, timeout }) {
  const args = [cli, contractPath, "--out", outDir];
  if (target !== undefined && target !== null) args.push("--target", target);

  const result = spawnSync(process.execPath, args, {
    cwd: join(witnessDir, "autonomous-qa"),
    stdio: ["ignore", "ignore", "inherit"],
    timeout,
  });

  if (result.error || result.signal || ![0, 1, 3].includes(result.status)) {
    const error = new Error(
      `browser witness failed: status=${result.status} signal=${result.signal}${result.error ? ` error=${result.error.message}` : ""}`,
    );
    error.code = "witness";
    error.status = result.status;
    error.signal = result.signal;
    throw error;
  }
  return result.status;
}

function readBundle(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw usage("bundle", `cannot read bundle: ${path}: ${error.message}`);
  }
}

function checkBundle({ bundle, bundlePath, contract, contractPath, status }) {
  if (!validateEvidence(bundle)) {
    throw usage("bundle", `invalid evidence bundle: ${JSON.stringify(validateEvidence.errors)}`);
  }
  if (bundle.result !== contract.id) {
    throw usage("bundle", `bundle result mismatch: expected ${contract.id}, got ${bundle.result}`);
  }
  const contractSha = sha256File(contractPath);
  if (bundle.contract_sha256 !== contractSha) {
    throw usage(
      "bundle",
      `bundle contract_sha256 mismatch: expected ${contractSha}, got ${bundle.contract_sha256}`,
    );
  }
  if (bundle.witness.kind !== "browser") {
    throw usage("bundle", `bundle witness kind mismatch: expected browser, got ${bundle.witness.kind}`);
  }
  if (EXIT_CODES[bundle.verdict] !== status) {
    throw usage(
      "bundle",
      `bundle verdict ${bundle.verdict} does not match exit code ${status}`,
    );
  }
  return { path: bundlePath, sha256: sha256File(bundlePath) };
}

export function witnessBrowser({
  contractPath,
  target,
  outDir,
  witnessDir = process.env.RDD_BROWSER_WITNESS_DIR || join(homedir(), "projects", "qursor-witness"),
  pin = loadPin(),
}) {
  if (!outDir) throw usage("usage", "--out is required");

  const contract = loadContract(contractPath);
  if (contract.witness.kind !== "browser") {
    throw usage("usage", `unsupported witness kind: ${contract.witness.kind}`);
  }

  const resolvedWitnessDir = resolve(witnessDir);
  const cli = checkPin(resolvedWitnessDir, pin);

  const absoluteContract = resolve(contractPath);
  const absoluteOut = resolve(outDir);
  const timeout = ((contract.witness.timeout_s ?? 900) * contract.thresholds.runs + 300) * 1000;

  const status = runChild({
    cli,
    contractPath: absoluteContract,
    outDir: absoluteOut,
    target,
    witnessDir: resolvedWitnessDir,
    timeout,
  });

  const bundlePath = join(absoluteOut, "bundle.json");
  const bundle = readBundle(bundlePath);
  const written = checkBundle({
    bundle,
    bundlePath,
    contract,
    contractPath: absoluteContract,
    status,
  });

  write({
    level: "info",
    code: "verdict",
    verdict: bundle.verdict,
    bundle: written.path,
    sha256: written.sha256,
  });

  return {
    verdict: bundle.verdict,
    exitCode: status,
    bundle,
    path: written.path,
    sha256: written.sha256,
  };
}

export const witness = witnessBrowser;
