import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { compileSchemas } from "./schemas.js";

const { contract: contractValidator } = compileSchemas();

function schemaErrors() {
  return (contractValidator.errors ?? []).map((error) => ({
    code: "schema",
    path: error.instancePath ?? "",
    message: error.message ?? "invalid",
  }));
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

export function validateContract(object) {
  const ok = contractValidator(object);
  const errors = ok ? [] : schemaErrors();
  const hidden = hiddenOracleErrors(object);
  return { ok: ok && hidden.length === 0, errors: [...errors, ...hidden] };
}

export function validateContractFile(file) {
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch (error) {
    return { ok: false, file, errors: [{ code: "io", path: "", message: error.message }] };
  }

  let contract;
  try {
    contract = parse(text);
  } catch (error) {
    return { ok: false, file, errors: [{ code: "yaml", path: "", message: error.message }] };
  }

  const { ok, errors } = validateContract(contract);
  return { ok, file, errors };
}
