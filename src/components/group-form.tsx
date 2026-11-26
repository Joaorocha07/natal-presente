"use client";

import { useActionState, useState } from "react";
import type { FormState } from "@/app/actions";
import { FormMessage, SubmitButton } from "./form-bits";

const PRESETS = [50, 80, 100, 150];

export function GroupForm({
  action,
  initial,
  submitLabel,
}: {
  action: (state: FormState, fd: FormData) => Promise<FormState>;
  initial?: { name: string; budget: number; eventDate: string | null };
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const [budget, setBudget] = useState(String(initial ? initial.budget / 100 : 100));

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <label className="label" htmlFor="name">
          Nome do grupo
        </label>
        <input
          id="name"
          name="name"
          className="field"
          placeholder="Ex.: Família Souza, Firma 2026"
          defaultValue={initial?.name}
          maxLength={60}
          required
        />
      </div>

      <div>
        <span className="label">Valor máximo do presente</span>
        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setBudget(String(v))}
              className={`h-11 rounded-2xl border text-sm font-medium transition ${
                Number(budget) === v
                  ? "border-berry bg-berry text-cream"
                  : "border-ink/12 bg-white text-ink/70 hover:border-ink/30"
              }`}
            >
              R$ {v}
            </button>
          ))}
        </div>
        <div className="relative mt-2">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-ink/45">R$</span>
          <input
            name="budget"
            inputMode="decimal"
            className="field pl-11"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            aria-label="Valor máximo em reais"
            required
          />
        </div>
        <p className="mt-1.5 text-xs text-ink/50">As sugestões e a lista de cada pessoa respeitam esse valor.</p>
      </div>

      <div>
        <label className="label" htmlFor="eventDate">
          Data da troca <span className="font-normal text-ink/40">(opcional)</span>
        </label>
        <input id="eventDate" name="eventDate" type="date" className="field" defaultValue={initial?.eventDate ?? ""} />
      </div>

      <FormMessage state={state} />
      <SubmitButton className="btn-primary h-12 w-full" pendingText="Salvando…">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
