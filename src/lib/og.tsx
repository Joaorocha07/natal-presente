import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/** Fontes do site (Fraunces nos títulos, Inter no resto), embutidas para a imagem */
const FONT_DIR = join(process.cwd(), "src/assets/og-fonts");
type OgFonts = NonNullable<NonNullable<ConstructorParameters<typeof ImageResponse>[1]>["fonts"]>;
let fontsCache: Promise<OgFonts> | null = null;
function loadFonts() {
  fontsCache ??= Promise.all([
    readFile(join(FONT_DIR, "fraunces-latin-600-normal.woff")),
    readFile(join(FONT_DIR, "fraunces-latin-600-italic.woff")),
    readFile(join(FONT_DIR, "inter-latin-500-normal.woff")),
    readFile(join(FONT_DIR, "inter-latin-700-normal.woff")),
  ]).then(([fr, frI, in5, in7]): OgFonts => [
    { name: "Fraunces", data: fr, weight: 600 as const, style: "normal" as const },
    { name: "Fraunces", data: frI, weight: 600 as const, style: "italic" as const },
    { name: "Inter", data: in5, weight: 500 as const, style: "normal" as const },
    { name: "Inter", data: in7, weight: 700 as const, style: "normal" as const },
  ]);
  return fontsCache;
}

/** Tamanho padrão de prévia (WhatsApp, Facebook, X, Telegram) */
export const OG_SIZE = { width: 1200, height: 630 };

const C = {
  bg1: "#2a5244",
  bg2: "#10211b",
  cream: "#f5eadb",
  gold: "#d9a55a",
  goldSoft: "#ecc98f",
  copper: "#c4623d",
  copperDark: "#85391f",
  pine: "#2f6b52",
  pineDark: "#1f4d3a",
  pineDeep: "#173028",
};

/** Flocos em posições fixas (a imagem sai sempre igual) */
const SNOW = [
  [60, 40, 3], [180, 120, 2], [320, 60, 3], [470, 30, 2], [540, 140, 2], [90, 260, 2], [250, 330, 3],
  [430, 250, 2], [600, 80, 3], [700, 200, 2], [1150, 60, 3], [1090, 170, 2], [1170, 300, 2], [660, 560, 2],
  [40, 520, 3], [380, 580, 2], [1120, 560, 3], [760, 40, 2], [520, 420, 2], [150, 430, 2],
] as const;

/** Árvore de Natal com bolas, pisca-pisca e presentes na base */
function TreeScene() {
  return (
    <svg width="520" height="560" viewBox="0 0 520 560">
      <defs>
        <linearGradient id="leaf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3f8566" />
          <stop offset="1" stopColor={C.pineDark} />
        </linearGradient>
        <radialGradient id="glow" cx="0.5" cy="0.45" r="0.5">
          <stop offset="0" stopColor={C.goldSoft} stopOpacity="0.35" />
          <stop offset="1" stopColor={C.goldSoft} stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="260" cy="250" r="250" fill="url(#glow)" />

      {/* chão de neve */}
      <ellipse cx="260" cy="522" rx="235" ry="30" fill={C.cream} opacity="0.95" />

      {/* tronco */}
      <rect x="236" y="420" width="48" height="60" rx="6" fill="#6b4226" />

      {/* camadas da árvore */}
      <path d="M260 70 L120 250 L400 250 Z" fill="url(#leaf)" />
      <path d="M260 150 L90 345 L430 345 Z" fill="url(#leaf)" />
      <path d="M260 240 L60 440 L460 440 Z" fill="url(#leaf)" />

      {/* pisca-pisca (fios dourados) */}
      <path d="M170 215 Q260 265 355 210" stroke={C.goldSoft} strokeWidth="4" fill="none" opacity="0.85" />
      <path d="M135 310 Q260 375 390 305" stroke={C.goldSoft} strokeWidth="4" fill="none" opacity="0.85" />
      <path d="M105 405 Q260 470 420 400" stroke={C.goldSoft} strokeWidth="4" fill="none" opacity="0.85" />

      {/* bolas */}
      {[
        [205, 232, 13, C.copper], [300, 238, 12, C.gold], [255, 180, 10, C.cream],
        [165, 325, 14, C.gold], [255, 345, 13, C.copper], [350, 322, 14, C.cream],
        [140, 420, 15, C.copper], [215, 437, 13, C.cream], [305, 440, 15, C.gold], [385, 412, 14, C.copper],
      ].map(([x, y, r, fill], i) => (
        <g key={i}>
          <circle cx={x as number} cy={y as number} r={r as number} fill={fill as string} />
          <circle cx={(x as number) - (r as number) / 3} cy={(y as number) - (r as number) / 3} r={(r as number) / 3.2} fill="#ffffff" opacity="0.55" />
        </g>
      ))}

      {/* estrela */}
      <path
        d="M260 18 L272 52 L308 53 L279 74 L290 108 L260 88 L230 108 L241 74 L212 53 L248 52 Z"
        fill={C.goldSoft}
        stroke={C.gold}
        strokeWidth="3"
      />

      {/* presentes */}
      <rect x="60" y="440" width="120" height="86" rx="10" fill={C.copper} />
      <rect x="60" y="440" width="120" height="22" rx="8" fill={C.copperDark} opacity="0.35" />
      <rect x="111" y="440" width="18" height="86" fill={C.goldSoft} />
      <ellipse cx="104" cy="432" rx="20" ry="12" fill={C.goldSoft} />
      <ellipse cx="136" cy="432" rx="20" ry="12" fill={C.goldSoft} />

      <rect x="330" y="455" width="130" height="72" rx="10" fill={C.cream} />
      <rect x="386" y="455" width="18" height="72" fill={C.copper} />
      <rect x="330" y="482" width="130" height="16" fill={C.copper} />
      <ellipse cx="379" cy="448" rx="19" ry="11" fill={C.copper} />
      <ellipse cx="411" cy="448" rx="19" ry="11" fill={C.copper} />

      <rect x="200" y="470" width="96" height="58" rx="9" fill={C.pine} />
      <rect x="240" y="470" width="16" height="58" fill={C.gold} />
      <ellipse cx="236" cy="463" rx="16" ry="9" fill={C.gold} />
      <ellipse cx="260" cy="463" rx="16" ry="9" fill={C.gold} />
    </svg>
  );
}

