import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// O Supabase aqui serve só para o Google confirmar quem é a pessoa (OAuth).
// Depois do retorno, o access token vai para o servidor, que valida o token e
// abre a sessão própria do app. A sessão do Supabase no navegador é descartada.
const url = process.env.NEXT_PUBLIC_GOOGLE_AUTH_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_GOOGLE_AUTH_SUPABASE_KEY;

export const googleLoginEnabled = Boolean(url && key);

let client: SupabaseClient | null = null;

export function googleClient(): SupabaseClient {
  if (!url || !key) throw new Error("Login com Google não configurado.");
  // PKCE: o Google volta para /auth/callback com um ?code= trocado lá mesmo.
  client ??= createClient(url, key, {
    auth: { flowType: "pkce", detectSessionInUrl: false, autoRefreshToken: false, persistSession: true },
  });
  return client;
}

/** Só caminhos internos em ?next= (nada de redirecionar para outro site). */
export function safeNext(next: string | null | undefined, fallback = "/grupos"): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

export async function startGoogleLogin(next: string) {
  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext(next))}`;
  const { error } = await googleClient().auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, queryParams: { prompt: "select_account" } },
  });
  if (error) throw error;
}
