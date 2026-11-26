const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** centavos -> "R$ 49,90" */
export const money = (cents: number) => brl.format(cents / 100);

/** "R$ 49,90" | "49.90" | "49" -> 4990 (ou NaN) */
export function parseMoney(input: string): number {
  const clean = input.replace(/[^\d,.-]/g, "").trim();
  if (!clean) return NaN;
  // Formato brasileiro: ponto como milhar, vírgula como decimal
  const normalized = clean.includes(",") ? clean.replace(/\./g, "").replace(",", ".") : clean;
  const value = Number(normalized);
  return Number.isFinite(value) ? Math.round(value * 100) : NaN;
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0];
}

/** Aceita só http(s); devolve null para qualquer outra coisa. */
export function safeUrl(input: string | null | undefined): string | null {
  if (!input) return null;
  try {
    const url = new URL(input.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function storeFromUrl(url: string | null): string | null {
  if (!url) return null;
  const host = new URL(url).hostname.replace(/^www\./, "");
  if (host.includes("mercadolivre") || host.includes("mercadolibre")) return "Mercado Livre";
  if (host.includes("amazon")) return "Amazon";
  if (host.includes("shopee")) return "Shopee";
  if (host.includes("magazineluiza") || host.includes("magalu")) return "Magalu";
  if (host.includes("americanas")) return "Americanas";
  return host;
}

export function formatDate(iso: string | null) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
}

/** Dias até uma data "AAAA-MM-DD" (negativo se já passou), no fuso de São Paulo */
export function daysUntil(iso: string): number {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  return Math.round((Date.parse(iso) - Date.parse(today)) / 864e5);
}

export function countdownLabel(days: number): string {
  if (days < 0) return "Já aconteceu";
  if (days === 0) return "É hoje! 🎉";
  if (days === 1) return "É amanhã";
  return `Faltam ${days} dias`;
}

/** Cores de avatar determinísticas no tema natalino */
const AVATAR_TONES = [
  "bg-[#7a1f2b] text-[#f7efe3]",
  "bg-[#1f4d3a] text-[#f7efe3]",
  "bg-[#c9a227] text-[#1b2a22]",
  "bg-[#a33a3a] text-[#f7efe3]",
  "bg-[#2f6b52] text-[#f7efe3]",
  "bg-[#e8dcc4] text-[#1b2a22]",
];
export function avatarTone(seed: string) {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATAR_TONES[h % AVATAR_TONES.length];
}

const KEEP_S = new Set(["oculos", "tenis", "lapis", "onibus", "pires", "jeans", "gloss"]);
const plain = (w: string) => w.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Plural simples para singular: "Camisas" -> "Camisa", "Fones" -> "Fone" */
function singular(word: string) {
  const p = plain(word);
  if (word.length <= 4 || KEEP_S.has(p) || !p.endsWith("s") || /(ss|is|us)$/.test(p)) return word;
  if (/oes$/.test(p)) return word.slice(0, -3) + "ão";
  return word.slice(0, -1);
}

/**
 * Só "o que é" o produto, a partir do título da loja:
 * "Camisas masculinas de linho manga curta…" -> "Camisa de linho"
 * "Caneca Gel Flamengo Mengao…" -> "Caneca"
 */
export function shortTitle(title: string) {
  const words = title
    .replace(/[–—|,(].*$/, "")
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return title;
  const head = singular(words[0]);
  const out = [head.charAt(0).toUpperCase() + head.slice(1).toLowerCase()];
  // Complemento "de X" logo no começo: "de linho", "de porcelana", "de chás"
  const de = words.slice(1, 4).findIndex((w) => /^de$/i.test(w));
  const next = de >= 0 ? words[de + 2] : undefined;
  if (next && /^\p{L}/u.test(next)) out.push("de", next.toLowerCase());
  return out.join(" ");
}
