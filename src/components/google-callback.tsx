"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { loginWithGoogle } from "@/app/actions";
import { googleClient, safeNext } from "@/lib/google";

export function GoogleCallback() {
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // o code só pode ser trocado uma vez (StrictMode roda 2x)
    started.current = true;

    (async () => {
      const code = params.get("code");
      const next = safeNext(params.get("next"));
      if (!code) throw new Error(params.get("error_description") ?? "Login cancelado.");

      const supabase = googleClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error || !data.session) throw new Error("Não foi possível entrar com o Google.");
      const token = data.session.access_token;

      // Valida no servidor ANTES de encerrar a sessão do Supabase: o signOut
      // revoga a sessão lá, e o token deixaria de valer para o servidor.
      let res;
      try {
        res = await loginWithGoogle(token, next);
      } finally {
        await supabase.auth.signOut({ scope: "local" }).catch(() => {}); // descarta a sessão no navegador
      }
      if (res?.error || !res?.redirectTo) throw new Error(res?.error ?? "Falha ao entrar.");
      window.location.replace(res.redirectTo);
    })().catch((e: unknown) => setError(e instanceof Error ? e.message : "Falha ao entrar."));
  }, [params]);

  if (error) {
    return (
      <div className="card p-8 text-center">
        <p className="font-display text-xl">Não deu para entrar</p>
        <p className="mt-2 text-sm text-ink/65">{error}</p>
        <Link href="/entrar" className="btn-primary mt-6">
          Voltar ao login
        </Link>
      </div>
    );
  }
  return <p className="text-cream/80">Entrando com o Google…</p>;
}
