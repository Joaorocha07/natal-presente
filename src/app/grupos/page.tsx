import type { Metadata } from "next";
import { PRIVATE, pageMeta } from "@/lib/seo";
import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { listGroupsForUser, MAX_WISHES, type GroupSummary } from "@/lib/data";
import { countdownLabel, daysUntil, firstName, formatDate } from "@/lib/format";
import { Avatar, BudgetBadge, Container, PageSkeleton } from "@/components/ui";
import { VillageArt } from "@/components/village-art";
import { ArrowRightIcon, CalendarIcon, CheckIcon, GiftIcon, PlusIcon, UsersIcon } from "@/components/icons";

export const metadata: Metadata = pageMeta(
  "Meus grupos",
  "Seus grupos de amigo oculto, a contagem para a troca e a sua lista de desejos.",
  PRIVATE,
);

export default function Page() {
  return (
    <Container>
      <Suspense fallback={<PageSkeleton />}>
        <Groups />
      </Suspense>
    </Container>
  );
}

async function Groups() {
  const user = await requireUser("/grupos");
  const groups = await listGroupsForUser(user.id);

  const organizing = groups.filter((g) => g.owner_id === user.id).length;
  const upcoming = groups
    .filter((g) => g.event_date)
    .map((g) => ({ group: g, days: daysUntil(g.event_date!) }))
    .filter((x) => x.days >= 0)
    .sort((a, b) => a.days - b.days)[0];

  return (
    <>
      {/* Perfil */}
      <section className="night rise relative overflow-hidden rounded-[2rem] px-5 py-7 sm:px-10 sm:py-10">
        <span aria-hidden className="ornament gold right-10 top-6 hidden size-10 sm:block" />
        <span aria-hidden className="ornament right-24 top-14 hidden size-7 sm:block" style={{ animationDelay: "-2s" }} />
        <span aria-hidden className="ornament green right-4 top-24 hidden size-6 md:block" style={{ animationDelay: "-4s" }} />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <Avatar
            id={user.id}
            name={user.name}
            src={user.avatar_url}
            size="xl"
            className="ring-4 ring-gold/50 shadow-[0_10px_30px_-8px_rgb(0_0_0/0.7)]"
          />
          <div className="min-w-0 flex-1">
            <p className="eyebrow text-gold-soft">Meu cantinho de Natal 🎄</p>
            <h1 className="mt-1.5 font-display text-3xl tracking-tight sm:text-4xl">Olá, {firstName(user.name)}!</h1>
            <p className="mt-1 truncate text-sm text-cream/55">{user.email}</p>
          </div>
          <Link href="/grupos/novo" className="btn-gold self-start sm:self-center">
            <PlusIcon className="size-4" /> Novo grupo
          </Link>
        </div>

        <dl className="relative mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Grupos" value={String(groups.length)} />
          <Stat label="Você organiza" value={String(organizing)} />
          <div className="col-span-2 rounded-2xl bg-black/20 px-4 py-3 shadow-[inset_0_2px_6px_rgb(0_0_0/0.25)] sm:col-span-1">
            <dt className="text-xs text-cream/55">Próxima troca</dt>
            {upcoming ? (
              <dd className="mt-0.5 truncate">
                <span className="font-display text-2xl font-semibold text-gold-soft">{countdownLabel(upcoming.days)}</span>
                <span className="block truncate text-xs text-cream/55">{upcoming.group.name}</span>
              </dd>
            ) : (
              <dd className="mt-0.5 font-display text-2xl font-semibold text-cream/40">Sem data</dd>
            )}
          </div>
        </dl>
      </section>

      {groups.length === 0 ? (
        <div className="night rise relative mt-8 flex flex-col items-center overflow-hidden rounded-[2rem] px-6 pb-60 pt-14 text-center">
          <span className="float text-5xl">🎄</span>
          <h2 className="mt-5 font-display text-3xl">Nenhum grupo ainda</h2>
          <p className="mt-2 max-w-sm text-sm text-cream/70">
            Crie um grupo para a família, os amigos ou o trabalho, ou peça o link de convite para quem
            organizou o seu.
          </p>
          <Link href="/grupos/novo" className="btn-gold relative z-10 mt-7">
            Criar meu primeiro grupo
          </Link>
          <VillageArt className="absolute inset-x-0 bottom-0 h-52 w-full" />
        </div>
      ) : (
        <section className="mt-10">
          <h2 className="font-display text-2xl tracking-tight">
            Seus grupos <span className="text-cream/40">({groups.length})</span>
          </h2>
          <ul className="mt-5 grid gap-5 sm:grid-cols-2">
            {groups.map((g, i) => (
              <li key={g.id} className="rise" style={{ animationDelay: `${120 + i * 80}ms` }}>
                <GroupCard group={g} isOwner={g.owner_id === user.id} />
              </li>
            ))}
            <li className="rise" style={{ animationDelay: `${120 + groups.length * 80}ms` }}>
              <Link
                href="/grupos/novo"
                className="group flex h-full min-h-48 flex-col items-center justify-center gap-3 rounded-[1.75rem] border-2 border-dashed border-cream/15 p-6 text-cream/55 transition hover:border-gold/50 hover:text-gold-soft"
              >
                <span className="grid size-12 place-items-center rounded-full bg-white/5 transition group-hover:scale-110 group-hover:bg-gold/15">
                  <PlusIcon className="size-5" />
                </span>
                <span className="text-sm font-medium">Criar outro grupo</span>
              </Link>
            </li>
          </ul>
        </section>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-black/20 px-4 py-3 shadow-[inset_0_2px_6px_rgb(0_0_0/0.25)]">
      <dt className="text-xs text-cream/55">{label}</dt>
      <dd className="mt-0.5 font-display text-2xl font-semibold">{value}</dd>
    </div>
  );
}

function GroupCard({ group: g, isOwner }: { group: GroupSummary; isOwner: boolean }) {
  const days = g.event_date ? daysUntil(g.event_date) : null;
  const extra = g.member_count - g.preview.length;

  return (
    <Link href={`/grupos/${g.id}`} className="card group flex h-full flex-col p-6 transition hover:-translate-y-1">
      <div className="flex items-start gap-4">
        <span className="chip3d grid size-12 shrink-0 place-items-center text-berry">
          <GiftIcon className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-xl leading-snug">{g.name}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <BudgetBadge budget={g.budget} />
            {isOwner && (
              <span className="rounded-full bg-pine-700/10 px-2.5 py-1 text-xs font-semibold text-pine-700">
                Você organiza
              </span>
            )}
          </div>
        </div>
        <ArrowRightIcon className="mt-1 size-5 shrink-0 text-ink/25 transition group-hover:translate-x-1 group-hover:text-berry" />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2.5">
            {g.preview.map((m) => (
              <Avatar key={m.id} id={m.id} name={m.name} src={m.avatar_url} size="sm" className="ring-2 ring-[#f6ecdd]" />
            ))}
            {extra > 0 && (
              <span className="grid size-8 place-items-center rounded-full bg-ink/10 text-[11px] font-semibold text-ink/60 ring-2 ring-[#f6ecdd]">
                +{extra}
              </span>
            )}
          </div>
          <span className="inline-flex items-center gap-1.5 text-sm text-ink/55">
            <UsersIcon className="size-4" />
            {g.member_count} {g.member_count === 1 ? "pessoa" : "pessoas"}
          </span>
        </div>
        {g.event_date && days !== null && (
          <span className="inline-flex items-center gap-1.5 text-sm text-ink/55" title={countdownLabel(days)}>
            <CalendarIcon className="size-4" /> {formatDate(g.event_date)}
          </span>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-ink/[0.07] pt-4 text-sm">
        {g.my_wish_count > 0 ? (
          <span className="inline-flex items-center gap-1.5 font-medium text-pine-700">
            <CheckIcon className="size-4" /> Sua lista: {g.my_wish_count}/{MAX_WISHES}{" "}
            {g.my_wish_count === 1 ? "opção" : "opções"}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 font-medium text-berry">
            <GiftIcon className="size-4" /> Monte sua lista de desejos
          </span>
        )}
        {days !== null && days >= 0 && (
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
              days <= 7 ? "bg-berry/12 text-berry" : "bg-gold/15 text-[#8a6d12]"
            }`}
          >
            {countdownLabel(days)}
          </span>
        )}
      </div>
    </Link>
  );
}
