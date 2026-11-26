import "server-only";
import { randomBytes } from "node:crypto";
import { cacheLife, cacheTag } from "next/cache";
import { db, must } from "./db";

export type Group = {
  id: string;
  name: string;
  budget: number; // centavos
  event_date: string | null;
  invite_code: string;
  owner_id: string;
  member_count: number;
};

export type MemberPreview = { id: string; name: string; avatar_url: string | null };

export type GroupSummary = Group & {
  /** até 5 participantes, para a fileira de fotos */
  preview: MemberPreview[];
  /** opções que o usuário já colocou na própria lista */
  my_wish_count: number;
};

export type Member = { id: string; name: string; avatar_url: string | null; wish_count: number };

export type Wish = {
  id: string;
  title: string;
  price: number; // centavos
  url: string | null;
  image: string | null;
  store: string | null;
  note: string | null;
};

const GROUP_SELECT = "id, name, budget, event_date, invite_code, owner_id, memberships(count)";
const WISH_SELECT = "id, title, price, url, image, store, note";

type GroupRow = Omit<Group, "member_count"> & { memberships: { count: number }[] };

const toGroup = ({ memberships, ...g }: GroupRow): Group => ({
  ...g,
  member_count: memberships[0]?.count ?? 0,
});

// ---------------------------------------------------------------- grupos

export async function listGroupsForUser(userId: string): Promise<GroupSummary[]> {
  const ids = (must(await db().from("memberships").select("group_id").eq("user_id", userId)) ?? []).map(
    (r) => r.group_id as string,
  );
  if (!ids.length) return [];
  const [groups, members, wishes] = await Promise.all([
    db().from("groups").select(GROUP_SELECT).in("id", ids).order("created_at", { ascending: false }),
    db()
      .from("memberships")
      .select("group_id, user:users(id, name, avatar_url)")
      .in("group_id", ids)
      .order("joined_at", { ascending: true }),
    db().from("wishes").select("group_id").eq("user_id", userId).in("group_id", ids),
  ]);

  const previews = new Map<string, MemberPreview[]>();
  for (const m of (must(members) ?? []) as unknown as { group_id: string; user: MemberPreview }[]) {
    const list = previews.get(m.group_id) ?? [];
    if (list.length < 5) list.push(m.user);
    previews.set(m.group_id, list);
  }
  const myWishes = new Map<string, number>();
  for (const w of must(wishes) ?? []) myWishes.set(w.group_id, (myWishes.get(w.group_id) ?? 0) + 1);

  return ((must(groups) ?? []) as unknown as GroupRow[]).map((row) => ({
    ...toGroup(row),
    preview: previews.get(row.id) ?? [],
    my_wish_count: myWishes.get(row.id) ?? 0,
  }));
}

/** Grupo apenas se o usuário for membro (autorização embutida). */
export async function getGroupForMember(groupId: string, userId: string): Promise<Group | null> {
  if (!isUuid(groupId) || !(await isMember(groupId, userId))) return null;
  const row = must(await db().from("groups").select(GROUP_SELECT).eq("id", groupId).maybeSingle()) as GroupRow | null;
  return row ? toGroup(row) : null;
}

export async function getGroupByInvite(code: string): Promise<(Group & { owner_name: string }) | null> {
  const row = must(
    await db()
      .from("groups")
      .select(`${GROUP_SELECT}, owner:users!groups_owner_id_fkey(name)`)
      .eq("invite_code", code)
      .maybeSingle(),
  ) as (GroupRow & { owner: { name: string } }) | null;
  if (!row) return null;
  const { owner, ...rest } = row;
  return { ...toGroup(rest), owner_name: owner.name };
}

export async function isMember(groupId: string, userId: string): Promise<boolean> {
  if (!isUuid(groupId)) return false;
  const { count } = await db()
    .from("memberships")
    .select("*", { count: "exact", head: true })
    .eq("group_id", groupId)
    .eq("user_id", userId);
  return (count ?? 0) > 0;
}

export async function createGroup(input: {
  name: string;
  budget: number;
  eventDate: string | null;
  ownerId: string;
}): Promise<string> {
  const group = must(
    await db()
      .from("groups")
      .insert({
        name: input.name,
        budget: input.budget,
        event_date: input.eventDate,
        invite_code: randomBytes(6).toString("base64url"),
        owner_id: input.ownerId,
      })
      .select("id")
      .single(),
  ) as { id: string };
  const { error } = await db().from("memberships").insert({ group_id: group.id, user_id: input.ownerId });
  if (error) {
    // Sem transação na API REST: desfaz o grupo se a participação falhar
    await db().from("groups").delete().eq("id", group.id);
    throw new Error(`Supabase: ${error.message}`);
  }
  return group.id;
}

export async function updateGroup(
  groupId: string,
  ownerId: string,
  input: { name: string; budget: number; eventDate: string | null },
) {
  must(
    await db()
      .from("groups")
      .update({ name: input.name, budget: input.budget, event_date: input.eventDate })
      .eq("id", groupId)
      .eq("owner_id", ownerId),
  );
}

