"use client";

import { useActionState, useState } from "react";
import { addCategory, removeCategory, updateCategory, type FormState } from "@/app/actions";
import type { Category } from "@/lib/data";
import { ConfirmSubmit, FormMessage, SubmitButton } from "./form-bits";
import { PencilIcon, TrashIcon } from "./icons";

const EMOJIS = ["🎁", "🎄", "☕", "📚", "🎧", "🍫", "🌸", "🧴", "👕", "📿", "🎲", "🕯️", "🏠", "💻", "⚽", "🧸", "🍷", "🎨", "🐶", "✈️"];

function EmojiPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <input type="hidden" name="emoji" value={value} />
      <div className="flex flex-wrap gap-1.5">
        {EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => onChange(e)}
            aria-pressed={value === e}
            aria-label={`Emoji ${e}`}
            className={`grid size-9 place-items-center rounded-xl text-lg transition ${
              value === e ? "chip3d scale-110 ring-2 ring-berry" : "hover:bg-ink/5"
            }`}
          >
            {e}
          </button>
        ))}
        <input
          aria-label="Outro emoji"
          value={EMOJIS.includes(value) ? "" : value}
          onChange={(ev) => onChange(ev.target.value.trim() || "🎁")}
          placeholder="Outro"
          maxLength={8}
          className="field h-9 w-20 rounded-xl px-2 text-center text-sm"
        />
      </div>
    </div>
  );
}

export function NewCategoryForm() {
  const [round, setRound] = useState(0);
  const [state, action] = useActionState(async (prev: FormState, fd: FormData) => {
    const res = await addCategory(prev, fd);
    if (res?.ok) setRound((n) => n + 1);
    return res;
  }, undefined);

  return (
    <form action={action} className="space-y-4">
      <NewCategoryFields key={round} initial={state?.error ? state.values : undefined} />
      <FormMessage state={state} />
      <SubmitButton className="btn-primary h-12 w-full" pendingText="Criando…">
        Criar categoria
      </SubmitButton>
    </form>
  );
}

function NewCategoryFields({ initial }: { initial?: Record<string, string> }) {
  const [emoji, setEmoji] = useState(initial?.emoji || "🎁");
  const [name, setName] = useState(initial?.name ?? "");
  return (
    <>
      <div>
        <label className="label" htmlFor="cat-name">
          Nome
        </label>
        <div className="flex items-center gap-3">
          <span className="chip3d grid size-12 shrink-0 place-items-center text-2xl">{emoji}</span>
          <input
            id="cat-name"
            name="name"
            className="field"
            placeholder="Ex.: Games, Cozinha, Pets"
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
      </div>
      <div>
        <span className="label">Emoji</span>
        <EmojiPicker value={emoji} onChange={setEmoji} />
      </div>
    </>
  );
}

export function CategoryRow({ category: c }: { category: Category }) {
  const [editing, setEditing] = useState(false);
  const [emoji, setEmoji] = useState(c.emoji);
  const [state, action] = useActionState(async (prev: FormState, fd: FormData) => {
    const res = await updateCategory(c.id, c.name, prev, fd);
    if (res?.ok) setEditing(false);
    return res;
  }, undefined);

  if (editing) {
    return (
      <li className="card p-4">
        <form action={action} className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="chip3d grid size-11 shrink-0 place-items-center text-xl">{emoji}</span>
            <input name="name" defaultValue={c.name} maxLength={40} className="field h-11" aria-label="Nome" required autoFocus />
          </div>
          <EmojiPicker value={emoji} onChange={setEmoji} />
          {state?.error && <FormMessage state={state} />}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setEmoji(c.emoji);
                setEditing(false);
              }}
              className="btn-ghost h-10 px-4"
            >
              Cancelar
            </button>
            <SubmitButton className="btn-primary h-10 px-5" pendingText="Salvando…">
              Salvar
            </SubmitButton>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="card group flex items-center gap-3 p-3.5">
      <span className="chip3d grid size-11 shrink-0 place-items-center text-xl">{c.emoji}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{c.name}</p>
        <p className="text-xs text-ink/50">
          {c.product_count === 0
            ? "Nenhum produto"
            : `${c.product_count} ${c.product_count === 1 ? "produto" : "produtos"}`}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="grid size-9 place-items-center rounded-full text-ink/45 transition hover:bg-ink/5 hover:text-ink"
        aria-label={`Editar ${c.name}`}
      >
        <PencilIcon className="size-4" />
      </button>
      <form action={removeCategory.bind(null, c.id)}>
        <ConfirmSubmit
          title={`Excluir “${c.name}”?`}
          message={
            c.product_count
              ? `${c.product_count} ${c.product_count === 1 ? "produto fica" : "produtos ficam"} sem categoria.`
              : "Nenhum produto usa esta categoria."
          }
          confirmLabel="Excluir"
          className="grid size-9 place-items-center rounded-full text-ink/45 transition hover:bg-berry/10 hover:text-berry"
        >
          <TrashIcon className="size-4" />
        </ConfirmSubmit>
      </form>
    </li>
  );
}
