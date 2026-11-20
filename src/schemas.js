import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";

const SPEC_DIR = fileURLToPath(new URL("../spec/", import.meta.url));

const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

function isDateTime(value) {
  return typeof value === "string" && DATE_TIME.test(value) && !Number.isNaN(Date.parse(value));
}

function writeDiagnostic(level, message) {
  process.stderr.write(`${JSON.stringify({ level, check: "schema", message })}\n`);
}

function createAjv() {
  // the contract schema declares union types on purpose (thresholds.additionalProperties)
  const ajv = new Ajv2020({
    allowUnionTypes: true,
    logger: {
      log: () => {},
      warn: (message) => writeDiagnostic("warning", message),
      error: (message) => writeDiagnostic("error", message),
    },
  });
  ajv.addFormat("date-time", { type: "string", validate: isDateTime });
  return ajv;
}

export function loadSchema(name) {
  return JSON.parse(readFileSync(`${SPEC_DIR}${name}.schema.json`, "utf8"));
}

export function compileSchema(name) {
  return createAjv().compile(loadSchema(name));
}

export function compileSchemas() {
  return {
    contract: compileSchema("result-contract"),
    evidence: compileSchema("evidence"),
  };
}
