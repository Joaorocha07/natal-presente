import type { Metadata } from "next";

export const SITE_NAME = "Amigo Oculto";

/**
 * URL pública do site (prévias do WhatsApp precisam de link absoluto).
 * Configure NEXT_PUBLIC_SITE_URL em produção, ex.: https://amigo-oculto.vercel.app
 */
export function siteUrl(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/**
 * Título e descrição da página, repetidos nas tags que o WhatsApp e as redes leem.
 * A imagem é explícita: o openGraph da página substitui o do layout por inteiro.
 */
export function pageMeta(
  title: string,
  description: string,
  extra: Metadata = {},
  image = "/opengraph-image",
): Metadata {
  const images = [{ url: image, width: 1200, height: 630, alt: "Árvore de Natal com presentes · Amigo Oculto" }];
  return {
    title,
    description,
    openGraph: {
      title: `${title} · ${SITE_NAME}`,
      description,
      siteName: SITE_NAME,
      locale: "pt_BR",
      type: "website",
      images,
    },
    twitter: { card: "summary_large_image", title: `${title} · ${SITE_NAME}`, description, images },
    ...extra,
  };
}

/** Páginas da conta: prévia bonita no link, mas fora dos buscadores */
export const PRIVATE: Metadata = { robots: { index: false, follow: false } };
