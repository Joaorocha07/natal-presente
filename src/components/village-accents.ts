export const ACCENTS = {
  cobre: { label: "Cobre", color: "#c4623d" },
  dourado: { label: "Dourado", color: "#d9a55a" },
  verde: { label: "Verde", color: "#4f8a6d" },
  creme: { label: "Creme", color: "#f1e4d0" },
} as const;

export type AccentKey = keyof typeof ACCENTS;
