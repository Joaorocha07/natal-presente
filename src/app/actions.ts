"use server";

import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { refresh, updateTag } from "next/cache";
import { createSession, destroySession, getUser, hashPassword, isAdmin, verifyPassword } from "@/lib/auth";
import * as data from "@/lib/data";
import { db } from "@/lib/db";
import { fetchProductPreview, type ProductPreview } from "@/lib/product-preview";
import { parseMoney, safeUrl, storeFromUrl, money } from "@/lib/format";

export type FormState =
  | { error?: string; ok?: string; redirectTo?: string; values?: Record<string, string> }
  | undefined;

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

/** Só permite redirecionar para caminhos internos */
const safeNext = (next: string) => (next.startsWith("/") && !next.startsWith("//") ? next : "/grupos");

async function mustUser() {
  const user = await getUser();
  if (!user) redirect("/entrar");
  return user;
}

// ---------------------------------------------------------------- auth

export async function register(_: FormState, fd: FormData): Promise<FormState> {
  const name = str(fd, "name");
  const email = str(fd, "email").toLowerCase();
  const password = str(fd, "password");
  if (name.length < 2) return { error: "Informe seu nome." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "E-mail inválido." };
  if (password.length < 6) return { error: "A senha precisa de pelo menos 6 caracteres." };
  if (await data.findUserByEmail(email)) return { error: "Já existe uma conta com esse e-mail." };

  const id = await data.createUser(name.slice(0, 60), email, hashPassword(password));
  await createSession(id);
  // Navegação completa no cliente: descarta páginas em cache de quando estava deslogado
  return { redirectTo: safeNext(str(fd, "next")) };
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email").toLowerCase();
  const password = str(fd, "password");
  const user = await data.findUserByEmail(email);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return { error: "E-mail ou senha incorretos." };
  }
  await createSession(user.id);
  return { redirectTo: safeNext(str(fd, "next")) };
}

/** Recebe o access token do Supabase (Google), valida no servidor e abre a sessão do app. */
export async function loginWithGoogle(accessToken: string, next: string): Promise<FormState> {
  const url = process.env.NEXT_PUBLIC_GOOGLE_AUTH_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_GOOGLE_AUTH_SUPABASE_KEY;
  if (!url || !key || !accessToken) return { error: "Login com Google não configurado." };

  const { data: res, error } = await createClient(url, key, { auth: { persistSession: false } }).auth.getUser(
    accessToken,
  );
  const gUser = res?.user;
  const email = gUser?.email?.toLowerCase();
  if (error || !gUser) {
    console.error("[google-login] token recusado pelo Supabase:", error?.message ?? "sem usuário");
    return { error: "Sessão do Google inválida ou expirada. Tente de novo." };
  }
  if (!email) return { error: "O Google não informou um e-mail para esta conta." };

  // E-mail precisa estar verificado pelo Google. O Supabase pode deixar
  // email_confirmed_at vazio quando já havia um usuário com o mesmo e-mail,
  // então também vale a identidade do Google marcada como verificada.
  const googleIdentity = gUser.identities?.find((i) => i.provider === "google");
  const verified =
    Boolean(gUser.email_confirmed_at) ||
    googleIdentity?.identity_data?.email_verified === true ||
    gUser.user_metadata?.email_verified === true;
  if (!verified) {
    console.error("[google-login] e-mail não verificado", {
      providers: gUser.identities?.map((i) => i.provider),
      confirmed: Boolean(gUser.email_confirmed_at),
    });
    return { error: "O Google não confirmou o e-mail desta conta." };
  }

  const meta = gUser.user_metadata ?? {};
  const fullName = String(meta.full_name ?? meta.name ?? email.split("@")[0]).trim();
  const name = (fullName.length >= 2 ? fullName : email.split("@")[0]).slice(0, 60);

  const avatar = safeUrl(String(meta.avatar_url ?? meta.picture ?? ""));

  try {
    const existing = await data.findUserByEmail(email);
    // Conta nova: senha aleatória (inutilizável), a pessoa entra sempre pelo Google
    const id =
      existing?.id ?? (await data.createUser(name, email, hashPassword(randomBytes(32).toString("hex")), avatar));
    if (existing && avatar) {
      // Foto é enfeite: se a coluna ainda não existir, o login segue normalmente
      await data.setUserAvatar(existing.id, avatar).catch((e) => console.error("[google-login] foto:", e));
    }
    await createSession(id);
  } catch (e) {
    // Em produção o Next esconde a mensagem do erro; registra nos logs e devolve um aviso legível
    console.error("[google-login] falha ao salvar usuário/sessão no banco:", e);
    return { error: "Entramos no Google, mas não deu para acessar o banco do site. Confira o SUPABASE_SECRET_KEY." };
  }
  return { redirectTo: safeNext(next) };
}

