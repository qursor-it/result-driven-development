import { test } from "node:test";
import assert from "node:assert/strict";
import { compileSchemas } from "../src/schemas.js";

const { contract, evidence } = compileSchemas();

const validContract = {
  id: "R-001",
  version: 1,
  intent: "The user can list projects.",
  actor: "developer",
  given: "an empty database",
  outcome: [{ text: "one project is returned", oracle: "GET /api/projects returns 1 item" }],
  thresholds: { runs: 20 },
  capabilities: {},
  witness: { kind: "cli" },
};

const validEvidence = {
  result: "R-001",
  contract_sha256: "a".repeat(64),
  build: { sha256: "b".repeat(64) },
  witness: { kind: "cli", version: "0.1.0" },
  verdict: "observed",
  runs: [],
  summary: {},
  at: "2026-11-20T12:00:00Z",
};

test("both schemas compile", () => {
  assert.equal(typeof contract, "function");
  assert.equal(typeof evidence, "function");
});

test("a minimal valid contract passes", () => {
  assert.equal(contract(validContract), true, JSON.stringify(contract.errors));
});

test("a contract missing intent fails", () => {
  const { intent, ...withoutIntent } = validContract;
  assert.equal(contract(withoutIntent), false);
});

test("a minimal valid evidence bundle passes", () => {
  assert.equal(evidence(validEvidence), true, JSON.stringify(evidence.errors));
});

test("an evidence bundle with verdict maybe fails", () => {
  assert.equal(evidence({ ...validEvidence, verdict: "maybe" }), false);
});

test("an evidence bundle with a bad at fails", () => {
  assert.equal(evidence({ ...validEvidence, at: "not-a-date" }), false);
});
