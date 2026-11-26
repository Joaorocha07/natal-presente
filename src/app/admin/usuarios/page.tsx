import type { Metadata } from "next";
import { PRIVATE, pageMeta } from "@/lib/seo";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { listAllUsers } from "@/lib/data";
import { AdminHeader } from "@/components/admin-nav";
import { Avatar, Container, PageSkeleton } from "@/components/ui";
import { UsersIcon } from "@/components/icons";

export const metadata: Metadata = pageMeta(
  "Admin · Usuários",
  "Painel do administrador do Amigo Oculto.",
  PRIVATE,
);

const fmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

export default function Page() {
  return (
    <Container>
      <Suspense fallback={<PageSkeleton />}>
        <Users />
      </Suspense>
    </Container>
  );
}

async function Users() {
  const admin = await requireAdmin("/admin/usuarios");
  const users = await listAllUsers();
  const newCount = users.filter((u) => u.is_new).length;
  const inGroups = users.filter((u) => u.group_count > 0).length;

  return (
    <>
      <AdminHeader
        active="/admin/usuarios"
        title="Usuários"
        description="Todo mundo que criou conta no site, do mais recente ao mais antigo."
        stats={[
          { label: "Cadastros", value: String(users.length) },
          { label: "Novos nos últimos 7 dias", value: String(newCount) },
          {
            label: "Participando de grupos",
            value: String(inGroups),
            hint: users.length ? `${Math.round((inGroups / users.length) * 100)}% dos cadastros` : undefined,
          },
        ]}
      />

      <section className="card rise mt-8 overflow-hidden p-0" style={{ animationDelay: "120ms" }}>
        <div className="hidden grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1.2fr)] gap-4 border-b border-ink/[0.07] px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/40 sm:grid">
          <span>Pessoa</span>
          <span>Grupos</span>
          <span className="text-right">Cadastro</span>
        </div>

        {users.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <UsersIcon className="mx-auto size-8 text-ink/25" />
            <p className="mt-3 text-sm text-ink/55">Ninguém se cadastrou ainda.</p>
          </div>
        ) : (
          <ul className="divide-y divide-ink/[0.06]">
            {users.map((u) => (
              <li
                key={u.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-5 py-4 transition hover:bg-white/50 sm:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1.2fr)] sm:px-6"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar id={u.id} name={u.name} src={u.avatar_url} />
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate font-medium">
                      {u.name}
                      {u.id === admin.id && (
                        <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#8a6d12]">
                          Admin
                        </span>
                      )}
                      {u.is_new && (
                        <span className="rounded-full bg-berry/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-berry">
                          Novo
                        </span>
                      )}
                    </p>
                    <a href={`mailto:${u.email}`} className="block truncate text-sm text-ink/55 hover:text-berry">
                      {u.email}
                    </a>
                  </div>
                </div>

                <span
                  className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${
                    u.group_count ? "bg-pine-700/10 text-pine-700" : "bg-ink/5 text-ink/45"
                  }`}
                >
                  {u.group_count === 0 ? "Nenhum" : `${u.group_count} ${u.group_count === 1 ? "grupo" : "grupos"}`}
                </span>

                <span className="col-span-2 text-xs text-ink/50 sm:col-span-1 sm:text-right sm:text-sm">
                  {fmt.format(new Date(u.created_at))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