/**
 * Imagem de prévia com a árvore de Natal e o texto da página.
 * `chips` aparecem como etiquetas embaixo (ex.: valor e data do grupo).
 */
export async function renderOg({
  eyebrow = "Amigo Oculto · Natal 2026",
  title,
  accent,
  subtitle,
  chips = [],
}: {
  eyebrow?: string;
  title: string;
  /** trecho em dourado depois do título */
  accent?: string;
  subtitle?: string;
  chips?: string[];
}) {
  const long = Math.max(title.length, accent?.length ?? 0) > 22;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: `linear-gradient(160deg, ${C.bg1} 0%, ${C.pineDeep} 55%, ${C.bg2} 100%)`,
          color: C.cream,
          fontFamily: "Inter",
        }}
      >
        {/* neve só fora da área do texto, para não sujar as letras */}
        {SNOW.filter(([x, y]) => x > 640 || y < 60 || y > 590).map(([x, y, r], i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: r * 2,
              height: r * 2,
              borderRadius: 999,
              background: "#ffffff",
              opacity: 0.55,
            }}
          />
        ))}

        {/* texto */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 0 0 72px", width: 650 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                display: "flex",
                width: 52,
                height: 52,
                borderRadius: 999,
                background: C.copper,
                alignItems: "center",
                justifyContent: "center",
                border: `2px solid ${C.goldSoft}`,
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill={C.cream}>
                <path d="M12 2 9.5 7h5L12 2Zm0 4L7 13h10l-5-7Zm0 5-6.5 9h13L12 11Z" />
              </svg>
            </div>
            <div style={{ fontSize: 22, letterSpacing: 3.5, textTransform: "uppercase", color: C.goldSoft, fontWeight: 700 }}>
              {eyebrow}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 28,
              fontFamily: "Fraunces",
              fontSize: long ? 56 : 66,
              lineHeight: 1.06,
              fontWeight: 600,
              letterSpacing: -1.5,
            }}
          >
            <span>{title}</span>
            {accent && <span style={{ color: C.goldSoft, fontStyle: "italic" }}>{accent}</span>}
          </div>

          {subtitle && (
            <div style={{ marginTop: 24, fontSize: 28, lineHeight: 1.4, fontWeight: 500, color: "rgba(245,234,219,0.78)", display: "flex" }}>
              {subtitle}
            </div>
          )}

          {chips.length > 0 && (
            <div style={{ display: "flex", gap: 12, marginTop: 34, flexWrap: "wrap" }}>
              {chips.map((c) => (
                <div
                  key={c}
                  style={{
                    display: "flex",
                    padding: "10px 22px",
                    borderRadius: 999,
                    fontSize: 26,
                    fontWeight: 700,
                    background: C.cream,
                    color: "#2b211d",
                    boxShadow: `0 5px 0 #d5bf9e`,
                  }}
                >
                  {c}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* árvore */}
        <div style={{ display: "flex", position: "absolute", right: 30, bottom: 10 }}>
          <TreeScene />
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await loadFonts() },
  );
}
