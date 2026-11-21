#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { parse } from "yaml";
import { validateContractFile, validateSidecarFile } from "../src/validate.js";
import { appendBundles, history, readLedger } from "../src/ledger.js";
import { renderLedger } from "../src/render-ledger.js";
import { runGate } from "../src/gate.js";
import { renderGate } from "../src/render-gate.js";
import { loadWitness } from "../src/witnesses.js";

const USAGE =
  "usage: rdd validate <file>... | rdd witness <contract.yaml> [--target <target>] --out <dir> | " +
  "rdd gate --base <ref> --out <dir> [--contract <path>]... [--all] [--ledger <path>] [--text] | " +
  "rdd ledger append <bundle.json>... [--ledger <path>] | rdd ledger <R-NNN> [--ledger <path>] [--text]";

function write(fields) {
  process.stderr.write(`${JSON.stringify(fields)}\n`);
}

function usage(message) {
  write({ level: "error", code: "usage", message: message ? `${message}; ${USAGE}` : USAGE });
  return 2;
}

function validateCommand(files) {
  if (files.length === 0) return usage("validate requires at least one file");

  let ok = true;
  for (const file of files) {
    const result = file.endsWith(".oracles.yaml")
      ? validateSidecarFile(file)
      : validateContractFile(file);
    if (result.ok) {
      write({ level: "info", code: "valid", file });
      continue;
    }

    ok = false;
    for (const error of result.errors) {
      const fields = { level: "error", code: error.code, file, path: error.path, message: error.message };
      if (error.sidecar !== undefined) fields.sidecar = error.sidecar;
      write(fields);
    }
  }
  return ok ? 0 : 1;
}

async function witnessCommand(args) {
  let parsed;
  try {
    parsed = parseArgs({
      args,
      allowPositionals: true,
      options: {
        target: { type: "string" },
        out: { type: "string" },
      },
    });
  } catch (error) {
    return usage(error.message);
  }

  if (parsed.positionals.length !== 1) {
    return usage("witness requires exactly one contract");
  }

  const [contractPath] = parsed.positionals;
  const validation = validateContractFile(contractPath);
  if (!validation.ok) {
    for (const error of validation.errors) {
      const fields = {
        level: "error",
        code: error.code,
        file: contractPath,
        path: error.path,
        message: error.message,
      };
      if (error.sidecar !== undefined) fields.sidecar = error.sidecar;
      write(fields);
    }
    return 2;
  }

  let contract;
  try {
    contract = parse(readFileSync(contractPath, "utf8"));
  } catch (error) {
    write({ level: "error", code: "yaml", file: contractPath, message: error.message });
    return 2;
  }

  const kind = contract.witness.kind;
  const loader = loadWitness(kind);
  if (!loader) return usage(`unsupported witness kind: ${kind}`);

  try {
    const { witness } = await loader;
    const result = witness({
      contractPath,
      target: parsed.values.target,
      outDir: parsed.values.out,
    });
    return result.exitCode;
  } catch (error) {
    const fields = {
      level: "error",
      code: error.code ?? "usage",
      message: error.message,
    };
    if (error.errors) fields.errors = error.errors;
    write(fields);
    return 2;
  }
}

async function gateCommand(args) {
  let parsed;
  try {
    parsed = parseArgs({
      args,
      allowPositionals: true,
      options: {
        base: { type: "string" },
        out: { type: "string" },
        contract: { type: "string", multiple: true },
        all: { type: "boolean" },
        ledger: { type: "string" },
        text: { type: "boolean" },
      },
    });
  } catch (error) {
    return usage(error.message);
  }

  if (parsed.positionals.length > 0) return usage("gate takes no positional arguments");
  const { base, out } = parsed.values;
  if (!base) return usage("gate requires --base");
  if (!out) return usage("gate requires --out");

  let result;
  try {
    result = await runGate({
      base,
      out,
      contracts: parsed.values.contract ?? [],
      all: parsed.values.all === true,
      ledger: parsed.values.ledger,
    });
  } catch (error) {
    write({ level: "error", code: error.code ?? "gate", message: error.message });
    return 2;
  }

  const { decision, exitCode, report } = result;
  for (const entry of report.contracts) {
    write({
      level: "info",
      code: "gate-contract",
      result: entry.id,
      verdict: entry.verdict,
      reasons: entry.reasons,
    });
  }

  if (parsed.values.text) process.stdout.write(renderGate(report));

  write({
    level: decision === "block" ? "error" : "info",
    code: "gate",
    decision,
    report: join(out, "gate.json"),
  });
  return exitCode;
}

function ledgerCommand(args) {
  let parsed;
  try {
    parsed = parseArgs({
      args,
      allowPositionals: true,
      options: {
        ledger: { type: "string" },
        text: { type: "boolean" },
      },
    });
  } catch (error) {
    return usage(error.message);
  }

  const [subcommand, ...rest] = parsed.positionals;
  if (!subcommand) return usage("ledger requires append or a result id");

  const ledgerPath = parsed.values.ledger;
  const ledgerOptions = ledgerPath === undefined ? {} : { ledgerPath };

  if (subcommand === "append") {
    if (rest.length === 0) return usage("ledger append requires at least one bundle");
    try {
      const { appended, skipped } = appendBundles(rest, ledgerOptions);
      write({ level: "info", code: "ledger", appended, skipped });
      return 0;
    } catch (error) {
      write({ level: "error", code: "ledger", message: error.message });
      return 1;
    }
  }

  if (!/^R-[0-9]{3,}$/.test(subcommand)) {
    return usage(`invalid result id: ${subcommand}`);
  }

  let entries;
  try {
    entries = readLedger(ledgerPath);
  } catch (error) {
    write({ level: "error", code: "ledger", message: error.message });
    return 1;
  }

  const selected = history(entries, subcommand);
  if (selected.length === 0) return 0;

  if (parsed.values.text) {
    process.stdout.write(renderLedger(selected));
  } else {
    for (const entry of selected) {
      process.stdout.write(`${JSON.stringify(entry)}\n`);
    }
  }
  return 0;
}

const COMMANDS = new Map([
  ["validate", validateCommand],
  ["witness", witnessCommand],
  ["gate", gateCommand],
  ["ledger", ledgerCommand],
]);

const [name, ...args] = process.argv.slice(2);
if (!name) {
  process.exit(usage());
}

const command = COMMANDS.get(name);
if (!command) {
  process.exit(usage(`unknown command: ${name}`));
}

process.exit(await command(args));
