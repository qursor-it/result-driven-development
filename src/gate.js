import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import {
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from "node:path";
import { parse } from "yaml";
import { appendBundles } from "./ledger.js";
import { validateContractFile } from "./validate.js";
import { loadWitness } from "./witnesses.js";

const EXIT_CODES = { pass: 0, block: 1, owner: 3 };

function gitError(message) {
  const error = new Error(message);
  error.code = "git";
  return error;
}

function normalizePath(path) {
  return String(path).replaceAll("\\", "/").replace(/^\.\//, "").replace(/\/+$/, "");
}

function isUrl(value) {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(value);
}

function under(path, prefix) {
  if (prefix === "") return false;
  return path === prefix || path.startsWith(`${prefix}/`);
}

function unique(values) {
  return [...new Set(values)];
}

export function changedFiles(base, { cwd = process.cwd() } = {}) {
  const result = spawnSync("git", ["diff", "--name-only", `${base}...HEAD`], {
    cwd,
    encoding: "utf8",
  });
  if (result.error || result.status !== 0) {
    const detail = result.error?.message ?? result.stderr?.trim() ?? `exit ${result.status}`;
    throw gitError(`git diff failed: ${detail}`);
  }
  return result.stdout.split("\n").filter(Boolean).map(normalizePath).sort();
}

function headCommit(cwd) {
  const result = spawnSync("git", ["rev-parse", "HEAD"], { cwd, encoding: "utf8" });
  if (result.error || result.status !== 0) {
    const detail = result.error?.message ?? result.stderr?.trim() ?? `exit ${result.status}`;
    throw gitError(`git rev-parse failed: ${detail}`);
  }
  return result.stdout.trim();
}

function walkContracts(dir, root, files) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return files;
    throw error;
  }

  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "fixtures") continue;
      walkContracts(full, root, files);
    } else if (entry.isFile() && entry.name.endsWith(".result.yaml")) {
      files.push(relative(root, full).split(sep).join("/"));
    }
  }
  return files;
}

export function listContracts(root = process.cwd(), dir = "results") {
  return walkContracts(join(root, dir), root, []).sort();
}

export function touchReasons(contractPath, contract, changed) {
  const path = normalizePath(contractPath);
  const changedPaths = changed.map(normalizePath);
  const id = contract?.id;
  const dir = dirname(path);
  const kind = contract?.witness?.kind;
  const target = contract?.witness?.target;
  const reasons = [];

  if (changedPaths.includes(path)) reasons.push("contract");

  if (id !== undefined) {
    const sidecar = `${dir}/oracles/${id}.oracles.yaml`;
    if (changedPaths.includes(sidecar)) reasons.push("sidecar");
    if (changedPaths.includes(`witnesses/hidden/${id}.oracles.yaml`)) reasons.push("hidden");
    const fixtures = `${dir}/fixtures/${id}`;
    if (changedPaths.some((changedPath) => under(changedPath, fixtures))) reasons.push("fixtures");
  }

  if (typeof target === "string" && target !== "" && !isUrl(target)) {
    const targetPath = normalizePath(target);
    if (changedPaths.includes(targetPath)) reasons.push("target");
  }

  if (typeof kind === "string" && kind !== "") {
    const witnessDir = `witnesses/${kind}`;
    if (changedPaths.some((changedPath) => under(changedPath, witnessDir))) {
      reasons.push(`witness:${kind}`);
    }
  }

  const fsRead = contract?.capabilities?.["fs.read"];
  if (Array.isArray(fsRead)) {
    for (const declared of fsRead) {
      const prefix = normalizePath(declared);
      if (changedPaths.some((changedPath) => under(changedPath, prefix))) {
        reasons.push(`fs.read:${declared}`);
      }
    }
  }

  return unique(reasons);
}

function diffValues(baseValues, headValues) {
  const base = Array.isArray(baseValues) ? baseValues : [];
  const head = Array.isArray(headValues) ? headValues : [];
  return {
    added: unique(head.filter((value) => !base.includes(value))),
    removed: unique(base.filter((value) => !head.includes(value))),
  };
}

export function capabilityDiff(baseCaps, headCaps) {
  const base = baseCaps ?? {};
  const head = headCaps ?? {};
  const keys = unique([...Object.keys(base), ...Object.keys(head)]).sort();
  const diff = {};

  for (const key of keys) {
    const { added, removed } = diffValues(base[key], head[key]);
    if (added.length === 0 && removed.length === 0) continue;
    diff[key] = { added, removed };
  }

  return diff;
}

function declared(capabilities, key, value) {
  const allowed = capabilities?.[key];
  if (!Array.isArray(allowed)) return false;
  if (key === "fs.read" || key === "fs.write") {
    const path = normalizePath(value);
    return allowed.some((entry) => under(path, normalizePath(entry)));
  }
  return allowed.includes(value);
}

export function undeclaredUses(contract, bundle) {
  const used = bundle?.capabilities_used;
  if (!used || typeof used !== "object") return [];

  const capabilities = contract?.capabilities ?? {};
  const undeclared = [];
  for (const [key, values] of Object.entries(used)) {
    if (!Array.isArray(values)) continue;
    for (const value of values) {
      if (!declared(capabilities, key, value)) undeclared.push({ key, value });
    }
  }
  return undeclared;
}

