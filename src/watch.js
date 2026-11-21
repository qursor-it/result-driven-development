import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parse } from "yaml";
import { listContracts } from "./gate.js";
import { appendBundles, readLedger } from "./ledger.js";
import { loadWitness } from "./witnesses.js";

const UNITS = { m: 60_000, h: 3_600_000, d: 86_400_000 };

export function parseInterval(value) {
  const match = /^([0-9]+)([mhd])$/.exec(String(value));
  if (!match) throw new Error(`invalid interval: ${value}`);
  return Number(match[1]) * UNITS[match[2]];
}

export function latestEntries(entries) {
  const latest = new Map();
  for (const entry of entries) {
    const current = latest.get(entry.result);
    if (current === undefined || String(entry.at) >= String(current.at)) {
      latest.set(entry.result, entry);
    }
  }
  return latest;
}

export function watchPlan(contracts, entries, now) {
  const latest = latestEntries(entries);
  const nowMs = now instanceof Date ? now.getTime() : Date.parse(now);
  const plan = [];

  for (const { path, contract } of contracts) {
    const interval = contract?.watch?.interval;
    if (interval === undefined) continue;

    const last = latest.get(contract.id) ?? null;
    let state;
    if (last === null || last.verdict !== "observed") {
      state = "not-accepted";
    } else if (nowMs - Date.parse(last.at) >= parseInterval(interval)) {
      state = "due";
    } else {
      state = "not-due";
    }

    plan.push({ id: contract.id, path, last_at: last === null ? null : last.at, state });
  }

  return plan;
}

function reportEntry(item) {
  return { id: item.id, path: item.path, state: item.state, last_at: item.last_at };
}

export async function runWatch({
  out,
  results = "results",
  ledger = "ledger/results.jsonl",
  now = new Date(),
  dryRun = false,
  root = process.cwd(),
}) {
  const outRoot = resolve(root, out);
  const ledgerPath = resolve(root, ledger);
  const nowDate = now instanceof Date ? now : new Date(now);

  const contracts = listContracts(root, results).map((path) => ({
    path,
    contract: parse(readFileSync(join(root, path), "utf8")),
  }));
  const plan = watchPlan(contracts, readLedger(ledgerPath), nowDate);
  const contractByPath = new Map(contracts.map(({ path, contract }) => [path, contract]));

  const byPath = new Map();
  const bundlePaths = [];
  const reopened = [];

  const due = plan
    .filter((item) => item.state === "due")
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));

  for (const item of due) {
    const contract = contractByPath.get(item.path);
    const entry = reportEntry(item);

    const loader = loadWitness(contract.witness.kind);
    if (!loader) {
      entry.error = `unsupported witness kind: ${contract.witness.kind}`;
      byPath.set(item.path, entry);
      continue;
    }

    try {
      const { witness } = await loader;
      const result = await witness({
        contractPath: join(root, item.path),
        outDir: join(outRoot, item.id),
        target: contract.watch.target,
      });

      entry.verdict = result.verdict;
      const bundlePath = result.bundlePath ?? result.path;
      if (bundlePath) entry.bundle = bundlePath;
      const bundleSha = result.bundleSha256 ?? result.sha256;
      if (bundleSha) entry.sha256 = bundleSha;
      if (bundlePath) bundlePaths.push(bundlePath);
      if (result.verdict === "refuted") {
        entry.reopened = true;
        reopened.push(item.id);
      }
    } catch (error) {
      entry.error = error.message;
    }

    if (entry.reopened === undefined) entry.reopened = false;
    byPath.set(item.path, entry);
  }

  for (const item of plan) {
    if (byPath.has(item.path)) continue;
    const entry = reportEntry(item);
    entry.reopened = false;
    byPath.set(item.path, entry);
  }

  if (!dryRun && bundlePaths.length > 0) {
    appendBundles(bundlePaths, { ledgerPath, source: "watch" });
  }

  const report = {
    now: nowDate.toISOString(),
    results,
    ledger,
    contracts: plan.map((item) => {
      const entry = byPath.get(item.path);
      return entry ?? { ...reportEntry(item), reopened: false };
    }),
    reopened,
  };

  mkdirSync(outRoot, { recursive: true });
  writeFileSync(join(outRoot, "watch.json"), `${JSON.stringify(report, null, 2)}\n`);

  const hasError = report.contracts.some((entry) => entry.error !== undefined);
  const hasInconclusive = report.contracts.some((entry) => entry.verdict === "inconclusive");
  const exitCode = reopened.length > 0 ? 1 : hasError || hasInconclusive ? 3 : 0;

  return { exitCode, report };
}
