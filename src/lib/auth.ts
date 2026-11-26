import "server-only";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { db, must } from "./db";

const COOKIE = "amigo_session";
const SESSION_DAYS = 30;

export type User = { id: string; name: string; email: string; avatar_url: string | null };

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(expected, actual);
}

const sha = (v: string) => createHash("sha256").update(v).digest("hex");

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expires = Date.now() + SESSION_DAYS * 864e5;
  must(
    await db()
      .from("sessions")
      .insert({ token_hash: sha(token), user_id: userId, expires_at: new Date(expires).toISOString() }),
  );
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expires),
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) await db().from("sessions").delete().eq("token_hash", sha(token));
  store.delete(COOKIE);
}

/** Usuário logado ou null. Lê cookies: use dentro de <Suspense>. */
export async function getUser(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const row = must(
    await db()
      .from("sessions")
      .select("expires_at, user:users(id, name, email, avatar_url)")
      .eq("token_hash", sha(token))
      .maybeSingle(),
  ) as unknown as { expires_at: string; user: User } | null;
  if (!row || new Date(row.expires_at).getTime() < Date.now()) return null;
  return row.user;
}

/** Administradores: e-mails separados por vírgula em ADMIN_EMAILS (.env.local). */
export function isAdmin(user: Pick<User, "email"> | null): boolean {
  if (!user) return false;
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(user.email.toLowerCase());
}

/** Usuário admin, ou login / 404 para os demais. */
export async function requireAdmin(next = "/admin"): Promise<User> {
  const user = await requireUser(next);
  if (!isAdmin(user)) notFound();
  return user;
}

/** Usuário logado ou redireciona para o login (voltando para `next`). */
export async function requireUser(next?: string): Promise<User> {
  const user = await getUser();
  if (!user) redirect(next ? `/entrar?next=${encodeURIComponent(next)}` : "/entrar");
  return user;
}
