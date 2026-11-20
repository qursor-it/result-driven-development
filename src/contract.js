import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { validateContractFile } from "./validate.js";
import { parseOracle } from "../witnesses/cli/oracle.js";

const DEFAULT_HIDDEN_DIR = fileURLToPath(new URL("../witnesses/hidden/", import.meta.url));

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

function buildOracles(oracleTexts, unobservable) {
  const parsedOracles = oracleTexts.map((text) => ({ text, parsed: parseOracle(text) }));
  const unsupported = parsedOracles.some(({ parsed }) => !parsed.supported);
  return {
    oracleTexts,
    parsedOracles,
    unobservable: unobservable || parsedOracles.length === 0 || unsupported,
  };
}

function hiddenOutcomes(contract, hiddenDir) {
  const dir = hiddenDir ?? process.env.RDD_HIDDEN_DIR ?? DEFAULT_HIDDEN_DIR;
  const file = join(dir, `${contract.id}.oracles.yaml`);

  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      return { missingHidden: file };
    }
    throw usage("hidden", `cannot read hidden oracles: ${file}: ${error.message}`);
  }

  let hidden;
  try {
    hidden = parse(text);
  } catch (error) {
    throw usage("hidden", `invalid hidden oracles: ${file}: ${error.message}`);
  }

  if (!hidden || hidden.id !== contract.id) {
    throw usage("hidden", `hidden oracle id mismatch: ${file}`);
  }

  const outcomes = hidden.outcome;
  const expected = contract.outcome ?? [];
  if (!Array.isArray(outcomes) || outcomes.length !== expected.length) {
    throw usage("hidden", `hidden oracle outcome count mismatch: ${file}`);
  }

  return { outcomes };
}

export function prepareOracles(contract, { hiddenDir } = {}) {
  if (contract.hidden === true) {
    const loaded = hiddenOutcomes(contract, hiddenDir);
    if (loaded.missingHidden) {
      return {
        oracleTexts: [],
        parsedOracles: [],
        unobservable: true,
        missingHidden: loaded.missingHidden,
      };
    }

    const anchors = loaded.outcomes.map((outcome) => outcome?.oracle);
    const missingOracle = anchors.some((oracle) => oracle === undefined || oracle === null);
    const oracleTexts = anchors.filter((oracle) => oracle !== undefined && oracle !== null);
    return buildOracles(oracleTexts, missingOracle);
  }

  const outcomes = contract.outcome ?? [];
  const oracleTexts = outcomes
    .filter((outcome) => outcome.oracle !== undefined && outcome.oracle !== null)
    .map((outcome) => outcome.oracle);
  const missingOracle = outcomes.some(
    (outcome) => outcome.oracle === undefined || outcome.oracle === null,
  );
  return buildOracles(oracleTexts, missingOracle);
}
