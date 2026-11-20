import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { compileSchema } from "./schemas.js";

const validateEvidence = compileSchema("evidence");

function round6(value) {
  return Math.round(value * 1e6) / 1e6;
}

export function sha256(bufferOrString) {
  return createHash("sha256").update(bufferOrString).digest("hex");
}

export function sha256File(path) {
  return sha256(readFileSync(path));
}

export function percentile(values, p) {
  if (values.length === 0) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.min(sorted.length, Math.max(1, Math.ceil((p / 100) * sorted.length)));
  return sorted[rank - 1];
}

export function summarize(runs) {
  const summary = {};
  const successes = runs.filter((run) => run.status === "success");
  const failures = runs.filter((run) => run.status === "failure");
  const inconclusive = runs.filter((run) => run.status === "inconclusive");

  if (successes.length + failures.length > 0) {
    summary.success_rate = round6(successes.length / (successes.length + failures.length));
  }

  const times = successes
    .map((run) => run.time_to_result_s)
    .filter((time) => typeof time === "number" && Number.isFinite(time));

  if (times.length > 0) {
    summary.p50_time_to_result_s = round6(percentile(times, 50));
    summary.p95_time_to_result_s = round6(percentile(times, 95));
  }

  if (runs.length > 0) {
    summary.inconclusive_rate = round6(inconclusive.length / runs.length);
  }

  return summary;
}

function hasValue(value) {
  return value !== undefined && value !== null;
}

export function buildBundle({
  result,
  contractPath,
  buildPath,
  buildSha256,
  commit,
  witness,
  verdict,
  reasons,
  runs = [],
  capabilitiesUsed,
  at,
}) {
  if (hasValue(buildSha256) === hasValue(buildPath)) {
    throw new Error("exactly one of buildPath or buildSha256 must be given");
  }

  const build = {
    sha256: hasValue(buildSha256) ? buildSha256 : sha256File(buildPath),
  };
  if (hasValue(commit)) build.commit = commit;

  const bundle = {
    result,
    contract_sha256: sha256File(contractPath),
    build,
    witness,
    verdict,
  };
  if (hasValue(reasons)) bundle.reasons = reasons;
  bundle.runs = runs;
  bundle.summary = summarize(runs);
  if (hasValue(capabilitiesUsed)) bundle.capabilities_used = capabilitiesUsed;
  bundle.at = at ?? new Date().toISOString();

  return bundle;
}

export function writeBundle(bundle, outDir) {
  if (!validateEvidence(bundle)) {
    throw new Error(`invalid evidence bundle: ${JSON.stringify(validateEvidence.errors)}`);
  }

  mkdirSync(outDir, { recursive: true });
  const path = join(outDir, "bundle.json");
  const content = `${JSON.stringify(bundle, null, 2)}\n`;
  writeFileSync(path, content);

  return { path, sha256: sha256(content) };
}
