import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { mercadoLivreToken } from "./products";

export type ProductPreview = {
  title: string | null;
  price: number | null; // centavos
  /** todas as fotos encontradas, a principal primeiro (até 8) */
  images: string[];
};

const MAX_IMAGES = 8;
const MAX_BYTES = 1_500_000;

/** Bloqueia endereços internos (o servidor não deve buscar a própria rede) */
function isPrivateIp(ip: string) {
  if (isIP(ip) === 6) {
    const v = ip.toLowerCase();
    return v === "::1" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80") || v.startsWith("::ffff:");
  }
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 10 || a === 127 || a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127)
  );
}

async function assertPublicHost(url: URL) {
  const addrs = await lookup(url.hostname, { all: true });
  if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) throw new Error("Endereço não permitido");
}

/** Lê o HTML aos poucos e para no limite de tamanho */
async function readLimited(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (size < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    size += value.length;
  }
  await reader.cancel().catch(() => {});
  return new TextDecoder().decode(Buffer.concat(chunks));
}

const decode = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim();

function meta(html: string, ...names: string[]): string | null {
  for (const name of names) {
    const esc = name.replace(/[:.]/g, "\\$&");
    const re1 = new RegExp(`<meta[^>]+(?:property|name|itemprop)=["']${esc}["'][^>]*content=["']([^"']+)["']`, "i");
    const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name|itemprop)=["']${esc}["']`, "i");
    const m = html.match(re1) ?? html.match(re2);
    if (m?.[1]) return decode(m[1]);
  }
  return null;
}

/** "1.234,56" | "1234.56" | 1234.56 -> centavos */
function toCents(v: unknown): number | null {
  if (typeof v === "number") return v > 0 ? Math.round(v * 100) : null;
  if (typeof v !== "string") return null;
  const clean = v.replace(/[^\d.,]/g, "");
  if (!clean) return null;
  const lastSep = Math.max(clean.lastIndexOf(","), clean.lastIndexOf("."));
  const decimals = lastSep >= 0 ? clean.length - lastSep - 1 : 0;
  const normalized =
    lastSep >= 0 && decimals <= 2
      ? clean.slice(0, lastSep).replace(/[.,]/g, "") + "." + clean.slice(lastSep + 1)
      : clean.replace(/[.,]/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null;
}

type Json = Record<string, unknown>;

/** Procura um objeto schema.org Product nos blocos JSON-LD */
function jsonLdProduct(html: string): Json | null {
  const blocks = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  const stack: unknown[] = [];
  for (const b of blocks) {
    try {
      stack.push(JSON.parse(b[1].trim()));
    } catch {
      /* bloco inválido: ignora */
    }
  }
  while (stack.length) {
    const node = stack.pop();
    if (Array.isArray(node)) stack.push(...node);
    else if (node && typeof node === "object") {
      const o = node as Json;
      const type = o["@type"];
      if (type === "Product" || (Array.isArray(type) && type.includes("Product"))) return o;
      if (o["@graph"]) stack.push(o["@graph"]);
    }
  }
  return null;
}

function offerPrice(product: Json): number | null {
  const offers = product.offers;
  const list = (Array.isArray(offers) ? offers : [offers]) as (Json | undefined)[];
  for (const o of list) {
    if (!o) continue;
    const p = toCents(o.price ?? o.lowPrice ?? (o.priceSpecification as Json | undefined)?.price);
    if (p) return p;
  }
  return null;
}

function allImages(v: unknown): string[] {
  if (typeof v === "string") return [v];
  if (Array.isArray(v)) return v.flatMap(allImages);
  if (v && typeof v === "object") return allImages((v as Json).url ?? (v as Json).contentUrl);
  return [];
}

/** Todas as metatags com um dos nomes (og:image pode aparecer várias vezes) */
function metaAll(html: string, ...names: string[]): string[] {
  const out: string[] = [];
  for (const tag of html.match(/<meta[^>]+>/gi) ?? []) {
    const name = tag.match(/(?:property|name|itemprop)=["']([^"']+)["']/i)?.[1]?.toLowerCase();
    const content = tag.match(/content=["']([^"']+)["']/i)?.[1];
    if (name && content && names.includes(name)) out.push(decode(content));
  }
  return out;
}

function uniqueImages(list: (string | null | undefined)[], base?: URL): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const src of list) {
    const abs = base ? absolute(src ?? null, base) : src;
    if (!abs || seen.has(abs) || /\.svg(\?|$)/i.test(abs)) continue;
    seen.add(abs);
    out.push(abs);
    if (out.length >= MAX_IMAGES) break;
  }
  return out;
}

