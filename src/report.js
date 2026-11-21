import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parse } from "yaml";
import { percentile } from "./evidence.js";
import { listContracts } from "./gate.js";
import { readLedger } from "./ledger.js";

const HOUR_MS = 3.6e6;

export function monthRange(month) {
  const match = /^([0-9]{4})-(0[1-9]|1[0-2])$/.exec(String(month));
  if (!match) throw new Error(`invalid month: ${month}`);

  const year = Number(match[1]);
  const index = Number(match[2]) - 1;

  return {
    start: Date.UTC(year, index, 1),
    end: Date.UTC(year, index + 1, 1),
  };
}

export function firstObserved(entries) {
  const observed = new Map();

  for (const entry of entries) {
    if (entry.verdict !== "observed") continue;
    const at = String(entry.at);
    const current = observed.get(entry.result);
    if (current === undefined || Date.parse(at) < Date.parse(current)) {
      observed.set(entry.result, at);
    }
  }

  return observed;
}

export function acceptedInMonth(entries, range) {
  const first = firstObserved(entries);
  const accepted = [];

  for (const [id, at] of first) {
    const time = Date.parse(at);
    if (time >= range.start && time < range.end) accepted.push(id);
  }

  return accepted.sort();
}

export function watchRegressions(entries, range) {
  const regressions = new Set();

  for (const entry of entries) {
    if (entry.source !== "watch") continue;
    if (entry.verdict !== "refuted") continue;
    const time = Date.parse(entry.at);
    if (time >= range.start && time < range.end) regressions.add(entry.result);
  }

  return [...regressions].sort();
}

export function contractAddedAt(path, { cwd = process.cwd() } = {}) {
  const result = spawnSync("git", ["log", "--diff-filter=A", "--format=%aI", "--", path], {
    cwd,
    encoding: "utf8",
  });
  if (result.error || result.status !== 0) return null;

  const lines = result.stdout.split("\n").filter((line) => line.trim() !== "");
  return lines.length === 0 ? null : lines[lines.length - 1].trim();
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

export function timeToAcceptance(ids, firstObservedMap, addedAtById) {
  const results = {};
  const values = [];

  for (const id of ids) {
    const observed = firstObservedMap.get(id);
    const added = addedAtById.get(id);
    if (added === undefined || added === null) {
      results[id] = null;
      continue;
    }

    const hours = Math.max(0, Date.parse(observed) - Date.parse(added)) / HOUR_MS;
    const rounded = round2(hours);
    results[id] = rounded;
    values.push(rounded);
  }

  return {
    p50: values.length === 0 ? null : percentile(values, 50),
    results,
  };
}

function contractPaths(root, results) {
  const paths = new Map();

  for (const path of listContracts(root, results)) {
    try {
      const contract = parse(readFileSync(join(root, path), "utf8"));
      if (contract?.id !== undefined) paths.set(contract.id, path);
    } catch {
      // Ignore contracts that cannot be parsed; they get no acceptance time.
    }
  }

  return paths;
}

export function monthlyReport({
  month,
  ledger = "ledger/results.jsonl",
  results = "results",
  root = process.cwd(),
}) {
  const range = monthRange(month);
  const entries = readLedger(resolve(root, ledger));
  const accepted = acceptedInMonth(entries, range);
  const regressions = watchRegressions(entries, range);

  const paths = contractPaths(root, results);
  const addedAtById = new Map();
  for (const id of accepted) {
    const path = paths.get(id);
    addedAtById.set(id, path === undefined ? null : contractAddedAt(path, { cwd: root }));
  }

  const time = timeToAcceptance(accepted, firstObserved(entries), addedAtById);

  return {
    month,
    accepted_without_code_review: { count: accepted.length, results: accepted },
    regressions_found_by_watch: { count: regressions.length, results: regressions },
    time_to_acceptance_h: { p50: time.p50, results: time.results },
  };
}
