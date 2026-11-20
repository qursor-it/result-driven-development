#!/usr/bin/env node
import { parseArgs } from "node:util";
import { witnessCli } from "./index.js";

const USAGE = "usage: witness <contract.yaml> [--target <target>] --out <dir>";

function fail(code, message, details) {
  const fields = { level: "error", code, message };
  if (details) fields.errors = details;
  process.stderr.write(`${JSON.stringify(fields)}\n`);
  process.exit(2);
}

let parsed;
try {
  parsed = parseArgs({
    allowPositionals: true,
    options: {
      target: { type: "string" },
      out: { type: "string" },
    },
  });
} catch (error) {
  fail("usage", `${error.message}; ${USAGE}`);
}

if (parsed.positionals.length !== 1) {
  fail("usage", USAGE);
}

try {
  const result = witnessCli({
    contractPath: parsed.positionals[0],
    target: parsed.values.target,
    outDir: parsed.values.out,
  });
  process.exit(result.exitCode);
} catch (error) {
  fail(error.code ?? "usage", error.message, error.errors);
}
