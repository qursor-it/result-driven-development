const WITNESSES = new Map([
  ["cli", () => import("../witnesses/cli/index.js")],
  ["aleph", () => import("../witnesses/aleph/index.js")],
  ["browser", () => import("../witnesses/browser/index.js")],
]);

export function loadWitness(kind) {
  const loader = WITNESSES.get(kind);
  return loader ? loader() : undefined;
}
