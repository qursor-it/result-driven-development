function idLines(ids) {
  return ids.length === 0 ? ["  none"] : ids.map((id) => `  ${id}`);
}

function timeLines(results) {
  const entries = Object.entries(results);
  if (entries.length === 0) return ["  none"];
  return entries.map(([id, hours]) => `  ${id}  ${hours === null ? "unknown" : `${hours} h`}`);
}

export function renderReport(report) {
  const accepted = report.accepted_without_code_review;
  const regressions = report.regressions_found_by_watch;
  const time = report.time_to_acceptance_h;

  const lines = [
    `monthly report: ${report.month}`,
    `accepted without code review: ${accepted.count}`,
    ...idLines(accepted.results),
    `regressions found by watch: ${regressions.count}`,
    ...idLines(regressions.results),
    `time to acceptance p50: ${time.p50 === null ? "unknown" : `${time.p50} h`}`,
    ...timeLines(time.results),
  ];

  return `${lines.join("\n")}\n`;
}
