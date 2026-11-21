import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { parse } from "yaml";
import { compileSchemas } from "./schemas.js";

const { contract: contractValidator, sidecar: sidecarValidator } = compileSchemas();

const PLACEHOLDERS = new Set(["email", "run", "project"]);
const PLACEHOLDER = /\{([^{}]*)\}/g;

function schemaErrors(validator) {
  return (validator.errors ?? []).map((error) => ({
    code: "schema",
    path: error.instancePath ?? "",
    message: error.message ?? "invalid",
  }));
}

function loadYaml(file) {
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch (error) {
    return { error: { code: "io", path: "", message: error.message } };
  }

  try {
    return { object: parse(text) };
  } catch (error) {
    return { error: { code: "yaml", path: "", message: error.message } };
  }
}

function hiddenOracleErrors(contract) {
  if (!contract || contract.hidden !== true || !Array.isArray(contract.outcome)) return [];
  return contract.outcome
    .map((outcome, index) => ({ outcome, index }))
    .filter(({ outcome }) => outcome?.oracle !== undefined && outcome?.oracle !== null)
    .map(({ index }) => ({
      code: "hidden",
      path: `/outcome/${index}/oracle`,
      message: "hidden contract must not carry inline oracles",
    }));
}

function escapePointer(key) {
  return key.replaceAll("~", "~0").replaceAll("/", "~1");
}

function placeholderErrorsInString(value, path, errors) {
  if (typeof value !== "string") return;
  for (const match of value.matchAll(PLACEHOLDER)) {
    if (!PLACEHOLDERS.has(match[1])) {
      errors.push({
        code: "placeholder",
        path,
        message: `unknown placeholder: ${match[0]}`,
      });
    }
  }
}

function expectPlaceholderErrors(value, path, errors) {
  if (typeof value === "string") {
    placeholderErrorsInString(value, path, errors);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => expectPlaceholderErrors(item, `${path}/${index}`, errors));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      expectPlaceholderErrors(child, `${path}/${escapePointer(key)}`, errors);
    }
  }
}

function placeholderErrors(object) {
  const errors = [];
  for (const field of ["outcomes", "anti_results"]) {
    const entries = object?.[field];
    if (!Array.isArray(entries)) continue;
    entries.forEach((entry, index) => {
      if (!entry || typeof entry !== "object") return;
      placeholderErrorsInString(entry.get, `/${field}/${index}/get`, errors);
      if (entry.expect !== undefined) {
        expectPlaceholderErrors(entry.expect, `/${field}/${index}/expect`, errors);
      }
    });
  }
  return errors;
}

export function validateSidecar(object, { contractId } = {}) {
  const ok = sidecarValidator(object);
  const errors = ok ? [] : schemaErrors(sidecarValidator);
  const placeholders = placeholderErrors(object);
  const sidecars = [];
  if (contractId !== undefined && object?.result !== contractId) {
    sidecars.push({
      code: "sidecar",
      path: "/result",
      message: `sidecar result ${object?.result ?? "(missing)"} does not match contract ${contractId}`,
    });
  }
  return {
    ok: ok && placeholders.length === 0 && sidecars.length === 0,
    errors: [...errors, ...placeholders, ...sidecars],
  };
}

export function validateContract(object) {
  const ok = contractValidator(object);
  const errors = ok ? [] : schemaErrors(contractValidator);
  const hidden = hiddenOracleErrors(object);
  return { ok: ok && hidden.length === 0, errors: [...errors, ...hidden] };
}

function readSidecar(sidecarPath) {
  let text;
  try {
    text = readFileSync(sidecarPath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      return {
        missing: {
          code: "sidecar",
          path: "/outcome",
          message: `missing sidecar: ${sidecarPath}`,
        },
      };
    }
    return {
      error: {
        code: "sidecar",
        path: "",
        message: `cannot read sidecar: ${sidecarPath}: ${error.message}`,
        sidecar: sidecarPath,
      },
    };
  }

  try {
    return { object: parse(text) };
  } catch (error) {
    return { error: { code: "yaml", path: "", message: error.message, sidecar: sidecarPath } };
  }
}

