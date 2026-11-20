#!/usr/bin/env node
import { validateContractFile } from "../src/validate.js";

const USAGE = "usage: rdd validate <file>...";

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

const COMMANDS = new Map([["validate", validateCommand]]);

const [name, ...args] = process.argv.slice(2);
if (!name) {
  process.exit(usage());
}

const command = COMMANDS.get(name);
if (!command) {
  process.exit(usage(`unknown command: ${name}`));
}

process.exit(command(args));
