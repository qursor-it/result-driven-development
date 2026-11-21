function diffLines(diff) {
  const lines = [];
  for (const [key, { added, removed }] of Object.entries(diff)) {
    const parts = [
      ...added.map((value) => `+${value}`),
      ...removed.map((value) => `-${value}`),
    ];
    lines.push(`  capability ${key}: ${parts.join(" ")}`);
  }
  return lines;
}

export function renderGate(report) {
  const lines = [
    `decision: ${report.decision}`,
    `base: ${report.base}`,
    `head: ${report.head}`,
    `changed: ${report.changed.length}`,
  ];

  if (report.contracts.length === 0) {
    lines.push("no contracts");
    return `${lines.join("\n")}\n`;
  }

  for (const entry of report.contracts) {
    const outcome = entry.verdict ?? entry.error ?? "unknown";
    const reasons = entry.reasons.length > 0 ? entry.reasons.join(", ") : "-";
    lines.push("");
    lines.push(`${entry.id ?? entry.path}  ${outcome}  ${reasons}`);
    if (entry.error !== undefined && entry.message !== undefined) {
      lines.push(`  error: ${entry.message}`);
    }
    lines.push(...diffLines(entry.capability_diff));
    for (const use of entry.undeclared_uses) {
      lines.push(`  undeclared ${use.key}: ${use.value}`);
    }
  }

  return `${lines.join("\n")}\n`;
}
