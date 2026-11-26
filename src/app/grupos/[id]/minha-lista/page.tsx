import type { Metadata } from "next";
import { PRIVATE, pageMeta } from "@/lib/seo";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { getGroupForMember, listCategoriesSafe, listWishes, MAX_WISHES } from "@/lib/data";
import { money } from "@/lib/format";
import { BackLink, Container, PageSkeleton } from "@/components/ui";
import { MyWishlist } from "@/components/my-wishlist";

export const metadata: Metadata = pageMeta(
  "Minha lista",
  "Monte sua lista de desejos dentro do valor do grupo. Quem te tirou escolhe uma das opções.",
  PRIVATE,
);

const RECOMMENDED = 3;

export default function Page({ params }: PageProps<"/grupos/[id]/minha-lista">) {
  return (
    <Container>
      <Suspense fallback={<PageSkeleton />}>
        <Content params={params} />
      </Suspense>
    </Container>
  );
}

async function Content({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/grupos/${id}/minha-lista`);
  const group = await getGroupForMember(id, user.id);
  if (!group) notFound();
  const [wishes, categories] = await Promise.all([listWishes(id, user.id), listCategoriesSafe()]);
  const done = Math.min(wishes.length, RECOMMENDED);

  return (
    <>
      <BackLink href={`/grupos/${id}`}>{group.name}</BackLink>

      <section className="night rise relative mt-5 overflow-hidden rounded-[2rem] px-5 py-7 sm:px-10 sm:py-8">
        <span aria-hidden className="ornament gold right-8 top-5 hidden size-9 lg:block" />
        <span aria-hidden className="ornament right-20 top-12 hidden size-6 lg:block" style={{ animationDelay: "-3s" }} />

        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <p className="eyebrow text-gold-soft">Minha lista de desejos 🎁</p>
            <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-[2.6rem] sm:leading-tight">
              O que você quer ganhar?
            </h1>
            <p className="mt-2 max-w-lg text-sm text-cream/65">
              Cadastre algumas opções dentro do valor. Quem te tirou vê esta lista e escolhe uma, sem saber
              que você sabe. 🤫
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:mr-16 lg:flex">
            <div className="rounded-2xl bg-black/20 px-4 py-4 shadow-[inset_0_2px_6px_rgb(0_0_0/0.25)]">
              <p className="text-xs text-cream/55">Valor máximo</p>
              <p className="gold-text mt-0.5 font-display text-2xl font-semibold sm:text-3xl">{money(group.budget)}</p>
            </div>
            <div className="rounded-2xl lg:min-w-40 bg-black/20 px-5 py-4 shadow-[inset_0_2px_6px_rgb(0_0_0/0.25)]">
              <p className="text-xs text-cream/55">Sua lista</p>
              <p className="mt-0.5 font-display text-3xl font-semibold">
                {wishes.length}
                <span className="text-base font-normal text-cream/45"> / {MAX_WISHES}</span>
              </p>
              <div className="mt-2 flex gap-1" aria-label={`${done} de ${RECOMMENDED} opções recomendadas`}>
                {Array.from({ length: RECOMMENDED }, (_, i) => (
                  <span key={i} className={`h-1.5 flex-1 rounded-full ${i < done ? "bg-gold" : "bg-cream/15"}`} />
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-cream/50">
                {wishes.length >= RECOMMENDED ? "Ótima lista! ✨" : `Recomendado: ${RECOMMENDED} opções`}
              </p>
            </div>
          </div>
        </div>
      </section>

      <MyWishlist
        groupId={id}
        budget={group.budget}
        wishes={wishes}
        max={MAX_WISHES}
        categories={categories.map((c) => [c.emoji, c.name] as const)}
      />
    </>
  );
}