function absolute(src: string | null, base: URL): string | null {
  if (!src) return null;
  try {
    const u = new URL(src, base);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Mercado Livre bloqueia leitura da página: usa a API oficial (precisa de ML_CLIENT_ID/SECRET).
 * Links de catálogo (/p/MLB123) vão para /products; anúncios (MLB-123-…) para /items.
 */
async function mercadoLivrePreview(url: URL): Promise<ProductPreview | null> {
  if (!/mercadoli[vb]re\.com/.test(url.hostname)) return null;
  const token = await mercadoLivreToken();
  if (!token) return null;
  const headers = { authorization: `Bearer ${token}` };
  const catalog = url.pathname.match(/\/p\/(MLB\d+)/i)?.[1];
  const item = url.href.match(/MLB-?(\d{6,})/i)?.[1];

  if (catalog) {
    const res = await fetch(`https://api.mercadolibre.com/products/${catalog}`, { headers, signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const p = (await res.json()) as { name?: string; pictures?: { url: string }[]; buy_box_winner?: { price?: number } };
      return {
        title: p.name ?? null,
        price: toCents(p.buy_box_winner?.price),
        images: uniqueImages((p.pictures ?? []).map((x) => x.url?.replace(/^http:/, "https:"))),
      };
    }
  }
  if (item) {
    const res = await fetch(`https://api.mercadolibre.com/items/MLB${item}`, { headers, signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const i = (await res.json()) as { title?: string; price?: number; pictures?: { secure_url: string }[] };
      return {
        title: i.title ?? null,
        price: toCents(i.price),
        images: uniqueImages((i.pictures ?? []).map((x) => x.secure_url)),
      };
    }
  }
  return null;
}

/** Títulos que são só o nome da loja (página de bloqueio ou captcha) não servem */
function cleanTitle(t: string | null): string | null {
  if (!t) return null;
  const s = t.replace(/\s*[|\-–]\s*(Amazon\.com\.br|Mercado Livre|Magazine Luiza|Magalu|Shopee Brasil|Americanas)\s*$/i, "").trim();
  if (/^(mercado li[vb]re|amazon(\.com\.br)?|magalu|shopee|robot check|access denied|attention required)/i.test(s)) return null;
  return s || null;
}

/** Lê nome, preço e foto da página de um produto (JSON-LD, Open Graph e metatags) */
export async function fetchProductPreview(rawUrl: string): Promise<ProductPreview> {
  let url = new URL(rawUrl);
  const ml = await mercadoLivrePreview(url).catch(() => null);
  if (ml) return ml;

  // Segue redirecionamentos manualmente para validar cada destino
  let res: Response | null = null;
  for (let hop = 0; hop < 4; hop++) {
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Link inválido");
    await assertPublicHost(url);
    res = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
        accept: "text/html,application/xhtml+xml",
        "accept-language": "pt-BR,pt;q=0.9",
      },
    });
    const next = res.status >= 300 && res.status < 400 ? res.headers.get("location") : null;
    if (!next) break;
    url = new URL(next, url);
  }
  if (!res || !res.ok) throw new Error(`A loja respondeu ${res?.status ?? "sem resposta"}`);

  const html = await readLimited(res);
  const product = jsonLdProduct(html);

  const title =
    (typeof product?.name === "string" ? decode(product.name) : null) ??
    meta(html, "og:title", "twitter:title") ??
    (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ? decode(html.match(/<title[^>]*>([^<]+)<\/title>/i)![1]) : null);

  const price =
    (product && offerPrice(product)) ??
    toCents(meta(html, "product:price:amount", "og:price:amount", "price", "twitter:data1"));

  const images = uniqueImages(
    [
      ...allImages(product?.image),
      ...metaAll(html, "og:image", "og:image:secure_url", "og:image:url", "twitter:image", "image"),
    ],
    url,
  );

  return { title: cleanTitle(title)?.slice(0, 140) ?? null, price, images };
}