export async function deleteGroup(groupId: string, ownerId: string) {
  must(await db().from("groups").delete().eq("id", groupId).eq("owner_id", ownerId));
}

export async function joinGroup(groupId: string, userId: string) {
  must(
    await db()
      .from("memberships")
      .upsert({ group_id: groupId, user_id: userId }, { onConflict: "group_id,user_id", ignoreDuplicates: true }),
  );
}

/** Apaga a participação; os desejos saem junto (FK em cascata). */
export async function leaveGroup(groupId: string, userId: string) {
  must(await db().from("memberships").delete().eq("group_id", groupId).eq("user_id", userId));
}

// ---------------------------------------------------------------- membros

export async function listMembers(groupId: string): Promise<Member[]> {
  const [members, wishes] = await Promise.all([
    db().from("memberships").select("user:users(id, name, avatar_url)").eq("group_id", groupId),
    db().from("wishes").select("user_id").eq("group_id", groupId),
  ]);
  const counts = new Map<string, number>();
  for (const w of must(wishes) ?? []) counts.set(w.user_id, (counts.get(w.user_id) ?? 0) + 1);
  return ((must(members) ?? []) as unknown as { user: Omit<Member, "wish_count"> }[])
    .map(({ user }) => ({ ...user, wish_count: counts.get(user.id) ?? 0 }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }));
}

export async function getMember(
  groupId: string,
  userId: string,
): Promise<{ name: string; avatar_url: string | null } | null> {
  if (!isUuid(userId)) return null;
  const row = must(
    await db()
      .from("memberships")
      .select("user:users(name, avatar_url)")
      .eq("group_id", groupId)
      .eq("user_id", userId)
      .maybeSingle(),
  ) as unknown as { user: { name: string; avatar_url: string | null } } | null;
  return row?.user ?? null;
}

// ---------------------------------------------------------------- desejos

export const MAX_WISHES = 12;

export async function listWishes(groupId: string, userId: string): Promise<Wish[]> {
  return (
    must(
      await db()
        .from("wishes")
        .select(WISH_SELECT)
        .eq("group_id", groupId)
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
    ) ?? []
  );
}

export async function countWishes(groupId: string, userId: string): Promise<number> {
  const { count, error } = await db()
    .from("wishes")
    .select("*", { count: "exact", head: true })
    .eq("group_id", groupId)
    .eq("user_id", userId);
  if (error) throw new Error(`Supabase: ${error.message}`);
  return count ?? 0;
}

export async function addWish(groupId: string, userId: string, wish: Omit<Wish, "id">) {
  must(await db().from("wishes").insert({ ...wish, group_id: groupId, user_id: userId }));
}

export async function deleteWish(wishId: string, userId: string) {
  if (!isUuid(wishId)) return;
  must(await db().from("wishes").delete().eq("id", wishId).eq("user_id", userId));
}

// ---------------------------------------------------------------- usuários

export async function findUserByEmail(email: string) {
  return must(
    await db().from("users").select("id, name, email, password_hash").eq("email", email).maybeSingle(),
  ) as { id: string; name: string; email: string; password_hash: string } | null;
}

export async function createUser(
  name: string,
  email: string,
  passwordHash: string,
  avatarUrl: string | null = null,
): Promise<string> {
  const row = must(
    await db()
      .from("users")
      .insert({ name, email, password_hash: passwordHash, ...(avatarUrl ? { avatar_url: avatarUrl } : {}) })
      .select("id")
      .single(),
  ) as { id: string };
  return row.id;
}

/** Atualiza a foto a cada login com Google (a pessoa pode ter trocado a foto lá). */
export async function setUserAvatar(userId: string, avatarUrl: string | null) {
  must(await db().from("users").update({ avatar_url: avatarUrl }).eq("id", userId));
}

/** IDs vêm da URL: valida antes de mandar ao Postgres (evita erro 22P02 de uuid inválido). */
function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

// ---------------------------------------------------------------- admin

export type CatalogProduct = {
  id: string;
  title: string;
  price: number; // centavos
  url: string;
  image: string | null;
  store: string | null;
  category: string | null;
  created_at: string;
};

const PRODUCT_SELECT = "id, title, price, url, image, store, category, created_at";

export async function listCatalogProducts(maxCents?: number): Promise<CatalogProduct[]> {
  let q = db().from("products").select(PRODUCT_SELECT).order("created_at", { ascending: false });
  if (maxCents) q = q.lte("price", maxCents);
  return must(await q) ?? [];
}

export async function addCatalogProduct(
  input: Omit<CatalogProduct, "id" | "created_at">,
  createdBy: string,
) {
  must(await db().from("products").insert({ ...input, created_by: createdBy }));
}

export async function deleteCatalogProduct(id: string) {
  if (!isUuid(id)) return;
  must(await db().from("products").delete().eq("id", id));
}

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  group_count: number;
  /** cadastrado nos últimos 7 dias */
  is_new: boolean;
};

