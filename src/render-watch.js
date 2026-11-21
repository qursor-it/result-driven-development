export function renderWatch(report) {
  const lines = [
    `now: ${report.now}`,
    `results: ${report.results}`,
    `ledger: ${report.ledger}`,
    `reopened: ${report.reopened.length > 0 ? report.reopened.join(", ") : "none"}`,
  ];

  if (report.contracts.length === 0) {
    lines.push("no contracts");
    return `${lines.join("\n")}\n`;
  }

  for (const entry of report.contracts) {
    lines.push("");
    const outcome = entry.verdict ?? (entry.error !== undefined ? "error" : "-");
    const reopened = entry.reopened ? "  reopened" : "";
    lines.push(`${entry.id}  ${entry.state}  ${outcome}  ${entry.last_at ?? "-"}${reopened}`);
    if (entry.error !== undefined) lines.push(`  error: ${entry.error}`);
  }

  return `${lines.join("\n")}\n`;
}
