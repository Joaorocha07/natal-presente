"use client";

import Link from "next/link";
import { useActionState, useRef, useState, useTransition } from "react";
import { addCatalogProduct, previewProductLink, uploadProductImage, type FormState } from "@/app/actions";
import type { Category } from "@/lib/data";
import { FormMessage, Spinner, SubmitButton } from "./form-bits";
import { CheckIcon, GiftIcon, LinkIcon, PlusIcon } from "./icons";

const toReais = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");

/** Reduz a foto no navegador (lado maior até 1000px) para enviar rápido e caber no limite */
async function shrinkImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1000 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff"; // PNG transparente vira fundo branco
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const webp = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.85));
  if (webp?.type === "image/webp") return webp;
  return (await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85)))!;
}

export function AdminProductForm({ categories }: { categories: Pick<Category, "id" | "name" | "emoji">[] }) {
  // A cada cadastro com sucesso o contador muda e os campos voltam vazios
  const [round, setRound] = useState(0);
  const [state, formAction] = useActionState(async (prev: FormState, fd: FormData) => {
    const res = await addCatalogProduct(prev, fd);
    if (res?.ok) setRound((n) => n + 1);
    return res;
  }, undefined);

  return (
    <form action={formAction} className="space-y-5">
      <Fields key={round} categories={categories} />
      <FormMessage state={state} />
      <SubmitButton className="btn-primary h-12 w-full" pendingText="Salvando…">
        Cadastrar produto
      </SubmitButton>
    </form>
  );
}

