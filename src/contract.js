import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { validateContractFile } from "./validate.js";
import { parseOracle } from "../witnesses/cli/oracle.js";

function usage(code, message) {
  const error = new Error(message);
  error.code = code;
  error.usage = true;
  return error;
}

export function loadContract(contractPath) {
  const validation = validateContractFile(contractPath);
  if (!validation.ok) {
    const error = usage("contract", `invalid contract: ${contractPath}`);
    error.errors = validation.errors;
    throw error;
  }
  return parse(readFileSync(contractPath, "utf8"));
}

export function prepareOracles(contract) {
  const outcomes = contract.outcome ?? [];
  const oracleTexts = outcomes
    .filter((outcome) => outcome.oracle !== undefined && outcome.oracle !== null)
    .map((outcome) => outcome.oracle);
  const missingOracle = outcomes.some(
    (outcome) => outcome.oracle === undefined || outcome.oracle === null,
  );
  const parsedOracles = oracleTexts.map((text) => ({ text, parsed: parseOracle(text) }));
  const unsupported = parsedOracles.some(({ parsed }) => !parsed.supported);
  return {
    oracleTexts,
    parsedOracles,
    unobservable: missingOracle || parsedOracles.length === 0 || unsupported,
  };
}