function hasEntries(value) {
  return value !== null && typeof value === "object" && Object.keys(value).length > 0;
}

export function gateDecision(entries) {
  let decision = "pass";

  for (const entry of entries) {
    if (entry.error !== undefined || entry.verdict === "refuted") return "block";
    if (Array.isArray(entry.undeclared_uses) && entry.undeclared_uses.length > 0) return "block";
    if (entry.verdict === "inconclusive" || hasEntries(entry.capability_diff)) {
      decision = "owner";
    }
  }

  return decision;
}

function readContract(absolutePath) {
  try {
    return parse(readFileSync(absolutePath, "utf8"));
  } catch {
    return null;
  }
}

function baseCapabilities(base, contractPath, cwd) {
  const result = spawnSync("git", ["show", `${base}:${contractPath}`], {
    cwd,
    encoding: "utf8",
  });
  if (result.error || result.status !== 0) return null;

  try {
    const contract = parse(result.stdout);
    return contract?.capabilities ?? {};
  } catch {
    return null;
  }
}

function repoPath(file, root) {
  if (isAbsolute(file)) {
    const relativePath = relative(root, file);
    if (relativePath !== "" && !relativePath.startsWith("..")) {
      return normalizePath(relativePath);
    }
  }
  return normalizePath(file);
}

function makeEntry({
  id,
  path,
  reasons,
  verdict = null,
  bundle = null,
  sha256 = null,
  capabilityDiff: capabilities = {},
  undeclaredUses: uses = [],
  error,
  message,
  errors,
}) {
  const entry = {
    id,
    path,
    reasons,
    verdict,
    bundle,
    sha256,
    capability_diff: capabilities,
    undeclared_uses: uses,
  };
  if (error !== undefined) entry.error = error;
  if (message !== undefined) entry.message = message;
  if (errors !== undefined) entry.errors = errors;
  return entry;
}

function readBundle(bundlePath) {
  if (!bundlePath) return null;
  try {
    return JSON.parse(readFileSync(bundlePath, "utf8"));
  } catch {
    return null;
  }
}

export async function runGate({
  base,
  out,
  contracts: forced = [],
  all = false,
  ledger,
  root = process.cwd(),
}) {
  const changed = changedFiles(base, { cwd: root });
  const head = headCommit(root);
  const outRoot = resolve(root, out);
  const candidates = listContracts(root);
  const forcedPaths = new Set(forced.map((file) => repoPath(file, root)));
  const parsed = new Map();

  const contractOf = (path) => {
    if (!parsed.has(path)) parsed.set(path, readContract(join(root, path)));
    return parsed.get(path);
  };

  const selected = new Set();
  for (const path of candidates) {
    if (all) {
      selected.add(path);
      continue;
    }
    if (touchReasons(path, contractOf(path), changed).length > 0) selected.add(path);
  }
  for (const path of forcedPaths) selected.add(path);

  const entries = [];
  const bundlePaths = [];

  for (const path of [...selected].sort()) {
    const contract = contractOf(path);
    const absolute = join(root, path);
    const reasons = touchReasons(path, contract, changed);
    if (forcedPaths.has(path) && !reasons.includes("forced")) reasons.push("forced");
    if (all && reasons.length === 0) reasons.push("all");

    const validation = validateContractFile(absolute);
    if (!validation.ok) {
      entries.push(
        makeEntry({
          id: contract?.id ?? null,
          path,
          reasons,
          error: "invalid",
          errors: validation.errors,
        }),
      );
      continue;
    }

    const id = contract.id;
    const loader = loadWitness(contract.witness.kind);
    if (!loader) {
      entries.push(
        makeEntry({
          id,
          path,
          reasons,
          error: "witness",
          message: `unsupported witness kind: ${contract.witness.kind}`,
        }),
      );
      continue;
    }

    let result;
    try {
      const { witness } = await loader;
      result = await witness({ contractPath: absolute, outDir: join(outRoot, id) });
    } catch (error) {
      entries.push(
        makeEntry({
          id,
          path,
          reasons,
          error: "witness",
          message: error.message,
          errors: error.errors,
        }),
      );
      continue;
    }

    const bundlePath = result.bundlePath ?? result.path ?? null;
    const bundleSha = result.bundleSha256 ?? result.sha256 ?? null;
    const bundle = result.bundle ?? readBundle(bundlePath);
    const capabilities = baseCapabilities(base, path, root);
    const entry = makeEntry({
      id,
      path,
      reasons,
      verdict: result.verdict,
      bundle: bundlePath,
      sha256: bundleSha,
      capabilityDiff: capabilityDiff(capabilities, contract.capabilities ?? {}),
      undeclaredUses: undeclaredUses(contract, bundle),
    });

    entries.push(entry);
    if (bundlePath) bundlePaths.push(bundlePath);
  }

  const decision = gateDecision(entries);
  const report = { base, head, changed, contracts: entries, decision };

  mkdirSync(outRoot, { recursive: true });
  writeFileSync(join(outRoot, "gate.json"), `${JSON.stringify(report, null, 2)}\n`);

  if (ledger !== undefined && bundlePaths.length > 0) {
    appendBundles(bundlePaths, { ledgerPath: ledger });
  }

  return { decision, exitCode: EXIT_CODES[decision], report };
}