export async function listAllUsers(): Promise<AdminUser[]> {
  const rows = must(
    await db()
      .from("users")
      .select("id, name, email, avatar_url, created_at, memberships(count)")
      .order("created_at", { ascending: false }),
  ) as unknown as (Omit<AdminUser, "group_count" | "is_new"> & { memberships: { count: number }[] })[];
  const weekAgo = Date.now() - 7 * 864e5;
  return rows.map(({ memberships, ...u }) => ({
    ...u,
    group_count: memberships[0]?.count ?? 0,
    is_new: new Date(u.created_at).getTime() > weekAgo,
  }));
}

// ---------------------------------------------------------------- categorias

export type Category = { id: string; name: string; emoji: string; product_count: number };

export async function listCategories(): Promise<Category[]> {
  const [cats, products] = await Promise.all([
    db().from("categories").select("id, name, emoji").order("name", { ascending: true }),
    db().from("products").select("category"),
  ]);
  const counts = new Map<string, number>();
  for (const p of must(products) ?? []) {
    if (p.category) counts.set(p.category.toLowerCase(), (counts.get(p.category.toLowerCase()) ?? 0) + 1);
  }
  return ((must(cats) ?? []) as Omit<Category, "product_count">[]).map((c) => ({
    ...c,
    product_count: counts.get(c.name.toLowerCase()) ?? 0,
  }));
}

/** Categorias para atalhos e formulários; vazio se a tabela ainda não existir */
export async function listCategoriesSafe(): Promise<Category[]> {
  try {
    return await listCategories();
  } catch (err) {
    console.error("[categorias] indisponível:", err);
    return [];
  }
}

export async function findCategoryByName(name: string) {
  return must(
    await db().from("categories").select("id, name, emoji").ilike("name", name.replace(/[%_\\]/g, "\\$&")).maybeSingle(),
  ) as { id: string; name: string; emoji: string } | null;
}

export async function addCategory(name: string, emoji: string) {
  must(await db().from("categories").insert({ name, emoji }));
}

export async function updateCategory(id: string, input: { name: string; emoji: string }, oldName: string) {
  if (!isUuid(id)) return;
  must(await db().from("categories").update(input).eq("id", id));
  // Renomear: leva os produtos junto
  if (input.name !== oldName) must(await db().from("products").update({ category: input.name }).eq("category", oldName));
}

/** Apaga a categoria; os produtos ficam sem categoria */
export async function deleteCategory(id: string) {
  if (!isUuid(id)) return;
  const row = must(await db().from("categories").select("name").eq("id", id).maybeSingle()) as { name: string } | null;
  if (!row) return;
  must(await db().from("products").update({ category: null }).eq("category", row.name));
  must(await db().from("categories").delete().eq("id", id));
}

// ---------------------------------------------------------------- vitrine da home

export type ShowcaseProduct = {
  id: string;
  title: string;
  price: number;
  url: string;
  image: string | null;
  store: string | null;
  category: string | null;
  emoji: string;
};

/** Produtos reais para a home: com foto primeiro, mais recentes. Cache invalidado pelo admin. */
export async function getShowcaseProducts(limit = 3): Promise<ShowcaseProduct[]> {
  "use cache";
  cacheTag("catalog");
  cacheLife("hours");
  try {
    const [products, cats] = await Promise.all([
      db()
        .from("products")
        .select("id, title, price, url, image, store, category")
        .order("created_at", { ascending: false })
        .limit(200),
      db().from("categories").select("name, emoji"),
    ]);
    const emojis = new Map(((cats.data ?? []) as { name: string; emoji: string }[]).map((c) => [c.name.toLowerCase(), c.emoji]));
    const all = ((must(products) ?? []) as Omit<ShowcaseProduct, "emoji">[]).sort(
      (a, b) => Number(!!b.image) - Number(!!a.image),
    );

    // Uma vaga por tipo: caneca, livro e algo de casa; o que faltar completa com outros
    const norm = (v: string | null) =>
      (v ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const SLOTS: ((p: Omit<ShowcaseProduct, "emoji">) => boolean)[] = [
      (p) => /\b(caneca|xicara|copo termico)/.test(norm(p.title)),
      (p) => /\blivros?\b/.test(norm(p.category)) || /\b(livro|romance|manga|hq)\b/.test(norm(p.title)),
      (p) =>
        /\b(casa|decor|cozinha)/.test(norm(p.category)) ||
        /\b(vela|manta|almofada|luminaria|difusor|vaso|porta-retrato|tapete)\b/.test(norm(p.title)),
    ];
    const picked: Omit<ShowcaseProduct, "emoji">[] = [];
    for (const match of SLOTS) {
      const hit = all.find((p) => match(p) && !picked.includes(p));
      if (hit) picked.push(hit);
    }
    for (const p of all) {
      if (picked.length >= limit) break;
      if (!picked.includes(p)) picked.push(p);
    }
    return picked
      .slice(0, limit)
      .map((p) => ({ ...p, emoji: (p.category && emojis.get(p.category.toLowerCase())) || "🎁" }));
  } catch (err) {
    console.error("[vitrine] catálogo indisponível:", err);
    return [];
  }
}
