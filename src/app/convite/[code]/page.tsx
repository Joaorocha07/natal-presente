import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getUser } from "@/lib/auth";
import { getGroupByInvite, isMember } from "@/lib/data";
import { firstName, formatDate, money } from "@/lib/format";
import { PRIVATE, pageMeta } from "@/lib/seo";
import { joinGroup } from "@/app/actions";
import { SubmitButton } from "@/components/form-bits";
import { BudgetBadge, Container } from "@/components/ui";
import { Snow } from "@/components/snow";
import { VillageArt } from "@/components/village-art";

export async function generateMetadata({ params }: PageProps<"/convite/[code]">): Promise<Metadata> {
  const { code } = await params;
  const group = await getGroupByInvite(code).catch(() => null);
  if (!group) {
    return pageMeta("Convite", "Convite para um grupo de amigo oculto. Entre e monte sua lista de desejos.", PRIVATE);
  }
  const details = [
    `presentes até ${money(group.budget).replace(",00", "")}`,
    group.event_date && `troca em ${formatDate(group.event_date)}`,
  ]
    .filter(Boolean)
    .join(" · ");
  return pageMeta(
    `Convite: ${group.name}`,
    `${firstName(group.owner_name)} te convidou para o amigo oculto “${group.name}” 🎁 ${details}. Entre e monte sua lista de desejos.`,
    PRIVATE,
    `/convite/${code}/opengraph-image`,
  );
}

const STEPS = [
  { emoji: "🎟️", title: "Entre no grupo", text: "Crie sua conta (ou entre com o Google) e aceite o convite." },
  { emoji: "📝", title: "Monte sua lista", text: "Cadastre opções de presente dentro do valor, com link da loja." },
  { emoji: "🎁", title: "Acerte no presente", text: "Veja a lista de quem você tirou e escolha uma das opções." },
];

export default function Page({ params }: PageProps<"/convite/[code]">) {
  return (
    <Container>
      <div className="grid gap-6 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:items-stretch">
        <div className="night rise relative flex min-h-[520px] flex-col justify-center overflow-hidden rounded-[2rem] px-6 pb-56 pt-12 text-center text-cream sm:px-10">
          <Snow />
          <VillageArt className="absolute inset-x-0 bottom-0 h-52 w-full" />
          <Suspense fallback={<div className="relative mx-auto h-64 w-full max-w-xs rounded-3xl bg-white/5" />}>
            <Invite params={params} />
          </Suspense>
        </div>

        <section className="card rise flex flex-col justify-center p-6 sm:p-9 [animation-delay:120ms]">
          <p className="eyebrow text-berry">Como funciona</p>
          <h2 className="mt-2 font-display text-2xl tracking-tight sm:text-3xl">Amigo oculto sem presente errado</h2>
          <ol className="mt-7 space-y-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="chip3d grid size-12 shrink-0 place-items-center text-2xl">{s.emoji}</span>
                <div>
                  <p className="font-medium">
                    <span className="mr-1.5 font-display font-semibold italic text-berry">0{i + 1}</span>
                    {s.title}
                  </p>
                  <p className="mt-0.5 text-sm text-ink/60">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="well mt-8 px-4 py-3 text-xs text-ink/60">
            🔒 Sua lista de desejos só aparece para quem participa do grupo.
          </p>
        </section>
      </div>
    </Container>
  );
}

async function Invite({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const user = await getUser();
  const group = await getGroupByInvite(code);

  if (!group) {
    return (
      <div className="relative">
        <p className="float text-5xl">🎅</p>
        <h1 className="mt-5 font-display text-3xl">Convite inválido</h1>
        <p className="mt-3 text-cream/70">Este link não existe mais. Peça um novo para quem organizou o grupo.</p>
        <Link href="/" className="btn-gold mt-8">
          Ir para o início
        </Link>
      </div>
    );
  }

  const already = user && await isMember(group.id, user.id);

  return (
    <div className="relative">
      <p className="float text-5xl">🎁</p>
      <p className="eyebrow mt-6 text-gold-soft/80">{firstName(group.owner_name)} te convidou para o amigo oculto</p>
      <h1 className="mt-3 font-display text-4xl leading-tight tracking-tight">{group.name}</h1>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm text-cream/70">
        <BudgetBadge budget={group.budget} light />
        <span>· {group.member_count} {group.member_count === 1 ? "participante" : "participantes"}</span>
        {group.event_date && <span>· {formatDate(group.event_date)}</span>}
      </div>

      <div className="mt-10">
        {already ? (
          <Link href={`/grupos/${group.id}`} className="btn-gold h-12 w-full">
            Você já participa · abrir grupo
          </Link>
        ) : user ? (
          <form action={joinGroup.bind(null, code)}>
            <SubmitButton className="btn-gold h-12 w-full" pendingText="Entrando…">
              Entrar no grupo como {firstName(user.name)}
            </SubmitButton>
          </form>
        ) : (
          <div className="space-y-3">
            <Link href={`/cadastrar?next=/convite/${code}`} className="btn-gold h-12 w-full">
              Criar conta e participar
            </Link>
            <Link href={`/entrar?next=/convite/${code}`} className="btn-ghost-light h-12 w-full">
              Já tenho conta
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
