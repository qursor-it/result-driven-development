import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import { sha256 } from "./evidence.js";
import { compileSchema } from "./schemas.js";

const validateEvidence = compileSchema("evidence");

export const DEFAULT_LEDGER_PATH = "ledger/results.jsonl";

export function ledgerEntry(bundle, bundleSha256, { source } = {}) {
  const entry = {
    result: bundle.result,
    verdict: bundle.verdict,
    at: bundle.at,
    bundle_sha256: bundleSha256,
    contract_sha256: bundle.contract_sha256,
    build_sha256: bundle.build.sha256,
    witness: `${bundle.witness.kind}@${bundle.witness.version}`,
  };
  if (Array.isArray(bundle.reasons) && bundle.reasons.length > 0) {
    entry.reasons = bundle.reasons;
  }
  if (source !== undefined) {
    entry.source = source;
  }
  return entry;
}

function readBundle(bundlePath, source) {
  const bytes = readFileSync(bundlePath);
  const bundleSha256 = sha256(bytes);

  let bundle;
  try {
    bundle = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`invalid evidence bundle: ${bundlePath}: ${error.message}`);
  }

  if (!validateEvidence(bundle)) {
    throw new Error(
      `invalid evidence bundle: ${bundlePath}: ${JSON.stringify(validateEvidence.errors)}`,
    );
  }

  return { entry: ledgerEntry(bundle, bundleSha256, { source }), bundleSha256 };
}

function compareEntries(a, b) {
  for (const key of ["at", "result", "bundle_sha256"]) {
    if (a[key] < b[key]) return -1;
    if (a[key] > b[key]) return 1;
  }
  return 0;
}

export function appendBundles(bundlePaths, { ledgerPath = DEFAULT_LEDGER_PATH, source } = {}) {
  const candidates = bundlePaths.map((bundlePath) => readBundle(bundlePath, source));
  const existing = readLedger(ledgerPath);
  const seen = new Set(existing.map((entry) => entry.bundle_sha256));

  const entries = [];
  let skipped = 0;
  for (const candidate of candidates) {
    if (seen.has(candidate.bundleSha256)) {
      skipped += 1;
      continue;
    }
    seen.add(candidate.bundleSha256);
    entries.push(candidate.entry);
  }

  entries.sort(compareEntries);

  if (entries.length > 0) {
    mkdirSync(dirname(ledgerPath), { recursive: true });
    const content = entries.map((entry) => `${JSON.stringify(entry)}\n`).join("");
    appendFileSync(ledgerPath, content);
  }

  return { appended: entries.length, skipped };
}

export function readLedger(ledgerPath = DEFAULT_LEDGER_PATH) {
  if (!existsSync(ledgerPath)) return [];

  const content = readFileSync(ledgerPath, "utf8");
  if (content === "") return [];

  const lines = content.split("\n");
  if (lines[lines.length - 1] === "") lines.pop();

  return lines.map((line, index) => {
    try {
      return JSON.parse(line);
    } catch {
      throw new Error(`malformed ledger entry at line ${index + 1}: ${ledgerPath}`);
    }
  });
}

export function history(entries, resultId) {
  return entries.filter((entry) => entry.result === resultId);
}
