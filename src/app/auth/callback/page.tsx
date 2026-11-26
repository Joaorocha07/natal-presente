import type { Metadata } from "next";
import { PRIVATE, pageMeta } from "@/lib/seo";
import { Suspense } from "react";
import { GoogleCallback } from "@/components/google-callback";

export const metadata: Metadata = pageMeta(
  "Entrando com Google",
  "Entrando no Amigo Oculto com sua conta Google.",
  PRIVATE,
);

export default function Page() {
  return (
    <main className="mx-auto grid min-h-[60vh] max-w-md place-items-center px-4">
      <Suspense fallback={<p className="text-cream/70">Entrando…</p>}>
        <GoogleCallback />
      </Suspense>
    </main>
  );
}
