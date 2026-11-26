"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { addWishFromForm, addWishFromProduct, previewWishLink, removeWish, type FormState } from "@/app/actions";
import type { Wish } from "@/lib/data";
import type { Product, SearchResult } from "@/lib/products";
import { money } from "@/lib/format";
import { FormMessage, Spinner, SubmitButton } from "./form-bits";
import { WishThumb } from "./ui";
import { CheckIcon, ExternalIcon, LinkIcon, PlusIcon, SearchIcon, TrashIcon } from "./icons";

/** Aba "Colar link" desligada por enquanto (sem a API do Mercado Livre, os dados vêm incompletos) */
const PASTE_LINK_ENABLED = false;

const QUICK = [
  ["☕", "Caneca"],
  ["📚", "Livro"],
  ["🎧", "Fone"],
  ["🍫", "Chocolate"],
  ["🧴", "Skincare"],
  ["🎲", "Jogo"],
  ["🕯️", "Vela"],
  ["🧦", "Pijama"],
  ["🌸", "Perfume"],
  ["📿", "Colar"],
] as const;

export function MyWishlist({
  groupId,
  budget,
  wishes,
  max,
  categories = [],
}: {
  groupId: string;
  budget: number;
  wishes: Wish[];
  max: number;
  /** categorias do admin: [emoji, nome] */
  categories?: (readonly [string, string])[];
}) {
  const [tab, setTab] = useState<"search" | "manual">("search");
  // Categorias do admin primeiro; completa com os atalhos padrão sem repetir
  const seen = new Set(categories.map(([, n]) => n.toLowerCase()));
  const quick = [...categories, ...QUICK.filter(([, n]) => !seen.has(n.toLowerCase()))].slice(0, 14);
  const full = wishes.length >= max;

  return (
    <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:items-start">
      {/* Lista atual */}
      <section className="card rise p-5 sm:p-6 lg:sticky lg:top-24" style={{ animationDelay: "100ms" }}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">Minhas opções</h2>
          <span className="rounded-full bg-ink/5 px-2.5 py-0.5 text-xs font-medium text-ink/60">
            {wishes.length}/{max}
          </span>
        </div>

        {wishes.length === 0 ? (
          <div className="well mt-5 px-5 py-9 text-center">
            <p className="float text-4xl">🎄</p>
            <p className="mt-3 font-medium">Sua lista está vazia</p>
            <p className="mx-auto mt-1 max-w-56 text-sm text-ink/55">
              Escolha uma das sugestões ao lado para começar.
            </p>
          </div>
        ) : (
          <ol className="mt-4 space-y-2.5">
            {wishes.map((w, i) => (
              <WishRow key={w.id} wish={w} index={i} />
            ))}
          </ol>
        )}

        {wishes.length < 3 && (
          <div className="mt-5 flex gap-3 rounded-2xl bg-gold/12 px-4 py-3">
            <span className="text-lg">💡</span>
            <p className="text-xs leading-relaxed text-ink/70">
              <strong className="font-semibold text-ink">Dica:</strong> com pelo menos 3 opções, quem te tirou
              tem mais liberdade para escolher, e você ainda ganha algo que quer.
            </p>
          </div>
        )}
      </section>

      {/* Adicionar */}
      <section className="card rise min-w-0 overflow-hidden p-0" style={{ animationDelay: "180ms" }}>
        {PASTE_LINK_ENABLED && (
        <div className="p-2">
          <div className="well grid grid-cols-2 gap-1 p-1">
            {(
              [
                ["search", "Buscar sugestões", SearchIcon],
                ["manual", "Colar link", LinkIcon],
              ] as const
            ).map(([key, label, Icon]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                aria-pressed={tab === key}
                className={`flex h-11 items-center justify-center gap-2 rounded-[0.9rem] text-sm font-medium transition ${
                  tab === key ? "chip3d text-ink" : "text-ink/55 hover:text-ink"
                }`}
              >
                <Icon className={`size-4 ${tab === key ? "text-berry" : ""}`} /> {label}
              </button>
            ))}
          </div>
        </div>
        )}
        <div className={`px-5 pb-6 sm:px-6 ${PASTE_LINK_ENABLED ? "pt-3" : "pt-6"}`}>
          {full ? (
            <p className="rounded-2xl bg-gold/12 px-4 py-3 text-sm">
              Você chegou ao limite de {max} opções. Remova uma para adicionar outra.
            </p>
          ) : tab === "search" || !PASTE_LINK_ENABLED ? (
            <ProductSearch groupId={groupId} budget={budget} wishes={wishes} quick={quick} />
          ) : (
            <ManualForm groupId={groupId} budget={budget} />
          )}
        </div>
      </section>
    </div>
  );
}

