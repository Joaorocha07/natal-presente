import type { Metadata } from "next";
import { PRIVATE, pageMeta } from "@/lib/seo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { getGroupForMember, listMembers } from "@/lib/data";
import { firstName, formatDate, money } from "@/lib/format";
import { deleteGroup, leaveGroup, makeOrganizer, removeMember, updateGroup } from "@/app/actions";
import { Avatar, BackLink, BudgetBadge, Container, PageSkeleton } from "@/components/ui";
import { InviteShare } from "@/components/invite-share";
import { GroupForm } from "@/components/group-form";
import { ConfirmSubmit } from "@/components/form-bits";
import { Snow } from "@/components/snow";
import { ArrowRightIcon, CalendarIcon, CrownIcon, GiftIcon, UserMinusIcon, UsersIcon } from "@/components/icons";

export const metadata: Metadata = pageMeta(
  "Grupo de amigo oculto",
  "Veja quem participa, a data da troca e a lista de desejos de cada pessoa do grupo.",
  PRIVATE,
);

export default function Page({ params, searchParams }: PageProps<"/grupos/[id]">) {
  return (
    <Container>
      <Suspense fallback={<PageSkeleton />}>
        <GroupView params={params} searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function GroupView({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const { novo } = await searchParams;
  const user = await requireUser(`/grupos/${id}`);
  const group = await getGroupForMember(id, user.id);
  if (!group) notFound();

  const members = await listMembers(id);
  const me = members.find((m) => m.id === user.id);
  const others = members.filter((m) => m.id !== user.id);
  const isOwner = group.owner_id === user.id;

  return (
    <>
      <BackLink href="/grupos">Meus grupos</BackLink>

      {novo && (
        <div className="rise mt-5 rounded-3xl border border-gold/40 bg-gold/10 px-5 py-4 text-sm">
          <strong className="font-semibold">Grupo criado! 🎉</strong> Agora copie o link abaixo e mande para a turma.
        </div>
      )}

      {/* Cabeçalho do grupo */}
      <section className="night rise relative mt-5 overflow-hidden rounded-[2rem] p-6 text-cream sm:p-10">
        <Snow className="opacity-50" />
        <span className="ornament gold -right-3 -top-3 size-10 opacity-90" aria-hidden />
        <span className="ornament -left-2 bottom-6 size-7 [animation-delay:-3s]" aria-hidden />
        <div className="relative grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,380px)] md:items-end">
          <div>
            <BudgetBadge budget={group.budget} light />
            <h1 className="mt-4 break-words font-display text-4xl leading-tight tracking-tight sm:text-5xl">{group.name}</h1>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-cream/70">
              <span className="inline-flex items-center gap-1.5">
                <UsersIcon className="size-4" /> {members.length} {members.length === 1 ? "participante" : "participantes"}
              </span>
              {group.event_date && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarIcon className="size-4" /> Troca em {formatDate(group.event_date)}
                </span>
              )}
            </div>
          </div>
          <div>
            <p className="eyebrow mb-3 text-gold-soft/80">Convide a turma</p>
            <InviteShare code={group.invite_code} groupName={group.name} budget={money(group.budget)} />
          </div>
        </div>
      </section>

      {/* Minha lista */}
      <Link
        href={`/grupos/${id}/minha-lista`}
        className="card group mt-6 flex items-center gap-4 p-5 transition hover:-translate-y-0.5 sm:p-6"
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-berry text-cream">
          <GiftIcon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg">Minha lista de desejos</p>
          <p className="text-sm text-ink/55">
            {me?.wish_count
              ? `${me.wish_count} ${me.wish_count === 1 ? "opção cadastrada" : "opções cadastradas"} · toque para editar`
              : `Cadastre opções de até ${money(group.budget)} para quem te tirou`}
          </p>
        </div>
        {!me?.wish_count && (
          <span className="hidden rounded-full bg-berry px-3 py-1 text-xs font-semibold text-cream sm:inline">Pendente</span>
        )}
        <ArrowRightIcon className="size-5 text-berry transition group-hover:translate-x-1" />
      </Link>

      {/* Participantes */}
      <section className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl tracking-tight">Quem você tirou?</h2>
            <p className="mt-1 text-sm text-ink/55">Abra o perfil do seu amigo oculto para ver o que ele quer ganhar.</p>
          </div>
        </div>

        {others.length === 0 ? (
          <div className="card mt-5 px-6 py-12 text-center">
            <p className="float text-4xl">⛄</p>
            <p className="mt-3 font-medium">Ainda só tem você por aqui</p>
            <p className="mt-1 text-sm text-ink/55">Mande o link de convite para os participantes entrarem.</p>
          </div>
        ) : (
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((m, i) => (
              <li key={m.id} className="rise" style={{ animationDelay: `${i * 70}ms` }}>
                <Link
                  href={`/grupos/${id}/membro/${m.id}`}
                  className="card group flex items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:border-berry/30"
                >
                  <Avatar id={m.id} name={m.name} src={m.avatar_url} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{m.name}</p>
                    <p className={`text-xs ${m.wish_count ? "text-pine-700" : "text-ink/45"}`}>
                      {m.wish_count
                        ? `${m.wish_count} ${m.wish_count === 1 ? "opção" : "opções"} na lista`
                        : "Lista ainda vazia"}
                    </p>
                  </div>
                  {m.id === group.owner_id && (
                    <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold text-[#8a6d12]">
                      Organizador
                    </span>
                  )}
                  <ArrowRightIcon className="size-4 text-ink/30 transition group-hover:translate-x-0.5 group-hover:text-berry" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Organizador: gerenciar participantes */}
      {isOwner && others.length > 0 && (
        <section className="card mt-12 p-0">
          <div className="flex items-center gap-3 p-5 sm:p-6">
            <span className="chip3d grid size-11 shrink-0 place-items-center text-[#a8752d]">
              <CrownIcon className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-xl">Gerenciar participantes</h2>
              <p className="text-sm text-ink/55">
                Só você vê esta parte. Passe a organização para outra pessoa ou remova quem não participa mais.
              </p>
            </div>
          </div>
          <ul className="divide-y divide-ink/[0.06] border-t border-ink/[0.06]">
            {others.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4 sm:px-6">
                <div className="flex min-w-0 flex-1 basis-48 items-center gap-3">
                  <Avatar id={m.id} name={m.name} src={m.avatar_url} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{m.name}</p>
                    <p className="text-xs text-ink/45">
                      {m.wish_count
                        ? `${m.wish_count} ${m.wish_count === 1 ? "opção" : "opções"} na lista`
                        : "Lista vazia"}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <form action={makeOrganizer.bind(null, id, m.id)}>
                    <ConfirmSubmit
                      message={`Passar a organização do grupo para ${m.name}? Você continua participando, mas deixa de poder editar o grupo e gerenciar as pessoas.`}
                      className="btn h-9 gap-1.5 border border-gold/40 bg-gold/10 px-3 text-[13px] text-[#7a5c0f] hover:bg-gold/20"
                    >
                      <CrownIcon className="size-4" /> Tornar organizador
                    </ConfirmSubmit>
                  </form>
                  <form action={removeMember.bind(null, id, m.id)}>
                    <ConfirmSubmit
                      message={`Remover ${m.name} do grupo? A lista de desejos dessa pessoa neste grupo será apagada.`}
                      className="btn h-9 gap-1.5 border border-berry/25 px-3 text-[13px] text-berry hover:bg-berry/5"
                    >
                      <UserMinusIcon className="size-4" />
                      <span className="hidden sm:inline">Remover</span>
                      <span className="sr-only sm:hidden">Remover {m.name}</span>
                    </ConfirmSubmit>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Configurações */}
      <section className={isOwner && others.length > 0 ? "mt-6" : "mt-12"}>
        {isOwner ? (
          <details className="card group p-0">
            <summary className="flex cursor-pointer list-none items-center justify-between p-5 font-medium sm:p-6">
              Configurações do grupo
              <span className="text-ink/40 transition group-open:rotate-45">＋</span>
            </summary>
            <div className="border-t border-ink/[0.06] p-5 sm:p-6">
              <div className="max-w-md">
                <GroupForm
                  action={updateGroup.bind(null, id)}
                  initial={{ name: group.name, budget: group.budget, eventDate: group.event_date }}
                  submitLabel="Salvar alterações"
                />
              </div>
              <form action={deleteGroup.bind(null, id)} className="mt-8 border-t border-ink/[0.06] pt-6">
                <p className="text-sm text-ink/60">Excluir o grupo apaga as listas de todos os participantes.</p>
                <ConfirmSubmit
                  message="Excluir o grupo e todas as listas? Isso não pode ser desfeito."
                  className="btn mt-3 border border-berry/30 text-berry hover:bg-berry/5"
                >
                  Excluir grupo
                </ConfirmSubmit>
              </form>
            </div>
          </details>
        ) : (
          <form action={leaveGroup.bind(null, id)} className="text-center">
            <ConfirmSubmit
              message="Sair do grupo? Sua lista de desejos deste grupo será apagada."
              className="text-sm text-ink/45 underline-offset-4 hover:text-berry hover:underline"
            >
              Sair do grupo, {firstName(user.name)}?
            </ConfirmSubmit>
          </form>
        )}
      </section>
    </>
  );
}
