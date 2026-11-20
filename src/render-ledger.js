function sinceLine(entries) {
  if (entries.length === 0) return "not observed";

  let index = entries.length - 1;
  if (entries[index].verdict !== "observed") return "not observed";

  while (index > 0 && entries[index - 1].verdict === "observed") {
    index -= 1;
  }

  return `since ${entries[index].at}`;
}

export function renderLedger(entries) {
  const lines = entries.map(
    (entry) =>
      `${entry.at}  ${entry.verdict}  ${entry.bundle_sha256.slice(0, 12)}  ${entry.witness}`,
  );
  lines.push(sinceLine(entries));
  return `${lines.join("\n")}\n`;
}