export async function logout() {
  await destroySession();
}

// ---------------------------------------------------------------- grupos

function readGroupForm(fd: FormData) {
  const name = str(fd, "name");
  const budget = parseMoney(str(fd, "budget"));
  const eventDate = str(fd, "eventDate") || null;
  if (name.length < 2) return { error: "Dê um nome ao grupo." } as const;
  if (!Number.isFinite(budget) || budget < 1000 || budget > 100000) {
    return { error: "Defina um valor entre R$ 10 e R$ 1.000." } as const;
  }
  if (eventDate && !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) return { error: "Data inválida." } as const;
  return { name: name.slice(0, 60), budget, eventDate } as const;
}

export async function createGroup(_: FormState, fd: FormData): Promise<FormState> {
  const user = await mustUser();
  const parsed = readGroupForm(fd);
  if ("error" in parsed) return { error: parsed.error };
  const id = await data.createGroup({ ...parsed, ownerId: user.id });
  redirect(`/grupos/${id}?novo=1`);
}

export async function updateGroup(groupId: string, _: FormState, fd: FormData): Promise<FormState> {
  const user = await mustUser();
  const parsed = readGroupForm(fd);
  if ("error" in parsed) return { error: parsed.error };
  await data.updateGroup(groupId, user.id, parsed);
  refresh();
  return { ok: "Grupo atualizado." };
}

export async function deleteGroup(groupId: string) {
  const user = await mustUser();
  await data.deleteGroup(groupId, user.id);
  redirect("/grupos");
}

export async function joinGroup(code: string) {
  const user = await getUser();
  if (!user) redirect(`/entrar?next=${encodeURIComponent(`/convite/${code}`)}`);
  const group = await data.getGroupByInvite(code);
  if (!group) redirect("/grupos");
  await data.joinGroup(group.id, user.id);
  redirect(`/grupos/${group.id}`);
}

export async function leaveGroup(groupId: string) {
  const user = await mustUser();
  const group = await data.getGroupForMember(groupId, user.id);
  if (group && group.owner_id !== user.id) await data.leaveGroup(groupId, user.id);
  redirect("/grupos");
}

/** Organizador remove um participante (e a lista dele) do grupo */
export async function removeMember(groupId: string, memberId: string) {
  const user = await mustUser();
  await data.removeMember(groupId, user.id, memberId);
  refresh();
}

/** Organizador passa a organização do grupo para outro participante */
export async function makeOrganizer(groupId: string, memberId: string) {
  const user = await mustUser();
  await data.transferOwnership(groupId, user.id, memberId);
  refresh();
}

// ---------------------------------------------------------------- perfil

export async function updateProfile(_: FormState, fd: FormData): Promise<FormState> {
  const user = await mustUser();
  const name = str(fd, "name").replace(/\s+/g, " ");
  if (name.length < 2) return { error: "O nome precisa de pelo menos 2 letras." };
  if (name.length > 60) return { error: "Use no máximo 60 caracteres." };
  if (name === user.name) return { ok: "Nada mudou por aqui." };
  await data.updateUserName(user.id, name);
  refresh();
  return { ok: "Nome atualizado! 🎄" };
}