function WishRow({ wish, index }: { wish: Wish; index: number }) {
  const [pending, start] = useTransition();
  return (
    <li className={`chip3d flex items-center gap-3 p-2.5 transition ${pending ? "opacity-40" : ""}`}>
      <div className="relative">
        <WishThumb wish={wish} className="size-12" />
        <span className="absolute -left-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-berry text-[10px] font-bold text-cream ring-2 ring-white">
          {index + 1}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{wish.title}</p>
        <p className="text-xs text-ink/50">
          <span className="font-semibold text-pine-700">{money(wish.price)}</span>
          {wish.store && ` · ${wish.store}`}
        </p>
      </div>
      {wish.url && (
        <a
          href={wish.url}
          target="_blank"
          rel="noopener noreferrer"
          className="grid size-8 place-items-center rounded-full text-ink/40 hover:bg-ink/5 hover:text-ink"
          aria-label="Abrir link"
        >
          <ExternalIcon className="size-4" />
        </a>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() => start(() => removeWish(wish.id))}
        className="grid size-8 place-items-center rounded-full text-ink/40 hover:bg-berry/10 hover:text-berry"
        aria-label={`Remover ${wish.title}`}
      >
        <TrashIcon className="size-4" />
      </button>
    </li>
  );
}

function ProductSearch({
  groupId,
  budget,
  wishes,
  quick,
}: {
  groupId: string;
  budget: number;
  wishes: Wish[];
  quick: (readonly [string, string])[];
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reqId = useRef(0);

  async function run(q: string) {
    const id = ++reqId.current;
    setActive(q);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/produtos?q=${encodeURIComponent(q)}&max=${budget}`);
      if (!res.ok) throw new Error();
      const json = (await res.json()) as SearchResult;
      if (id === reqId.current) setResult(json);
    } catch {
      if (id === reqId.current) setError("Não foi possível buscar agora. Tente de novo.");
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }

  useEffect(() => {
    // Carrega as sugestões iniciais uma vez
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void run("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addedTitles = new Set(wishes.map((w) => w.title.toLowerCase()));
  const hasReal = result?.items.some((p) => p.featured);

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run(query);
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="field pl-11"
            placeholder="Ex.: caneca, livro, fone…"
            enterKeyHint="search"
          />
        </div>
        <button type="submit" className="btn-primary h-12 px-5">
          Buscar
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {quick.map(([emoji, q]) => {
          const on = active.toLowerCase() === q.toLowerCase();
          return (
            <button
              key={q}
              type="button"
              onClick={() => {
                const next = on ? "" : q;
                setQuery(next);
                void run(next);
              }}
              className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition ${
                on
                  ? "bg-pine-800 text-cream shadow"
                  : "bg-white text-ink/65 ring-1 ring-ink/10 hover:text-berry hover:ring-berry/40"
              }`}
            >
              <span aria-hidden>{emoji}</span> {q}
            </button>
          );
        })}
      </div>

      {result && !loading && (
        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/50">
          <span className="font-semibold text-ink/70">
            {result.items.length} {result.items.length === 1 ? "resultado" : "resultados"} até {money(budget)}
          </span>
          {hasReal && (
            <span className="inline-flex items-center gap-1">
              <span className="size-2 rounded-full bg-pine-700" /> produtos reais primeiro
            </span>
          )}
          {result.source === "mercadolivre" ? (
            <span>via Mercado Livre</span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <span className="font-semibold text-ink/40">~</span> ideias com preço médio, confira na loja
            </span>
          )}
        </div>
      )}

      {error && <p className="mt-4 rounded-2xl bg-berry/10 px-4 py-3 text-sm text-berry">{error}</p>}

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {loading
          ? Array.from({ length: 6 }, (_, i) => <div key={i} className="h-[148px] rounded-2xl skeleton" />)
          : result?.items.map((p) => (
              <ProductCard key={p.id} product={p} groupId={groupId} added={addedTitles.has(p.title.toLowerCase())} />
            ))}
      </div>

      {!loading && result && result.items.length === 0 && (
        <div className="well mt-4 px-4 py-8 text-center text-sm text-ink/55">
          <p className="text-2xl">🔍</p>
          <p className="mt-2">Nada encontrado até {money(budget)}.</p>
          <p>Tente outra palavra ou escolha uma das categorias.</p>
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, groupId, added }: { product: Product; groupId: string; added: boolean }) {
  const [pending, start] = useTransition();
  const [state, setState] = useState<FormState>();
  const inList = added || !!state?.ok;
  const links = product.links ?? [{ label: product.store, url: product.url }];

  function add() {
    start(async () => {
      const res = await addWishFromProduct(groupId, {
        title: product.title,
        price: product.price,
        url: product.url,
        image: product.image,
        note: product.approx ? "Preço de referência, qualquer modelo parecido serve" : null,
      });
      setState(res);
    });
  }

  return (
    <article
      className={`flex flex-col rounded-2xl bg-white p-3.5 ring-1 transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-14px_rgb(70_40_20/0.5)] ${
        inList ? "ring-pine-700/30" : "ring-ink/[0.07]"
      }`}
    >
      <div className="flex gap-3">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image} alt="" loading="lazy" className="size-[4.5rem] shrink-0 rounded-xl bg-white object-contain" />
        ) : (
          <span className="grid size-[4.5rem] shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cream to-cream-200 text-4xl">
            {product.emoji ?? "🎁"}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-1.5 text-[11px] text-ink/45">
            {product.featured && (
              <span className="rounded-full bg-pine-700/10 px-2 py-0.5 text-[10px] font-semibold text-pine-700">
                Produto real
              </span>
            )}
            {product.category ?? product.store}
          </p>
          <p className="mt-1 line-clamp-2 text-sm font-medium leading-snug">{product.title}</p>
        </div>
      </div>

      <div className="mt-auto flex items-end justify-between gap-2 pt-3">
        <div>
          {product.approx && <p className="text-[10px] uppercase tracking-wide text-ink/40">cerca de</p>}
          <p className="font-display text-xl font-semibold leading-none text-pine-700">{money(product.price)}</p>
        </div>
        <button
          type="button"
          onClick={add}
          disabled={pending || inList}
          className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition ${
            inList ? "bg-pine-700 text-cream" : "bg-berry text-cream shadow-[0_3px_0_#85391f] hover:bg-berry-600 active:translate-y-0.5 active:shadow-none"
          }`}
          aria-label={`Adicionar ${product.title}`}
        >
          {pending ? (
            <Spinner />
          ) : inList ? (
            <>
              <CheckIcon className="size-3.5" /> Na lista
            </>
          ) : (
            <>
              <PlusIcon className="size-3.5" /> Adicionar
            </>
          )}
        </button>
      </div>

      <div className="mt-3 flex items-center gap-1.5 border-t border-ink/[0.06] pt-2.5 text-[11px] text-ink/45">
        <span>Ver em</span>
        {links.map((l, i) => (
          <span key={l.label} className="inline-flex items-center gap-1.5">
            {i > 0 && <span aria-hidden>·</span>}
            <a
              href={l.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center gap-0.5 font-medium text-ink/60 hover:text-berry"
            >
              {l.label} <ExternalIcon className="size-3" />
            </a>
          </span>
        ))}
      </div>
      {state?.error && <p className="mt-2 text-xs text-berry">{state.error}</p>}
    </article>
  );
}

function ManualForm({ groupId, budget }: { groupId: string; budget: number }) {
  const [state, action] = useActionState(addWishFromForm.bind(null, groupId), undefined);
  const v = state?.values;

  // Prévia do link: vale só para o estado atual do formulário (some depois de enviar)
  const [preview, setPreview] = useState<{
    forState: FormState;
    images: string[];
    found: { title: boolean; price: boolean; description: boolean };
    priceCents: number | null;
  } | null>(null);
  const [image, setImage] = useState<string>("");
  const [lookup, setLookup] = useState<{ forState: FormState; error: string } | null>(null);
  const [loading, startLoading] = useTransition();
  const lastUrl = useRef("");
  const formRef = useRef<HTMLFormElement>(null);

  const shown = preview && preview.forState === state ? preview : null;
  const lookupError = lookup && lookup.forState === state ? lookup.error : null;
  const images = shown?.images ?? (v?.image ? [v.image] : []);
  const selected = shown || v?.image ? image || v?.image || "" : "";

  function setField(name: string, value: string) {
    const el = formRef.current?.elements.namedItem(name) as HTMLInputElement | null;
    if (el) el.value = value;
  }

  function readLink(raw: string) {
    const url = raw.trim();
    if (!/^https?:\/\/\S+\.\S+/.test(url) || url === lastUrl.current) return;
    lastUrl.current = url;
    const forState = state;
    startLoading(async () => {
      const res = await previewWishLink(groupId, url);
      if (!res.ok) {
        setPreview(null);
        setLookup({ forState, error: res.error });
        return;
      }
      const p = res.preview;
      setLookup(null);
      setField("url", res.url);
      lastUrl.current = res.url;
      if (p.title) setField("title", p.title);
      if (p.price) setField("price", (p.price / 100).toFixed(2).replace(".", ","));
      if (p.description) setField("note", p.description);
      setImage(p.images[0] ?? "");
      setPreview({
        forState,
        images: p.images,
        priceCents: p.price,
        found: { title: Boolean(p.title), price: Boolean(p.price), description: Boolean(p.description) },
      });
    });
  }

  const overBudget = shown?.priceCents != null && shown.priceCents > budget;

  return (
    // key: remonta os campos com os valores devolvidos (erro) ou vazios (sucesso)
    <form ref={formRef} key={JSON.stringify(state ?? {})} action={action} className="space-y-4">
      <div className="flex gap-3 rounded-2xl bg-pine-700/[0.07] px-4 py-3">
        <span className="text-lg">🔗</span>
        <p className="text-sm text-ink/65">
          Cole o link do produto e a gente preenche nome, foto, preço e descrição. Confira o preço: o limite é{" "}
          <strong className="font-semibold text-ink">{money(budget)}</strong>.
        </p>
      </div>
      <div>
        <label className="label" htmlFor="url">
          Link do produto <span className="font-normal text-ink/40">(opcional)</span>
        </label>
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <LinkIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink/40" />
            <input
              id="url"
              name="url"
              defaultValue={v?.url}
              type="url"
              inputMode="url"
              className="field pl-11"
              placeholder="https://…"
              onPaste={(e) => {
                const text = e.clipboardData.getData("text");
                // espera o valor colado entrar no campo
                setTimeout(() => readLink(text), 0);
              }}
              onBlur={(e) => readLink(e.currentTarget.value)}
            />
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              lastUrl.current = "";
              readLink((formRef.current?.elements.namedItem("url") as HTMLInputElement | null)?.value ?? "");
            }}
            className="btn h-12 shrink-0 border border-ink/12 bg-white px-4 text-ink/70 hover:border-ink/30"
          >
            {loading ? <Spinner /> : <SearchIcon className="size-4" />}
            <span className="hidden sm:inline">{loading ? "Lendo…" : "Buscar dados"}</span>
          </button>
        </div>
        {loading && <p className="mt-2 text-xs text-ink/55">Lendo o produto na loja…</p>}
        {lookupError && !loading && <p className="mt-2 text-xs text-berry">{lookupError}</p>}
      </div>

      {(images.length > 0 || shown) && !loading && (
        <div className="rounded-2xl border border-ink/[0.07] bg-white/70 p-3">
          {images.length > 0 ? (
            <>
              <p className="mb-2 text-xs font-medium text-ink/55">
                {images.length > 1 ? "Escolha a foto" : "Foto do produto"}
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((src) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setImage(src)}
                    aria-pressed={selected === src}
                    className={`relative size-16 shrink-0 overflow-hidden rounded-xl bg-white p-1 ring-2 transition ${
                      selected === src ? "ring-berry" : "ring-ink/10 hover:ring-ink/25"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" referrerPolicy="no-referrer" className="size-full object-contain" />
                    {selected === src && (
                      <span className="absolute right-0.5 top-0.5 grid size-4 place-items-center rounded-full bg-berry text-cream">
                        <CheckIcon className="size-3" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-ink/55">A loja não mostrou fotos deste produto.</p>
          )}
          {shown && (
            <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
              <Found ok={shown.found.title} label="Nome" />
              <Found ok={shown.found.price} label="Preço" />
              <Found ok={images.length > 0} label="Foto" />
              <Found ok={shown.found.description} label="Descrição" />
            </ul>
          )}
          {shown && !shown.found.price && (
            <p className="mt-2 text-xs text-ink/60">Esta loja não informa o preço para outros sites: confira na página e digite abaixo.</p>
          )}
          {overBudget && (
            <p className="mt-2 text-xs font-medium text-berry">
              Este produto custa mais que o limite do grupo ({money(budget)}).
            </p>
          )}
        </div>
      )}
      <input type="hidden" name="image" value={selected} />

      <div>
        <label className="label" htmlFor="title">
          O que é?
        </label>
        <input
          id="title"
          name="title"
          defaultValue={v?.title}
          className="field"
          placeholder="Ex.: Caneca térmica preta 500ml"
          maxLength={140}
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
        <div>
          <label className="label" htmlFor="price">
            Preço
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-ink/45">R$</span>
            <input
              id="price"
              name="price"
              defaultValue={v?.price}
              inputMode="decimal"
              className="field pl-11"
              placeholder="49,90"
              required
            />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="note">
            Descrição ou observação <span className="font-normal text-ink/40">(opcional)</span>
          </label>
          <textarea
            id="note"
            name="note"
            defaultValue={v?.note}
            rows={2}
            className="field h-auto min-h-12 resize-y py-3 leading-snug"
            placeholder="Tamanho M, cor azul…"
            maxLength={200}
          />
        </div>
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary h-12 w-full" pendingText="Adicionando…">
        <PlusIcon className="size-4" /> Adicionar à lista
      </SubmitButton>
    </form>
  );
}

function Found({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={`inline-flex items-center gap-1 ${ok ? "text-pine-700" : "text-ink/40"}`}>
      {ok ? <CheckIcon className="size-3" /> : <span aria-hidden>–</span>} {label}
      <span className="sr-only">{ok ? "encontrado" : "não encontrado"}</span>
    </li>
  );
}
