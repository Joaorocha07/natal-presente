"use client";

import { useEffect, useId, useRef } from "react";
import { useFormStatus } from "react-dom";
import { CrownIcon, TrashIcon } from "./icons";
import type { FormState } from "@/app/actions";

export function SubmitButton({
  children,
  className = "btn-primary",
  pendingText = "Aguarde…",
  pending: forcePending = false,
  label,
}: {
  pending?: boolean;
  label?: string;
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
}) {
  const status = useFormStatus();
  const pending = status.pending || forcePending;
  return (
    <button type="submit" className={className} disabled={pending} aria-label={label} title={label}>
      {pending ? (
        <>
          <Spinner /> {pendingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function Spinner() {
  return <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden />;
}

export function FormMessage({ state }: { state: FormState }) {
  if (!state?.error && !state?.ok) return null;
  return (
    <p
      role="status"
      className={`rounded-2xl px-4 py-3 text-sm ${
        state.error ? "bg-berry/10 text-berry" : "bg-pine-700/10 text-pine-700"
      }`}
    >
      {state.error ?? state.ok}
    </p>
  );
}

/**
 * Botão de envio que abre uma modal de confirmação no estilo do site.
 * A modal fica dentro do <form>: o botão "confirmar" envia o próprio formulário.
 */
export function ConfirmSubmit({
  children,
  message,
  className,
  title = "Tem certeza?",
  confirmLabel = "Confirmar",
  tone = "danger",
  icon,
}: {
  children: React.ReactNode;
  /** texto explicativo da modal */
  message: string;
  className?: string;
  title?: string;
  confirmLabel?: string;
  /** danger = ação destrutiva (cobre); gold = ação importante, mas não destrutiva */
  tone?: "danger" | "gold";
  icon?: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const { pending } = useFormStatus();
  const wasPending = useRef(false);
  const titleId = useId();

  // Fecha a modal quando o envio termina (se a página não navegou)
  useEffect(() => {
    if (wasPending.current && !pending) ref.current?.close();
    wasPending.current = pending;
  }, [pending]);

  const danger = tone === "danger";
  return (
    <>
      <button type="button" className={className} disabled={pending} onClick={() => ref.current?.showModal()}>
        {pending ? <Spinner /> : children}
      </button>

      <dialog
        ref={ref}
        aria-labelledby={titleId}
        className="confirm-dialog surface-light m-auto w-[min(26rem,calc(100vw-2rem))] rounded-[1.75rem] border border-[var(--cream-edge)] bg-gradient-to-b from-[#fbf4e8] to-[#f2e5d0] p-0 text-ink shadow-[0_6px_0_var(--cream-edge),0_30px_60px_-12px_rgb(0_0_0/0.75)] backdrop:bg-[#07140f]/70 backdrop:backdrop-blur-sm"
        onClick={(e) => {
          // clique fora do cartão (no fundo) fecha
          if (e.target === e.currentTarget && !pending) e.currentTarget.close();
        }}
        onCancel={(e) => pending && e.preventDefault()}
      >
        <div className="relative overflow-hidden px-6 pb-6 pt-7 text-center sm:px-8">
          <span aria-hidden className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-gold/15 blur-xl" />
          <span
            className={`relative mx-auto grid size-14 place-items-center rounded-2xl shadow-[inset_0_1px_0_rgb(255_255_255/0.4),0_3px_0_rgb(0_0_0/0.15)] ${
              danger ? "bg-berry text-cream" : "bg-gradient-to-b from-gold-soft to-gold text-[#5c430a]"
            }`}
          >
            {icon ?? (danger ? <TrashIcon className="size-6" /> : <CrownIcon className="size-6" />)}
          </span>
          <h2 id={titleId} className="relative mt-5 font-display text-2xl leading-tight tracking-tight">
            {title}
          </h2>
          <p className="relative mt-2 text-sm leading-relaxed text-ink/65">{message}</p>

          <div className="relative mt-7 flex flex-col-reverse gap-2.5 sm:flex-row">
            <button
              type="button"
              autoFocus
              disabled={pending}
              onClick={() => ref.current?.close()}
              className="btn h-11 flex-1 border border-ink/15 bg-white/70 text-ink/75 outline-none hover:bg-white focus-visible:ring-2 focus-visible:ring-gold/70"
            >
              Cancelar
            </button>
            <button type="submit" disabled={pending} className={`h-11 flex-1 ${danger ? "btn-primary" : "btn bg-gradient-to-b from-gold-soft to-gold text-[#4a3608] shadow-[inset_0_1px_0_rgb(255_255_255/0.5),0_4px_0_#a8752d] active:translate-y-0.5"}`}>
              {pending ? (
                <>
                  <Spinner /> Aguarde…
                </>
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}

/** Sai da conta e recarrega a página inteira (limpa o cache do roteador) */
export function LogoutButton({
  action,
  className,
  children = "Sair",
  label,
}: {
  action: () => Promise<void>;
  className?: string;
  children?: React.ReactNode;
  /** texto para leitores de tela quando o botão é só um ícone */
  label?: string;
}) {
  return (
    <form
      action={async () => {
        await action();
        // Recarga completa de propósito: limpa o cache do roteador após sair
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign("/");
      }}
    >
      <SubmitButton className={className} pendingText="" label={label}>
        {children}
      </SubmitButton>
    </form>
  );
}
