"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { login, register, type FormState } from "@/app/actions";
import { googleLoginEnabled, startGoogleLogin } from "@/lib/google";
import { FormMessage, SubmitButton } from "./form-bits";

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.3 5.7c4.3-4 6.8-9.9 6.8-17.1z" />
      <path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-2.9-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.8l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.3-5.7c-2 1.4-4.7 2.3-8.6 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

export function AuthForm({ mode, next }: { mode: "login" | "register"; next: string }) {
  const [state, action] = useActionState<FormState, FormData>(mode === "login" ? login : register, undefined);
  const [googlePending, setGooglePending] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  useEffect(() => {
    if (state?.redirectTo) window.location.assign(state.redirectTo);
  }, [state]);
  const nextQuery = next ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      {mode === "register" && (
        <div>
          <label className="label" htmlFor="name">
            Seu nome
          </label>
          <input id="name" name="name" className="field" placeholder="Como seus amigos te chamam" autoComplete="name" required />
        </div>
      )}
      <div>
        <label className="label" htmlFor="email">
          E-mail
        </label>
        <input id="email" name="email" type="email" className="field" placeholder="voce@email.com" autoComplete="email" required />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="field"
          placeholder={mode === "register" ? "Mínimo de 6 caracteres" : "Sua senha"}
          autoComplete={mode === "register" ? "new-password" : "current-password"}
          minLength={6}
          required
        />
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full h-12" pending={!!state?.redirectTo}>
        {mode === "login" ? "Entrar" : "Criar conta"}
      </SubmitButton>
      {googleLoginEnabled && (
        <>
          <div className="flex items-center gap-3 text-xs text-ink/40">
            <span className="h-px flex-1 bg-ink/10" />
            ou
            <span className="h-px flex-1 bg-ink/10" />
          </div>
          <button
            type="button"
            className="btn-ghost w-full h-12"
            disabled={googlePending}
            onClick={() => {
              setGooglePending(true);
              setGoogleError(null);
              startGoogleLogin(next).catch(() => {
                setGooglePending(false);
                setGoogleError("Não foi possível iniciar o login com Google.");
              });
            }}
          >
            <GoogleLogo /> Continuar com Google
          </button>
          {googleError && <p className="text-center text-sm text-berry">{googleError}</p>}
        </>
      )}
      <p className="text-center text-sm text-ink/60">
        {mode === "login" ? (
          <>
            Ainda não tem conta?{" "}
            <Link href={`/cadastrar${nextQuery}`} className="font-medium text-berry hover:underline">
              Cadastre-se
            </Link>
          </>
        ) : (
          <>
            Já tem conta?{" "}
            <Link href={`/entrar${nextQuery}`} className="font-medium text-berry hover:underline">
              Entrar
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
