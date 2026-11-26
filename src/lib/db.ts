import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase do servidor, com a chave secreta (ignora RLS).
 * Nunca importe este arquivo em Client Components: "server-only" quebra o build se isso acontecer.
 * As tabelas têm RLS ligado e sem políticas, então a chave publicável não acessa nada.
 */
const globalForDb = globalThis as unknown as { __supabase?: SupabaseClient };

export function db(): SupabaseClient {
  if (!globalForDb.__supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    if (!url || !key) {
      throw new Error("Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY no .env.local");
    }
    globalForDb.__supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return globalForDb.__supabase;
}

/** Lança o erro do Supabase (vira a página de erro) em vez de seguir com dados vazios. */
export function must<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(`Supabase: ${res.error.message}`);
  return res.data;
}