function missingOutcomeErrors(contract, sidecar, sidecarPath) {
  const entries = Array.isArray(sidecar?.outcomes) ? sidecar.outcomes : [];
  const present = new Set(
    entries.map((entry) => entry?.outcome).filter((index) => Number.isInteger(index)),
  );
  return (contract.outcome ?? [])
    .map((outcome, index) => ({ outcome, index }))
    .filter(({ outcome }) => outcome?.oracle !== undefined && outcome?.oracle !== null)
    .filter(({ index }) => !present.has(index))
    .map(({ index }) => ({
      code: "sidecar",
      path: `/outcome/${index}/oracle`,
      message: `missing sidecar entry for outcome ${index}`,
      sidecar: sidecarPath,
    }));
}

function sidecarIndexErrors(contract, sidecar, sidecarPath) {
  const errors = [];
  const outcomeCount = Array.isArray(contract.outcome) ? contract.outcome.length : 0;
  const antiResultCount = Array.isArray(contract.anti_results) ? contract.anti_results.length : 0;
  const outcomes = Array.isArray(sidecar?.outcomes) ? sidecar.outcomes : [];
  const antiResults = Array.isArray(sidecar?.anti_results) ? sidecar.anti_results : [];

  outcomes.forEach((entry, index) => {
    if (!entry || typeof entry !== "object") return;
    if (Number.isInteger(entry.outcome) && entry.outcome >= outcomeCount) {
      errors.push({
        code: "sidecar",
        path: `/outcomes/${index}/outcome`,
        message: `outcome index ${entry.outcome} is out of range (contract has ${outcomeCount})`,
        sidecar: sidecarPath,
      });
    }
  });

  antiResults.forEach((entry, index) => {
    if (!entry || typeof entry !== "object") return;
    if (Number.isInteger(entry.anti_result) && entry.anti_result >= antiResultCount) {
      errors.push({
        code: "sidecar",
        path: `/anti_results/${index}/anti_result`,
        message: `anti_result index ${entry.anti_result} is out of range (contract has ${antiResultCount})`,
        sidecar: sidecarPath,
      });
    }
  });

  return errors;
}

function browserSidecarErrors(file, contract) {
  if (contract?.witness?.kind !== "browser") return [];
  if (contract.hidden === true) return [];

  const outcomes = Array.isArray(contract.outcome) ? contract.outcome : [];
  const hasOracle = outcomes.some(
    (outcome) => outcome?.oracle !== undefined && outcome?.oracle !== null,
  );
  if (!hasOracle) return [];

  const sidecarPath = join(dirname(file), "oracles", `${contract.id}.oracles.yaml`);
  const loaded = readSidecar(sidecarPath);
  if (loaded.missing) return [loaded.missing];
  if (loaded.error) return [loaded.error];

  const sidecar = loaded.object;
  const validation = validateSidecar(sidecar, { contractId: contract.id });
  const errors = validation.errors.map((error) => ({ ...error, sidecar: sidecarPath }));
  errors.push(...missingOutcomeErrors(contract, sidecar, sidecarPath));
  errors.push(...sidecarIndexErrors(contract, sidecar, sidecarPath));
  return errors;
}

export function validateContractFile(file) {
  const loaded = loadYaml(file);
  if (loaded.error) return { ok: false, file, errors: [loaded.error] };

  const contract = loaded.object;
  const validation = validateContract(contract);
  const errors = [...validation.errors];
  if (validation.ok) errors.push(...browserSidecarErrors(file, contract));
  return { ok: errors.length === 0, file, errors };
}

export function validateSidecarFile(file) {
  const loaded = loadYaml(file);
  if (loaded.error) return { ok: false, file, errors: [loaded.error] };

  const { ok, errors } = validateSidecar(loaded.object);
  return { ok, file, errors };
}
