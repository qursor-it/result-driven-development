import { summarize } from "./evidence.js";

const DEFAULT_SUCCESS_RATE = 1;
const DEFAULT_MAX_INCONCLUSIVE_RATE = 0.1;

const RUN_BOUNDS = [
  { key: "max_steps", field: "steps" },
  { key: "max_memory_mb", field: "memory_mb" },
  { key: "serious_a11y_violations", field: "serious_a11y_violations" },
  { key: "max_errors", field: "errors" },
  { key: "max_lcp_ms", field: "lcp_ms" },
  { key: "max_cls", field: "cls" },
  { key: "max_inp_ms", field: "inp_ms" },
];

const KNOWN_KEYS = new Set([
  "runs",
  "success_rate",
  "p50_time_to_result_s",
  "p95_time_to_result_s",
  "max_steps",
  "max_memory_mb",
  "serious_a11y_violations",
  "max_errors",
  "max_lcp_ms",
  "max_cls",
  "max_inp_ms",
  "max_inconclusive_rate",
]);

function isNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function isConclusive(run) {
  return run.status === "success" || run.status === "failure";
}

function runNumber(run, index) {
  return run.n ?? index + 1;
}

function successRateMiss(summary, thresholds) {
  const limit = isNumber(thresholds.success_rate)
    ? thresholds.success_rate
    : DEFAULT_SUCCESS_RATE;
  if (!isNumber(summary.success_rate) || summary.success_rate >= limit) return [];

  return [`success_rate ${summary.success_rate} < ${limit}`];
}

function percentileMisses(summary, thresholds) {
  const misses = [];
  const unable = [];

  for (const key of ["p50_time_to_result_s", "p95_time_to_result_s"]) {
    if (!isNumber(thresholds[key])) continue;

    const value = summary[key];
    if (!isNumber(value)) {
      unable.push(`cannot evaluate ${key}: no successful timed runs`);
    } else if (value > thresholds[key]) {
      misses.push(`${key} ${value} > ${thresholds[key]}`);
    }
  }

  return { misses, unable };
}

function runBoundFindings(runs, thresholds) {
  const misses = [];
  const unable = [];

  for (const { key, field } of RUN_BOUNDS) {
    if (!isNumber(thresholds[key])) continue;

    let missing = null;
    runs.forEach((run, index) => {
      if (!isConclusive(run)) return;

      const value = run[field];
      if (!isNumber(value)) {
        if (missing === null) missing = { run, index };
      } else if (value > thresholds[key]) {
        misses.push(`${key}: run ${runNumber(run, index)} has ${value} > ${thresholds[key]}`);
      }
    });

    if (missing !== null) {
      const { run, index } = missing;
      unable.push(
        `cannot evaluate ${key}: run ${runNumber(run, index)} has no ${field}`,
      );
    }
  }

  return { misses, unable };
}

function unknownThresholdKeys(thresholds) {
  return Object.keys(thresholds)
    .filter((key) => !KNOWN_KEYS.has(key))
    .map((key) => `unknown threshold: ${key}`);
}

export function decide({ thresholds, runs, antiResults = [] }) {
  const summary = summarize(runs);
  const reasons = antiResults.map((anti) => `anti-result observed: ${anti}`);

  const runsShort =
    isNumber(thresholds.runs) && runs.length < thresholds.runs;
  if (runsShort) {
    reasons.push(`runs ${runs.length} < ${thresholds.runs}`);
  }

  const maxInconclusive = isNumber(thresholds.max_inconclusive_rate)
    ? thresholds.max_inconclusive_rate
    : DEFAULT_MAX_INCONCLUSIVE_RATE;
  const inconclusiveRate = summary.inconclusive_rate;
  const inconclusiveRateHigh =
    isNumber(inconclusiveRate) && inconclusiveRate > maxInconclusive;
  if (inconclusiveRateHigh) {
    reasons.push(`inconclusive_rate ${inconclusiveRate} > ${maxInconclusive}`);
  }

  const percentiles = percentileMisses(summary, thresholds);
  const bounds = runBoundFindings(runs, thresholds);
  const misses = [
    ...successRateMiss(summary, thresholds),
    ...percentiles.misses,
    ...bounds.misses,
  ];
  const unable = [
    ...percentiles.unable,
    ...bounds.unable,
    ...unknownThresholdKeys(thresholds),
  ];

  reasons.push(...misses, ...unable);

  let verdict = "observed";
  if (antiResults.length > 0) {
    verdict = "refuted";
  } else if (runsShort) {
    verdict = "inconclusive";
  } else if (inconclusiveRateHigh) {
    verdict = "inconclusive";
  } else if (misses.length > 0) {
    verdict = "refuted";
  } else if (unable.length > 0) {
    verdict = "inconclusive";
  }

  return { verdict, reasons };
}
