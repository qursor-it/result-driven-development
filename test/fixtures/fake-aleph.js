#!/usr/bin/env node
import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const [command, ...rest] = process.argv.slice(2);

function readTarget(path) {
  try {
    return readFileSync(path, "utf8");
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }
}

function values(text, key) {
  const found = [];
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith(`${key}:`)) found.push(line.slice(key.length + 1).trim());
  }
  return found;
}

function value(text, key) {
  return values(text, key)[0];
}

function writeFiles(text, key) {
  for (const path of values(text, key)) {
    mkdirSync(dirname(path) || ".", { recursive: true });
    writeFileSync(path, `${key} ${path}\n`);
  }
}

function engineRun(text, prefix) {
  const out = value(text, prefix);
  if (out !== undefined) process.stdout.write(out);
  for (const file of values(text, `${prefix}_read`)) {
    process.stdout.write(readFileSync(file, "utf8"));
  }
  writeFiles(text, `${prefix}_write`);
  writeFiles(text, "write");
  process.exit(Number(value(text, `${prefix}_exit`) ?? 0));
}

if (command === "check") {
  const text = readTarget(rest[0]);
  if (value(text, "check") === "fail") {
    process.stderr.write("check failed\n");
    process.exit(1);
  }
  process.exit(0);
}

if (command === "run") {
  engineRun(readTarget(rest[0]), "run");
}

if (command === "build") {
  const text = readTarget(rest[0]);
  const out = rest[rest.indexOf("-o") + 1];
  if (value(text, "build") === "fail") {
    process.stderr.write("build failed\n");
    process.exit(1);
  }

  const stdout = value(text, "native") ?? "";
  const exit = Number(value(text, "native_exit") ?? 0);
  const lines = [
    "#!/usr/bin/env node",
    'const fs = require("node:fs");',
    'const path = require("node:path");',
    `process.stdout.write(${JSON.stringify(stdout)});`,
  ];
  for (const file of values(text, "native_read")) {
    lines.push(`process.stdout.write(fs.readFileSync(${JSON.stringify(file)}, "utf8"));`);
  }
  for (const file of values(text, "native_write")) {
    lines.push(`fs.mkdirSync(path.dirname(${JSON.stringify(file)}) || ".", { recursive: true });`);
    lines.push(
      `fs.writeFileSync(${JSON.stringify(file)}, ${JSON.stringify(`native_write ${file}\n`)});`,
    );
  }
  for (const file of values(text, "write")) {
    lines.push(`fs.mkdirSync(path.dirname(${JSON.stringify(file)}) || ".", { recursive: true });`);
    lines.push(`fs.writeFileSync(${JSON.stringify(file)}, ${JSON.stringify(`write ${file}\n`)});`);
  }
  lines.push(`process.exit(${exit});`);

  writeFileSync(out, `${lines.join("\n")}\n`);
  chmodSync(out, 0o755);
  process.exit(0);
}

process.stderr.write(`unknown command: ${command}\n`);
process.exit(2);
