import type { Metadata } from "next";
import { PRIVATE, pageMeta } from "@/lib/seo";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { createGroup } from "@/app/actions";
import { GroupForm } from "@/components/group-form";
import { BackLink, Container } from "@/components/ui";
import { Snow } from "@/components/snow";
import { VillageArt } from "@/components/village-art";

export const metadata: Metadata = pageMeta(
  "Novo grupo",
  "Crie um grupo de amigo oculto em segundos: defina o valor do presente, a data da troca e convide a turma pelo WhatsApp.",
  PRIVATE,
);

const TIPS = [
  ["💰", "Valor igual para todos", "As sugestões e as listas respeitam o valor máximo."],
  ["📅", "Data da troca", "Todo mundo vê a contagem regressiva até o grande dia."],
  ["💬", "Convite pelo WhatsApp", "Depois de criar, você recebe um link para mandar à turma."],
] as const;

export default function Page() {
  return (
    <Container>
      <BackLink href="/grupos">Meus grupos</BackLink>
      <div className="mt-5 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:items-stretch">
        <aside className="night rise relative hidden overflow-hidden rounded-[2rem] text-cream md:flex md:flex-col">
          <Snow />
          <span className="ornament left-8 top-10 size-9" aria-hidden />
          <span className="ornament gold right-10 top-20 size-6 [animation-delay:-2s]" aria-hidden />
          <div className="relative px-10 pt-14">
            <p className="eyebrow text-gold-soft/90">Novo grupo</p>
            <p className="mt-4 font-display text-4xl leading-[1.1] tracking-tight">
              Junte a turma
              <br />
              <span className="gold-text italic">em um minuto.</span>
            </p>
            <ul className="mt-8 space-y-5">
              {TIPS.map(([emoji, title, text]) => (
                <li key={title} className="flex gap-3.5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white/10 text-xl">{emoji}</span>
                  <div>
                    <p className="font-medium">{title}</p>
                    <p className="text-sm text-cream/65">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <VillageArt className="mt-auto h-48 w-full" />
        </aside>

        <div className="card rise p-6 sm:p-9 [animation-delay:120ms]">
          <p className="eyebrow text-berry">Novo grupo</p>
          <h1 className="mt-2 font-display text-3xl tracking-tight">Vamos organizar o amigo oculto</h1>
          <p className="mt-2 text-sm text-ink/60">Depois você recebe um link para convidar a turma.</p>
          <div className="mt-8">
            <Suspense fallback={<div className="h-80 rounded-2xl skeleton" />}>
              <Form />
            </Suspense>
          </div>
        </div>
      </div>
    </Container>
  );
}

async function Form() {
  await requireUser("/grupos/novo");
  return <GroupForm action={createGroup} submitLabel="Criar grupo" />;
}
