"use client";

import { useFormStatus } from "react-dom";
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

/** Botão de envio que pede confirmação antes */
export function ConfirmSubmit({
  children,
  message,
  className,
}: {
  children: React.ReactNode;
  message: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {pending ? <Spinner /> : children}
    </button>
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
