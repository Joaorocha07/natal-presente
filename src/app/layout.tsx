import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { Snow } from "@/components/snow";
import "./globals.css";
import { SITE_NAME, siteUrl } from "@/lib/seo";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "opsz"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  applicationName: SITE_NAME,
  openGraph: {
    siteName: SITE_NAME,
    locale: "pt_BR",
    type: "website",
    title: "Amigo Oculto · Presentes de Natal",
    description:
      "Crie seu grupo de amigo oculto, defina o valor e veja a lista de desejos de cada participante. Sem presente errado neste Natal.",
  },
  twitter: { card: "summary_large_image" },
  title: {
    default: "Amigo Oculto · Presentes de Natal",
    template: "%s · Amigo Oculto",
  },
  description:
    "Crie seu grupo de amigo oculto, defina o valor e veja a lista de desejos de cada participante. Sem presente errado neste Natal.",
};

export const viewport: Viewport = {
  themeColor: "#12291f",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="scene min-h-full flex flex-col" suppressHydrationWarning>
        {/* neve suave atrás de todas as páginas */}
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0 opacity-70">
          <Snow />
        </div>
        <SiteHeader />
        <div className="relative z-10 flex flex-1 flex-col">{children}</div>
        <footer className="relative z-10 border-t border-cream/10 py-8 text-center text-xs text-ink/50">
          Feito com <span className="float">🎁</span> para o seu amigo oculto · Preços e disponibilidade conferidos nas lojas
        </footer>
      </body>
    </html>
  );
}
