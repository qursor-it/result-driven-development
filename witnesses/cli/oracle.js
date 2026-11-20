import { isAbsolute } from "node:path";

const STREAM_OPS = new Set(["==", "contains"]);
const EXIT_OPS = new Set(["==", "!="]);
const ORACLE = /^(stdout|stderr|exit_code)\s+(==|!=|contains)\s+(.+)$/s;
const FILE_ORACLE = /^file\s+("(?:[^"\\]|\\.)*")\s+==\s+(.+)$/s;
const INTEGER = /^-?\d+$/;
const FOUND_LIMIT = 200;

function truncate(value) {
  return String(value ?? "").slice(0, FOUND_LIMIT);
}

function safeRelativePath(path) {
  if (isAbsolute(path)) return false;
  if (/^[A-Za-z]:[\\/]/.test(path) || path.startsWith("\\\\")) return false;
  return !path.split(/[\\/]/).some((segment) => segment === "..");
}

export function parseOracle(text) {
  if (typeof text !== "string") return { supported: false };

  const fileMatch = text.trim().match(FILE_ORACLE);
  if (fileMatch) {
    const [, rawPath, rawExpected] = fileMatch;
    let path;
    let expected;
    try {
      path = JSON.parse(rawPath);
      expected = JSON.parse(rawExpected.trim());
    } catch {
      return { supported: false };
    }
    if (typeof path !== "string" || typeof expected !== "string") return { supported: false };
    if (!safeRelativePath(path)) return { supported: false };
    return { supported: true, stream: "file", path, op: "==", expected };
  }

  const match = text.trim().match(ORACLE);
  if (!match) return { supported: false };

  const [, stream, op, raw] = match;
  const value = raw.trim();

  if (stream === "exit_code") {
    if (!EXIT_OPS.has(op) || !INTEGER.test(value)) return { supported: false };
    return { supported: true, stream, op, expected: Number(value) };
  }

  if (!STREAM_OPS.has(op)) return { supported: false };

  let expected;
  try {
    expected = JSON.parse(value);
  } catch {
    return { supported: false };
  }
  if (typeof expected !== "string") return { supported: false };

  return { supported: true, stream, op, expected };
}

export function checkOracle(oracle, observed) {
  const parsed = typeof oracle === "string" ? parseOracle(oracle) : oracle;
  if (!parsed || !parsed.supported) {
    return { supported: false, ok: false, found: null };
  }

  if (parsed.stream === "file") {
    const content =
      typeof observed.readFile === "function" ? observed.readFile(parsed.path) : null;
    const ok = content === parsed.expected;
    const found = content === undefined || content === null ? null : truncate(content);
    return { supported: true, ok, found };
  }

  if (parsed.stream === "exit_code") {
    const actual = observed.exitCode ?? observed.exit_code ?? observed.status ?? null;
    const ok = parsed.op === "==" ? actual === parsed.expected : actual !== parsed.expected;
    return { supported: true, ok, found: actual };
  }

  const actual = observed[parsed.stream];
  const text = typeof actual === "string" ? actual : "";
  const ok = parsed.op === "==" ? text === parsed.expected : text.includes(parsed.expected);
  return { supported: true, ok, found: truncate(text) };
}