// ---------------------------------------------------------------- lista de desejos

export type WishInput = {
  title: string;
  price: number; // centavos
  url?: string | null;
  image?: string | null;
  note?: string | null;
};

async function insertWish(groupId: string, input: WishInput): Promise<FormState> {
  const user = await mustUser();
  const group = await data.getGroupForMember(groupId, user.id);
  if (!group) return { error: "Você não participa deste grupo." };

  const title = input.title.trim().slice(0, 140);
  if (title.length < 2) return { error: "Descreva o presente." };
  if (!Number.isFinite(input.price) || input.price <= 0) return { error: "Informe o preço." };
  if (input.price > group.budget) {
    return { error: `O valor máximo deste grupo é ${money(group.budget)}.` };
  }
  if (await data.countWishes(groupId, user.id) >= data.MAX_WISHES) {
    return { error: `Limite de ${data.MAX_WISHES} opções por pessoa.` };
  }
  const url = safeUrl(input.url);
  await data.addWish(groupId, user.id, {
    title,
    price: Math.round(input.price),
    url,
    image: safeUrl(input.image),
    store: storeFromUrl(url),
    note: input.note?.trim().slice(0, 200) || null,
  });
  refresh();
  return { ok: "Adicionado à sua lista!" };
}

/** Formulário manual */
export async function addWishFromForm(groupId: string, _: FormState, fd: FormData): Promise<FormState> {
  const values = { url: str(fd, "url"), title: str(fd, "title"), price: str(fd, "price"), note: str(fd, "note") };
  if (values.url && !safeUrl(values.url)) return { error: "Link inválido (use http:// ou https://).", values };
  const res = await insertWish(groupId, {
    title: values.title,
    price: parseMoney(values.price),
    url: values.url || null,
    note: values.note || null,
  });
  // Em caso de erro, devolve o que foi digitado para não perder o preenchimento
  return res?.error ? { ...res, values } : res;
}

/** A partir de um produto da busca */
export async function addWishFromProduct(groupId: string, input: WishInput): Promise<FormState> {
  return insertWish(groupId, input);
}

export async function removeWish(wishId: string) {
  const user = await mustUser();
  await data.deleteWish(wishId, user.id);
  refresh();
}

// ---------------------------------------------------------------- admin

async function mustAdmin() {
  const user = await mustUser();
  if (!isAdmin(user)) throw new Error("Acesso restrito ao administrador.");
  return user;
}

export async function addCatalogProduct(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await mustAdmin();
  const values = {
    title: str(fd, "title"),
    price: str(fd, "price"),
    url: str(fd, "url"),
    image: str(fd, "image"),
    category: str(fd, "category"),
  };
  const title = values.title.slice(0, 140);
  const price = parseMoney(values.price);
  const url = safeUrl(values.url);
  if (title.length < 2) return { error: "Informe o nome do produto.", values };
  if (!Number.isFinite(price) || price <= 0) return { error: "Informe o preço.", values };
  if (!url) return { error: "Link do produto inválido (use http:// ou https://).", values };
  if (values.image && !safeUrl(values.image)) return { error: "Link da imagem inválido.", values };
  let category: string | null = null;
  if (values.category) {
    const found = await data.findCategoryByName(values.category);
    if (!found) return { error: "Categoria não encontrada. Crie na aba Categorias.", values };
    category = found.name;
  }

  await data.addCatalogProduct(
    {
      title,
      price,
      url,
      image: safeUrl(values.image),
      store: storeFromUrl(url),
      category,
    },
    admin.id,
  );
  updateTag("catalog");
  refresh();
  return { ok: "Produto cadastrado!" };
}

