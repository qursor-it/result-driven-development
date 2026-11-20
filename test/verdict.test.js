import { test } from "node:test";
import assert from "node:assert/strict";
import { decide } from "../src/verdict.js";

function makeRuns({
  success = 0,
  failure = 0,
  inconclusive = 0,
  time = 1,
  steps,
  memoryMb,
  a11y,
} = {}) {
  const runs = [];
  let n = 1;

  const add = (status) => {
    const run = { n: n++, status };
    if (status === "success") {
      run.time_to_result_s = typeof time === "function" ? time(run.n) : time;
    }
    for (const [field, value] of [
      ["steps", steps],
      ["memory_mb", memoryMb],
      ["serious_a11y_violations", a11y],
    ]) {
      if (value === undefined) continue;
      run[field] = typeof value === "function" ? value(run.n) : value;
    }
    runs.push(run);
  };

  for (let i = 0; i < success; i++) add("success");
  for (let i = 0; i < failure; i++) add("failure");
  for (let i = 0; i < inconclusive; i++) add("inconclusive");
  return runs;
}

const cases = [
  {
    name: "all good → observed",
    thresholds: { runs: 20 },
    runs: makeRuns({ success: 20 }),
    verdict: "observed",
    reasonsInclude: [],
  },
  {
    name: "success below the default 1.0 → refuted",
    thresholds: { runs: 20 },
    runs: makeRuns({ success: 18, failure: 2 }),
    verdict: "refuted",
    reasonsInclude: ["success_rate 0.9 < 1"],
  },
  {
    name: "success_rate 0.95 met with 19/20 → observed",
    thresholds: { runs: 20, success_rate: 0.95 },
    runs: makeRuns({ success: 19, failure: 1 }),
    verdict: "observed",
    reasonsInclude: [],
  },
  {
    name: "success_rate 0.95 missed with 18/20 → refuted",
    thresholds: { runs: 20, success_rate: 0.95 },
    runs: makeRuns({ success: 18, failure: 2 }),
    verdict: "refuted",
    reasonsInclude: ["success_rate 0.9 < 0.95"],
  },
  {
    name: "too few runs → inconclusive",
    thresholds: { runs: 20 },
    runs: makeRuns({ success: 3 }),
    verdict: "inconclusive",
    reasonsInclude: ["runs 3 < 20"],
  },
  {
    name: "inconclusive rate 0.15 exceeds the default → inconclusive",
    thresholds: { runs: 20 },
    runs: makeRuns({ success: 17, inconclusive: 3 }),
    verdict: "inconclusive",
    reasonsInclude: ["inconclusive_rate 0.15 > 0.1"],
  },
  {
    name: "inconclusive rate exactly 0.10 → observed",
    thresholds: { runs: 20 },
    runs: makeRuns({ success: 18, inconclusive: 2 }),
    verdict: "observed",
    reasonsInclude: [],
  },
  {
    name: "custom max_inconclusive_rate → observed",
    thresholds: { runs: 20, max_inconclusive_rate: 0.2 },
    runs: makeRuns({ success: 17, inconclusive: 3 }),
    verdict: "observed",
    reasonsInclude: [],
  },
  {
    name: "anti-result with otherwise perfect runs → refuted",
    thresholds: { runs: 20 },
    runs: makeRuns({ success: 20 }),
    antiResults: ["writes any file"],
    verdict: "refuted",
    reasonsInclude: ["anti-result observed: writes any file"],
  },
  {
    name: "anti-result plus too few runs → refuted by rule 1",
    thresholds: { runs: 20 },
    runs: makeRuns({ success: 3 }),
    antiResults: ["writes any file"],
    verdict: "refuted",
    reasonsInclude: ["anti-result observed: writes any file", "runs 3 < 20"],
  },
  {
    name: "p50 exceeded → refuted",
    thresholds: { runs: 20, p50_time_to_result_s: 1 },
    runs: makeRuns({ success: 20, time: 2 }),
    verdict: "refuted",
    reasonsInclude: ["p50_time_to_result_s 2 > 1"],
  },
  {
    name: "p95 exceeded → refuted",
    thresholds: { runs: 20, p95_time_to_result_s: 2 },
    runs: makeRuns({ success: 20, time: 2.5 }),
    verdict: "refuted",
    reasonsInclude: ["p95_time_to_result_s 2.5 > 2"],
  },
  {
    name: "p95 met exactly → observed",
    thresholds: { runs: 20, p95_time_to_result_s: 2.5 },
    runs: makeRuns({ success: 20, time: 2.5 }),
    verdict: "observed",
    reasonsInclude: [],
  },
  {
    name: "p50 has no successful timed runs → inconclusive",
    thresholds: { runs: 20, p50_time_to_result_s: 1 },
    runs: makeRuns({ success: 20, time: null }),
    verdict: "inconclusive",
    reasonsInclude: ["cannot evaluate p50_time_to_result_s: no successful timed runs"],
  },
  {
    name: "max_steps exceeded → refuted",
    thresholds: { runs: 20, max_steps: 8 },
    runs: makeRuns({ success: 20, steps: (n) => (n === 4 ? 9 : 1) }),
    verdict: "refuted",
    reasonsInclude: ["max_steps: run 4 has 9 > 8"],
  },
  {
    name: "serious_a11y_violations exceeded → refuted",
    thresholds: { runs: 20, serious_a11y_violations: 0 },
    runs: makeRuns({ success: 20, a11y: (n) => (n === 2 ? 3 : 0) }),
    verdict: "refuted",
    reasonsInclude: ["serious_a11y_violations: run 2 has 3 > 0"],
  },
  {
    name: "max_memory_mb missing on runs → inconclusive",
    thresholds: { runs: 20, max_memory_mb: 100 },
    runs: makeRuns({ success: 20 }),
    verdict: "inconclusive",
    reasonsInclude: ["cannot evaluate max_memory_mb: run 1 has no memory_mb"],
  },
  {
    name: "unknown threshold key → inconclusive",
    thresholds: { runs: 20, foo: 1 },
    runs: makeRuns({ success: 20 }),
    verdict: "inconclusive",
    reasonsInclude: ["unknown threshold: foo"],
  },
  {
    name: "refuted miss plus unmeasured metric → refuted with both reasons",
    thresholds: { runs: 20, success_rate: 0.95, max_memory_mb: 100 },
    runs: makeRuns({ success: 18, failure: 2 }),
    verdict: "refuted",
    reasonsInclude: [
      "success_rate 0.9 < 0.95",
      "cannot evaluate max_memory_mb: run 1 has no memory_mb",
    ],
  },
  {
    name: "empty runs → inconclusive",
    thresholds: { runs: 20 },
    runs: [],
    verdict: "inconclusive",
    reasonsInclude: ["runs 0 < 20"],
  },
];

for (const testCase of cases) {
  test(testCase.name, () => {
    const { verdict, reasons } = decide({
      thresholds: testCase.thresholds,
      runs: testCase.runs,
      antiResults: testCase.antiResults,
    });

    assert.equal(verdict, testCase.verdict);
    if (testCase.verdict === "observed") {
      assert.deepEqual(reasons, []);
    }
    for (const expected of testCase.reasonsInclude) {
      assert.ok(
        reasons.includes(expected),
        `expected reasons to include ${JSON.stringify(expected)}, got ${JSON.stringify(reasons)}`,
      );
    }
  });
}
