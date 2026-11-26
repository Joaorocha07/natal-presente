import type { Metadata } from "next";
import { PRIVATE, pageMeta } from "@/lib/seo";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { getGroupForMember, getMember, listWishes } from "@/lib/data";
import { firstName, formatDate, money, prettyName } from "@/lib/format";
import { Avatar, BackLink, BudgetBadge, Container, PageSkeleton, WishCard } from "@/components/ui";
import { Snow } from "@/components/snow";
import { CalendarIcon, CrownIcon, GiftIcon, TagIcon } from "@/components/icons";

export const metadata: Metadata = pageMeta(
  "Lista de desejos",
  "As opções de presente que esta pessoa escolheu, dentro do valor do grupo.",
  PRIVATE,
);

export default function Page({ params }: PageProps<"/grupos/[id]/membro/[userId]">) {
  return (
    <Container>
      <Suspense fallback={<PageSkeleton />}>
        <Profile params={params} />
      </Suspense>
    </Container>
  );
}

async function Profile({ params }: { params: Promise<{ id: string; userId: string }> }) {
  const { id, userId } = await params;
  const user = await requireUser(`/grupos/${id}/membro/${userId}`);
  if (userId === user.id) redirect(`/grupos/${id}/minha-lista`);

  const group = await getGroupForMember(id, user.id);
  const member = group && (await getMember(id, userId));
  if (!group || !member) notFound();

  const wishes = await listWishes(id, userId);
  const name = prettyName(member.name);
  const first = firstName(name);
  const isOrganizer = group.owner_id === userId;
  const prices = wishes.map((w) => w.price);
  const range =
    prices.length === 0
      ? null
      : Math.min(...prices) === Math.max(...prices)
        ? money(prices[0])
        : `${money(Math.min(...prices))} a ${money(Math.max(...prices))}`;

  return (
    <>
      <BackLink href={`/grupos/${id}`}>{group.name}</BackLink>

      {/* Cabeçalho da pessoa */}
      <section className="night rise relative mt-5 overflow-hidden rounded-[2rem] px-6 py-8 text-cream sm:px-10 sm:py-10">
        <Snow className="opacity-40" />
        <span aria-hidden className="ornament gold -right-3 -top-3 size-10 opacity-90" />
        <span aria-hidden className="ornament green right-16 bottom-6 hidden size-6 sm:block" style={{ animationDelay: "-3s" }} />

        <div className="relative flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:text-left">
          <Avatar
            id={userId}
            name={name}
            src={member.avatar_url}
            size="xl"
            className="ring-4 ring-gold/50 shadow-[0_10px_30px_-8px_rgb(0_0_0/0.7)]"
          />
          <div className="min-w-0 flex-1">
            <p className="eyebrow text-gold-soft/90">Lista de desejos</p>
            <h1 className="mt-2 break-words font-display text-3xl leading-tight tracking-tight sm:text-4xl">{name}</h1>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <BudgetBadge budget={group.budget} light />
              {isOrganizer && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] px-3 py-1 text-xs font-semibold text-gold-soft">
                  <CrownIcon className="size-3.5" /> Organizador
                </span>
              )}
            </div>
          </div>
        </div>

        <dl className="relative mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat icon={<GiftIcon className="size-4" />} label="Opções na lista" value={String(wishes.length)} />
          <Stat icon={<TagIcon className="size-4" />} label="Faixa de preço" value={range ?? "—"} small={Boolean(range && range.includes(" a "))} />
          <div className="col-span-2 sm:col-span-1">
            <Stat
              icon={<CalendarIcon className="size-4" />}
              label="Troca de presentes"
              value={formatDate(group.event_date) ?? "Sem data"}
              small
            />
          </div>
        </dl>
      </section>

      {wishes.length === 0 ? (
        <div className="card mx-auto mt-8 max-w-md px-6 py-12 text-center">
          <p className="float text-4xl">🤫</p>
          <p className="mt-3 font-display text-xl">{first} ainda não montou a lista</p>
          <p className="mt-2 text-sm text-ink/55">
            Volte mais tarde ou dê um toque discreto no grupo para todo mundo cadastrar suas opções.
          </p>
        </div>
      ) : (
        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl tracking-tight">O que {first} quer ganhar</h2>
              <p className="mt-1 text-sm text-cream/60">
                Todas as opções cabem no valor do grupo. Escolha a que preferir. 🎁
              </p>
            </div>
          </div>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {wishes.map((w, i) => (
              <WishCard key={w.id} wish={w} index={i} />
            ))}
          </ul>
          <p className="mt-8 text-center text-xs text-cream/45">
            Os preços foram informados na hora do cadastro e podem mudar na loja.
          </p>
        </section>
      )}
    </>
  );
}

function Stat({
  icon,
  label,
  value,
  small = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className="h-full rounded-2xl bg-black/20 px-4 py-3 shadow-[inset_0_2px_6px_rgb(0_0_0/0.25)]">
      <dt className="flex items-center gap-1.5 text-xs text-cream/55">
        <span className="text-gold-soft/80">{icon}</span>
        {label}
      </dt>
      <dd className={`mt-1 truncate font-display font-semibold ${small ? "text-lg" : "text-2xl"}`}>{value}</dd>
    </div>
  );
}