/** Busca nome, preço e foto a partir do link do produto */
export async function previewProductLink(
  rawUrl: string,
): Promise<{ ok: true; preview: ProductPreview } | { ok: false; error: string }> {
  await mustAdmin();
  const url = safeUrl(rawUrl);
  if (!url) return { ok: false, error: "Cole um link válido (https://…)." };
  try {
    const preview = await fetchProductPreview(url);
    if (!preview.title && !preview.price && !preview.images.length) {
      return { ok: false, error: "A loja não mostrou os dados do produto. Preencha à mão." };
    }
    return { ok: true, preview };
  } catch (e) {
    console.error("[admin] prévia do link:", e);
    return { ok: false, error: "Não consegui abrir o link (a loja pode bloquear robôs). Preencha à mão." };
  }
}

/** Tipo real da imagem pelos primeiros bytes (não confia na extensão nem no navegador) */
function sniffImage(b: Uint8Array): { type: string; ext: string } | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { type: "image/jpeg", ext: "jpg" };
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { type: "image/png", ext: "png" };
  const riff = String.fromCharCode(...b.slice(0, 4)) === "RIFF";
  if (riff && String.fromCharCode(...b.slice(8, 12)) === "WEBP") return { type: "image/webp", ext: "webp" };
  return null;
}

/** Envia uma foto de produto para o Storage e devolve a URL pública */
export async function uploadProductImage(
  fd: FormData,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  await mustAdmin();
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Escolha uma imagem." };
  if (file.size > 2 * 1024 * 1024) return { ok: false, error: "Imagem muito grande (máx. 2 MB)." };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffImage(bytes);
  if (!kind) return { ok: false, error: "Use uma imagem JPG, PNG ou WebP." };

  const path = `${new Date().getFullYear()}/${randomBytes(12).toString("hex")}.${kind.ext}`;
  const { error } = await db()
    .storage.from("produtos")
    .upload(path, bytes, { contentType: kind.type, cacheControl: "31536000", upsert: false });
  if (error) {
    console.error("[admin] envio de imagem:", error.message);
    return { ok: false, error: "Não consegui salvar a imagem. O bucket “produtos” foi criado?" };
  }
  return { ok: true, url: db().storage.from("produtos").getPublicUrl(path).data.publicUrl };
}

export async function removeCatalogProduct(id: string) {
  await mustAdmin();
  await data.deleteCatalogProduct(id);
  updateTag("catalog");
  refresh();
}

// ---------------------------------------------------------------- categorias (admin)

function readCategoryForm(fd: FormData) {
  const name = str(fd, "name").replace(/\s+/g, " ");
  const emoji = str(fd, "emoji") || "🎁";
  if (name.length < 2 || name.length > 40) return { error: "O nome precisa ter de 2 a 40 letras." } as const;
  if ([...emoji].length > 4) return { error: "Use só um emoji." } as const;
  // Primeira letra maiúscula, para ficar bonito nos atalhos
  return { name: name.charAt(0).toUpperCase() + name.slice(1), emoji } as const;
}

export async function addCategory(_: FormState, fd: FormData): Promise<FormState> {
  await mustAdmin();
  const parsed = readCategoryForm(fd);
  if ("error" in parsed) return { error: parsed.error, values: { name: str(fd, "name"), emoji: str(fd, "emoji") } };
  if (await data.findCategoryByName(parsed.name)) {
    return { error: `A categoria “${parsed.name}” já existe.`, values: { name: str(fd, "name"), emoji: str(fd, "emoji") } };
  }
  await data.addCategory(parsed.name, parsed.emoji);
  refresh();
  return { ok: `Categoria “${parsed.name}” criada!` };
}

export async function updateCategory(id: string, oldName: string, _: FormState, fd: FormData): Promise<FormState> {
  await mustAdmin();
  const parsed = readCategoryForm(fd);
  if ("error" in parsed) return { error: parsed.error };
  const clash = await data.findCategoryByName(parsed.name);
  if (clash && clash.id !== id) return { error: `A categoria “${parsed.name}” já existe.` };
  await data.updateCategory(id, parsed, oldName);
  updateTag("catalog");
  refresh();
  return { ok: "Salvo." };
}

export async function removeCategory(id: string) {
  await mustAdmin();
  await data.deleteCategory(id);
  updateTag("catalog");
  refresh();
}
