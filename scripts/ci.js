import { spawnSync } from "node:child_process";
import { compileSchema } from "../src/schemas.js";

const SCHEMAS = ["result-contract", "evidence"];

function log(level, fields) {
  process.stderr.write(`${JSON.stringify({ level, ...fields })}\n`);
}

function checkNodeVersion() {
  const major = Number(process.versions.node.split(".")[0]);
  if (major < 24) {
    log("error", { check: "node", required: ">=24", current: process.versions.node, ok: false });
    return false;
  }
  log("info", { check: "node", required: ">=24", current: process.versions.node, ok: true });
  return true;
}

function checkSchemas() {
  let ok = true;
  for (const name of SCHEMAS) {
    const file = `spec/${name}.schema.json`;
    try {
      compileSchema(name);
      log("info", { check: "schema", file, ok: true });
    } catch (error) {
      ok = false;
      log("error", { check: "schema", file, ok: false, error: error.message });
    }
  }
  return ok;
}

function runTests() {
  const result = spawnSync(process.execPath, ["--test", "test/**/*.test.js"], { stdio: "inherit" });
  const ok = result.status === 0;
  log(ok ? "info" : "error", { check: "tests", ok });
  return ok;
}

if (!checkNodeVersion()) process.exit(1);
if (!checkSchemas()) process.exit(1);
if (!runTests()) process.exit(1);
