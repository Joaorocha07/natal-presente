"use client";

import { useState, useSyncExternalStore } from "react";
import { CheckIcon, LinkIcon } from "./icons";

const subscribe = () => () => {};

export function InviteShare({ code, groupName, budget }: { code: string; groupName: string; budget: string }) {
  const origin = useSyncExternalStore(subscribe, () => window.location.origin, () => "");
  const [copied, setCopied] = useState(false);
  const url = `${origin}/convite/${code}`;
  const message = `🎁 Bora de amigo oculto? Entre no grupo "${groupName}" (presente de até ${budget}) e monte sua lista de desejos: ${url}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback para navegadores sem clipboard API
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-2xl border border-cream/15 bg-black/20 p-1.5 pl-4">
        <LinkIcon className="size-4 shrink-0 text-gold-soft" />
        <span className="min-w-0 flex-1 truncate text-sm text-cream/80">{origin ? url : "Carregando link…"}</span>
        <button type="button" onClick={copy} className="btn-gold h-9 shrink-0 px-4 text-[13px]">
          {copied ? (
            <>
              <CheckIcon className="size-4" /> Copiado
            </>
          ) : (
            "Copiar"
          )}
        </button>
      </div>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(message)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="btn h-10 w-full border border-[#25D366]/40 bg-[#25D366]/15 text-[13px] text-cream hover:bg-[#25D366]/25"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
          <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4M12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 0 1 12 2.2a9.8 9.8 0 0 1 9.8 9.8c0 5.4-4.4 9.8-9.8 9.8M12 0C5.4 0 0 5.4 0 12c0 2.1.6 4.2 1.6 6L0 24l6.2-1.6A12 12 0 0 0 24 12C24 5.4 18.6 0 12 0" />
        </svg>
        Enviar convite no WhatsApp
      </a>
    </div>
  );
}
