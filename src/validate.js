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

export function validateContract(object) {
  const ok = contractValidator(object);
  return { ok, errors: ok ? [] : schemaErrors() };
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
