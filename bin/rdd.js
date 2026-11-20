#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { parse } from "yaml";
import { validateContractFile } from "../src/validate.js";

const USAGE =
  "usage: rdd validate <file>... | rdd witness <contract.yaml> [--target <target>] --out <dir>";

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
    const result = validateContractFile(file);
    if (result.ok) {
      write({ level: "info", code: "valid", file });
      continue;
    }

    ok = false;
    for (const error of result.errors) {
      write({ level: "error", code: error.code, file, path: error.path, message: error.message });
    }
  }
  return ok ? 0 : 1;
}

const WITNESSES = new Map([["cli", () => import("../witnesses/cli/index.js")]]);

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
      write({ level: "error", code: error.code, file: contractPath, path: error.path, message: error.message });
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
  const loadWitness = WITNESSES.get(kind);
  if (!loadWitness) return usage(`unsupported witness kind: ${kind}`);

  try {
    const { witnessCli } = await loadWitness();
    const result = witnessCli({
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

const COMMANDS = new Map([
  ["validate", validateCommand],
  ["witness", witnessCommand],
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
