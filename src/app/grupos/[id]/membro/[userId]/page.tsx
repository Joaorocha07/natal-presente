import type { Metadata } from "next";
import { PRIVATE, pageMeta } from "@/lib/seo";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { getGroupForMember, getMember, listWishes } from "@/lib/data";
import { firstName, money } from "@/lib/format";
import { Avatar, BackLink, BudgetBadge, Container, PageSkeleton, WishCard } from "@/components/ui";

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
  const { name } = member;

  const wishes = await listWishes(id, userId);
  const first = firstName(name);

  return (
    <>
      <BackLink href={`/grupos/${id}`}>{group.name}</BackLink>

      <header className="mt-6 flex flex-col items-center text-center">
        <Avatar id={userId} name={name} src={member.avatar_url} size="lg" />
        <p className="eyebrow mt-5 text-berry">Lista de desejos</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">{name}</h1>
        <div className="mt-3">
          <BudgetBadge budget={group.budget} />
        </div>
      </header>

      {wishes.length === 0 ? (
        <div className="card mx-auto mt-10 max-w-md px-6 py-12 text-center">
          <p className="float text-4xl">🤫</p>
          <p className="mt-3 font-display text-xl">{first} ainda não montou a lista</p>
          <p className="mt-2 text-sm text-ink/55">
            Volte mais tarde ou dê um toque discreto no grupo para todo mundo cadastrar suas opções.
          </p>
        </div>
      ) : (
        <>
          <p className="mx-auto mt-8 max-w-md text-center text-sm text-ink/60">
            {first} escolheu {wishes.length} {wishes.length === 1 ? "opção" : "opções"} de até {money(group.budget)}.
            Escolha a que preferir. 🎁
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {wishes.map((w, i) => (
              <WishCard key={w.id} wish={w} index={i} />
            ))}
          </ul>
          <p className="mt-8 text-center text-xs text-ink/40">
            Os preços foram informados na hora do cadastro e podem mudar na loja.
          </p>
        </>
      )}
    </>
  );
}
