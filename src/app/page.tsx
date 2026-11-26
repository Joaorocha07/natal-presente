import Link from "next/link";
import { getShowcaseProducts } from "@/lib/data";
import { money, shortTitle } from "@/lib/format";
import { Snow } from "@/components/snow";
import { Village } from "@/components/village";
import { ArrowRightIcon, ExternalIcon, GiftIcon, LinkIcon, UsersIcon } from "@/components/icons";

const STEPS = [
  {
    icon: UsersIcon,
    title: "Crie o grupo",
    text: "Dê um nome, escolha o valor do presente e a data da troca.",
  },
  {
    icon: LinkIcon,
    title: "Convide a turma",
    text: "Compartilhe o link no WhatsApp. Cada um entra com a própria conta.",
  },
  {
    icon: GiftIcon,
    title: "Monte sua lista",
    text: "Cada pessoa cadastra várias opções dentro do valor, com link da loja.",
  },
];

/** Exemplo usado enquanto o admin não cadastrou produtos */
const PREVIEW = [
  { id: "a", emoji: "☕", title: "Caneca térmica inox", price: 5990, store: "Mercado Livre", image: null, url: null },
  { id: "b", emoji: "📚", title: "Livro “Tudo é rio”", price: 4490, store: "Amazon", image: null, url: null },
  { id: "c", emoji: "🕯️", title: "Vela aromática de canela", price: 3990, store: "Mercado Livre", image: null, url: null },
];

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="night relative overflow-hidden text-cream">
        <Snow />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 pb-20 pt-14 sm:px-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:items-center md:pb-28 md:pt-24">
          <div className="rise">
            <p className="eyebrow text-gold-soft/90">Natal 2026 · Amigo oculto sem erro</p>
            <h1 className="mt-5 font-display text-[2.6rem] leading-[1.05] tracking-tight sm:text-6xl">
              O presente certo,
              <br />
              <span className="gold-text italic">dentro do valor.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-cream/75 sm:text-lg">
              Crie o grupo, defina o valor e convide todo mundo. Depois do sorteio, é só abrir o
              perfil do seu amigo oculto e escolher uma das opções que ele mesmo indicou.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/grupos/novo" className="btn-gold h-12 px-7 text-[15px]">
                Criar meu grupo <ArrowRightIcon className="size-4" />
              </Link>
              <Link href="/entrar" className="btn-ghost-light h-12 px-7 text-[15px]">
                Já tenho conta
              </Link>
            </div>
            <p className="mt-6 text-xs text-cream/50">Gratuito · Sugestões de até R$ 100 do Mercado Livre e Amazon</p>
          </div>

          <Showcase />
        </div>
        {/* Diorama 3D */}
        <div className="relative mx-auto max-w-6xl px-4 pb-10 sm:px-6">
          <Village />
        </div>
        {/* Beirada de neve */}
        <div className="relative h-3 bg-cream" />
        <div className="snow-edge relative" />
      </section>

      {/* Como funciona */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <p className="eyebrow text-berry text-center">Como funciona</p>
        <h2 className="mt-3 text-center font-display text-3xl tracking-tight sm:text-4xl">
          Três passos. Zero presente encalhado.
        </h2>
        <div className="mt-12 grid gap-4 sm:grid-cols-3 sm:gap-6">
          {STEPS.map((s, i) => (
            <div key={s.title} className="card group rise p-6 sm:p-7" style={{ animationDelay: `${i * 120}ms` }}>
              <div className="flex items-center justify-between">
                <span className="grid size-12 place-items-center rounded-2xl bg-pine-700 text-gold-soft">
                  <s.icon className="size-5" />
                </span>
                <span className="font-display text-4xl font-semibold italic text-berry/75 transition group-hover:text-berry">
                  0{i + 1}
                </span>
              </div>
              <h3 className="mt-6 font-display text-xl">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/65">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto mb-20 max-w-6xl px-4 sm:px-6">
        <div className="night relative overflow-hidden rounded-[2rem] px-6 py-14 text-center text-cream sm:px-12">
          <Snow className="opacity-60" />
          <p className="relative font-display text-3xl tracking-tight sm:text-4xl">
            Que tal acabar com a <span className="gold-text italic">meia de presente</span>?
          </p>
          <p className="relative mx-auto mt-4 max-w-md text-cream/70">
            Leva menos de um minuto para criar o grupo e mandar o convite.
          </p>
          <Link href="/grupos/novo" className="btn-gold relative mt-8 h-12 px-8">
            Começar agora
          </Link>
        </div>
      </section>
    </main>
  );
}

/** Cartão do hero: produtos reais do catálogo (ou o exemplo, se ainda não houver) */
async function Showcase() {
  const real = await getShowcaseProducts(3);
  const items: {
    id: string;
    emoji: string;
    title: string;
    price: number;
    store: string | null;
    image: string | null;
    url: string | null;
  }[] = real.length ? real : PREVIEW;
  // "até R$ 100": arredonda o mais caro para cima, de 50 em 50
  const ceiling = Math.max(10000, Math.ceil(Math.max(...items.map((i) => i.price)) / 5000) * 5000);

  return (
    <div className="rise relative min-w-0 [animation-delay:150ms]">
      <div className="absolute -inset-6 rounded-[2.5rem] bg-gold/10 blur-2xl" aria-hidden />
      <div className="relative surface-light float-slow rounded-[2rem] border border-cream/10 bg-cream p-5 text-ink shadow-2xl sm:p-6">
        <div className="flex items-center gap-3">
          {real.length ? (
            <span className="grid size-11 place-items-center rounded-full bg-berry text-cream">
              <GiftIcon className="size-5" />
            </span>
          ) : (
            <span className="grid size-11 place-items-center rounded-full bg-pine-700 font-semibold text-cream">MC</span>
          )}
          <div>
            <p className="font-display text-lg leading-tight">{real.length ? "Presentes em destaque" : "Lista da Marina"}</p>
            <p className="text-xs text-ink/55">
              {real.length ? "Produtos reais" : "Família Souza"} · até {money(ceiling).replace(",00", "")}
            </p>
          </div>
          <span className="ml-auto shrink-0 whitespace-nowrap rounded-full bg-berry/10 px-3 py-1 text-[11px] font-semibold text-berry">
            {items.length} {items.length === 1 ? "opção" : "opções"}
          </span>
        </div>
        <ul className="mt-5 space-y-2.5">
          {items.map((p) => {
            const body = (
              <>
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.image}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="size-12 shrink-0 rounded-xl bg-white object-contain p-0.5 ring-1 ring-ink/5"
                  />
                ) : (
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-cream-200 text-2xl">{p.emoji}</span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" title={p.title}>
                    {real.length ? shortTitle(p.title) : p.title}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-ink/50">
                    <span className="truncate">{p.store}</span>
                    {p.url && <ExternalIcon className="size-3 opacity-0 transition group-hover:opacity-100" />}
                  </p>
                </div>
                <span className="shrink-0 font-display text-base font-semibold text-pine-700">{money(p.price)}</span>
              </>
            );
            const row = "flex items-center gap-3 rounded-2xl border border-ink/[0.06] bg-white p-3";
            return (
              <li key={p.id}>
                {p.url ? (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className={`${row} group transition hover:-translate-y-0.5 hover:border-berry/25 hover:shadow-md`}
                  >
                    {body}
                  </a>
                ) : (
                  <div className={row}>{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
