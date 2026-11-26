import { Suspense } from "react";
import { Snow } from "./snow";
import { AuthForm } from "./auth-form";
import { VillageArt } from "./village-art";

const PERKS = ["Lista de desejos com link da loja", "Sugestões dentro do valor do grupo", "Convite por WhatsApp em um toque"];

export function AuthShell({
  mode,
  searchParams,
}: {
  mode: "login" | "register";
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <main className="mx-auto grid w-full max-w-6xl flex-1 gap-8 px-4 py-8 sm:px-6 md:grid-cols-2 md:items-stretch md:py-16">
      <div className="night rise relative hidden min-h-[520px] overflow-hidden rounded-[2rem] text-cream md:flex md:flex-col">
        <Snow />
        <span className="ornament left-8 top-10 size-9" aria-hidden />
        <span className="ornament gold right-10 top-24 size-6 [animation-delay:-2s]" aria-hidden />
        <span className="ornament green left-24 top-40 size-5 [animation-delay:-4s]" aria-hidden />

        <div className="relative px-10 pt-14">
          <p className="eyebrow text-gold-soft/90">Natal 2026</p>
          <p className="mt-4 font-display text-4xl leading-[1.1] tracking-tight">
            {mode === "login" ? (
              <>
                Bem-vindo
                <br />
                <span className="gold-text italic">de volta.</span>
              </>
            ) : (
              <>
                Seu Natal
                <br />
                <span className="gold-text italic">mais fácil.</span>
              </>
            )}
          </p>
          <ul className="mt-6 space-y-2.5 text-sm text-cream/80">
            {PERKS.map((p) => (
              <li key={p} className="flex items-center gap-2.5">
                <span className="grid size-5 place-items-center rounded-full bg-gold/25 text-[11px] text-gold-soft">✓</span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        <VillageArt className="absolute inset-x-0 bottom-0 h-[58%] w-full" />
      </div>

      <div className="rise relative mx-auto w-full max-w-md [animation-delay:120ms] md:self-center">
        <span className="float absolute -top-6 -right-3 z-10 text-4xl drop-shadow-lg" aria-hidden>
          🎄
        </span>
        <div className="card p-6 sm:p-9">
          <p className="eyebrow text-berry">{mode === "login" ? "Entrar" : "Criar conta"}</p>
          <h1 className="mt-2 font-display text-3xl tracking-tight">
            {mode === "login" ? "Acesse sua conta" : "Comece em segundos"}
          </h1>
          <p className="mt-2 text-sm text-ink/60">
            {mode === "login"
              ? "Veja as listas do seu grupo e acerte no presente."
              : "Crie seu grupo ou entre pelo convite de um amigo."}
          </p>
          <div className="mt-7">
            <Suspense fallback={<div className="h-72 rounded-2xl skeleton" />}>
              <FormWithNext mode={mode} searchParams={searchParams} />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  );
}

async function FormWithNext({
  mode,
  searchParams,
}: {
  mode: "login" | "register";
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const next = (await searchParams).next;
  return <AuthForm mode={mode} next={typeof next === "string" ? next : ""} />;
}