function Fields({ categories }: { categories: Pick<Category, "id" | "name" | "emoji">[] }) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [lookup, setLookup] = useState<{ error?: string; ok?: string }>({});
  const [loading, start] = useTransition();

  // Galeria: fotos do link + enviadas + coladas; `image` é a escolhida
  const [images, setImages] = useState<string[]>([]);
  const [image, setImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteUrl, setPasteUrl] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function addImages(list: string[], select: boolean) {
    setImages((prev) => [...list.filter((i) => !prev.includes(i)), ...prev].slice(0, 12));
    if (select && list[0]) setImage(list[0]);
  }

  function fetchData() {
    if (!url.trim()) return;
    start(async () => {
      const res = await previewProductLink(url.trim());
      if (!res.ok) {
        setLookup({ error: res.error });
        return;
      }
      const p = res.preview;
      if (p.title) setTitle(p.title);
      if (p.price) setPrice(toReais(p.price));
      if (p.images.length) addImages(p.images, !image);
      const missing = [!p.title && "nome", !p.price && "preço", !p.images.length && "foto"].filter(Boolean);
      setLookup({
        ok: missing.length
          ? `Dados encontrados. Faltou: ${missing.join(", ")}. Confira e complete.`
          : `Dados encontrados${p.images.length > 1 ? `, com ${p.images.length} fotos para escolher` : ""}! Confira antes de salvar.`,
      });
    });
  }

  async function upload(files: FileList | null) {
    const list = Array.from(files ?? []).filter((f) => f.type.startsWith("image/")).slice(0, 4);
    if (!list.length) return;
    setUploading(true);
    setImageError(null);
    const urls: string[] = [];
    for (const f of list) {
      try {
        const blob = await shrinkImage(f);
        const fd = new FormData();
        fd.append("file", blob, f.name);
        const res = await uploadProductImage(fd);
        if (res.ok) urls.push(res.url);
        else setImageError(res.error);
      } catch {
        setImageError("Não consegui ler essa imagem.");
      }
    }
    if (urls.length) addImages(urls, true);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function addPasted() {
    try {
      const u = new URL(pasteUrl.trim());
      if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error();
      addImages([u.toString()], true);
      setPasteUrl("");
      setPasteOpen(false);
      setImageError(null);
    } catch {
      setImageError("Link da imagem inválido.");
    }
  }

  return (
    <>
      {/* Link da loja */}
      <div className="well p-3.5">
        <label className="label" htmlFor="url">
          Link do produto na loja
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <LinkIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink/40" />
            <input
              id="url"
              name="url"
              type="url"
              inputMode="url"
              className="field pl-11"
              placeholder="https://www.mercadolivre.com.br/…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  fetchData();
                }
              }}
              required
            />
          </div>
          <button
            type="button"
            onClick={fetchData}
            disabled={loading || !url.trim()}
            className="btn h-12 shrink-0 bg-pine-800 px-4 text-cream hover:bg-pine-700"
          >
            {loading ? <Spinner /> : "Buscar dados"}
          </button>
        </div>
        <p className={`mt-2 text-xs ${lookup.error ? "text-berry" : lookup.ok ? "text-pine-700" : "text-ink/50"}`}>
          {lookup.error ?? lookup.ok ?? "Cole o link e clique em “Buscar dados” para preencher nome, preço e fotos."}
        </p>
      </div>

      {/* Fotos */}
      <div>
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <span className="label mb-0">
            Foto <span className="font-normal text-ink/40">(opcional · clique para escolher)</span>
          </span>
          {image && (
            <button type="button" onClick={() => setImage("")} className="text-xs text-ink/45 hover:text-berry">
              Sem foto
            </button>
          )}
        </div>
        <input type="hidden" name="image" value={image} />

        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {images.map((src) => {
            const on = src === image;
            return (
              <button
                key={src}
                type="button"
                onClick={() => setImage(on ? "" : src)}
                aria-pressed={on}
                aria-label={on ? "Foto escolhida" : "Escolher esta foto"}
                className={`relative aspect-square overflow-hidden rounded-xl bg-white transition ${
                  on ? "ring-[3px] ring-berry" : "ring-1 ring-ink/10 hover:ring-ink/30"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" referrerPolicy="no-referrer" className="size-full object-contain p-1" />
                {on && (
                  <span className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-berry text-cream">
                    <CheckIcon className="size-3" />
                  </span>
                )}
              </button>
            );
          })}

          {/* Enviar do computador (clique ou arraste) */}
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              void upload(e.dataTransfer.files);
            }}
            className={`flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-center text-[11px] font-medium transition ${
              dragging ? "border-berry bg-berry/5 text-berry" : "border-ink/15 text-ink/50 hover:border-berry/50 hover:text-berry"
            }`}
          >
            {uploading ? (
              <Spinner />
            ) : (
              <>
                <PlusIcon className="size-5" />
                Enviar foto
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="sr-only"
              disabled={uploading}
              onChange={(e) => void upload(e.target.files)}
            />
          </label>

          <button
            type="button"
            onClick={() => setPasteOpen((v) => !v)}
            className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-[11px] font-medium transition ${
              pasteOpen ? "border-berry/50 text-berry" : "border-ink/15 text-ink/50 hover:border-berry/50 hover:text-berry"
            }`}
          >
            <LinkIcon className="size-5" />
            Colar link
          </button>
        </div>

        {pasteOpen && (
          <div className="mt-2 flex gap-2">
            <input
              type="url"
              className="field h-10 text-sm"
              placeholder="https://…/foto.jpg"
              value={pasteUrl}
              autoFocus
              onChange={(e) => setPasteUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addPasted();
                }
              }}
            />
            <button type="button" onClick={addPasted} className="btn h-10 shrink-0 bg-pine-800 px-4 text-cream hover:bg-pine-700">
              Adicionar
            </button>
          </div>
        )}
        {imageError ? (
          <p className="mt-2 text-xs text-berry">{imageError}</p>
        ) : (
          images.length === 0 && (
            <p className="mt-2 text-xs text-ink/50">As fotos do link aparecem aqui. Você também pode enviar ou arrastar uma imagem.</p>
          )
        )}
      </div>

      {/* Nome, preço, categoria */}
      <div className="flex gap-4">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" referrerPolicy="no-referrer" className="chip3d size-24 shrink-0 object-contain p-1.5" />
        ) : (
          <span className="chip3d grid size-24 shrink-0 place-items-center text-berry/60">
            <GiftIcon className="size-8" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <label className="label" htmlFor="title">
            Nome do produto
          </label>
          <textarea
            id="title"
            name="title"
            rows={2}
            className="field h-auto resize-none py-3 leading-snug"
            maxLength={140}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="sm:max-w-56">
        <label className="label" htmlFor="price">
            Preço
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-ink/45">R$</span>
            <input
              id="price"
              name="price"
              inputMode="decimal"
              className="field pl-11"
              placeholder="49,90"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <span className="label mb-0">
            Categoria <span className="font-normal text-ink/40">(opcional)</span>
          </span>
          <Link href="/admin/categorias" className="text-xs text-ink/45 hover:text-berry">
            Gerenciar categorias
          </Link>
        </div>
        <input type="hidden" name="category" value={category} />
        {categories.length === 0 ? (
          <p className="well px-4 py-3 text-xs text-ink/55">
            Nenhuma categoria criada ainda. Crie na aba <strong>Categorias</strong>.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => {
              const on = category === c.name;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(on ? "" : c.name)}
                  aria-pressed={on}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm transition ${
                    on
                      ? "bg-pine-800 font-medium text-cream shadow"
                      : "bg-white text-ink/70 ring-1 ring-ink/10 hover:ring-berry/40 hover:text-berry"
                  }`}
                >
                  <span aria-hidden>{c.emoji}</span> {c.name}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
