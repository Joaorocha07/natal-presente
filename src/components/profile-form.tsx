"use client";

import { useActionState } from "react";
import { updateProfile } from "@/app/actions";
import { FormMessage, SubmitButton } from "./form-bits";

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const [state, formAction] = useActionState(updateProfile, undefined);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label className="label" htmlFor="name">
          Seu nome
        </label>
        <input
          id="name"
          name="name"
          className="field"
          defaultValue={name}
          minLength={2}
          maxLength={60}
          autoComplete="name"
          required
        />
        <p className="mt-1.5 text-xs text-ink/50">É assim que você aparece para os participantes dos seus grupos.</p>
      </div>

      <div>
        <label className="label" htmlFor="email">
          E-mail
        </label>
        <input id="email" className="field cursor-not-allowed opacity-70" value={email} readOnly disabled />
        <p className="mt-1.5 text-xs text-ink/50">O e-mail identifica sua conta e não pode ser alterado.</p>
      </div>

      <FormMessage state={state} />
      <SubmitButton className="btn-primary h-12 w-full sm:w-auto sm:px-8" pendingText="Salvando…">
        Salvar alterações
      </SubmitButton>
    </form>
  );
}
