import Link from "next/link";
import { avatarTone, initials, money } from "@/lib/format";
import type { Wish } from "@/lib/data";
import { ArrowLeftIcon, ExternalIcon, GiftIcon } from "./icons";

/** Foto do Google em tamanho maior (a URL padrão vem em 96px) */
function sizedPhoto(src: string, px: number) {
  return /googleusercontent\.com/.test(src) ? src.replace(/=s\d+(-c)?$/, `=s${px}-c`) : src;
}

export function Avatar({
  id,
  name,
  src,
  size = "md",
  className = "ring-2 ring-white",
}: {
  id: string;
  name: string;
  src?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const s = {
    xs: "size-7 text-[10px]",
    sm: "size-8 text-[11px]",
    md: "size-11 text-sm",
    lg: "size-16 text-xl",
    xl: "size-24 text-3xl",
  }[size];
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={sizedPhoto(src, size === "xl" || size === "lg" ? 256 : 96)}
        alt={name}
        referrerPolicy="no-referrer"
        className={`shrink-0 rounded-full bg-cream-200 object-cover ${s} ${className}`}
      />
    );
  }
  return (
    <span className={`grid shrink-0 place-items-center rounded-full font-semibold ${s} ${className} ${avatarTone(id)}`}>
      {initials(name)}
    </span>
  );
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1.5 text-sm text-ink/55 transition hover:text-ink">
      <ArrowLeftIcon className="size-4" /> {children}
    </Link>
  );
}

export function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <main className={`mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10 ${className}`}>{children}</main>;
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-5 w-32 rounded-full skeleton" />
      <div className="h-10 w-2/3 max-w-sm rounded-2xl skeleton" />
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-3xl skeleton" />
        ))}
      </div>
    </div>
  );
}

export function WishThumb({ wish, className = "size-16" }: { wish: Pick<Wish, "image" | "title">; className?: string }) {
  if (wish.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={wish.image} alt="" loading="lazy" className={`${className} shrink-0 rounded-2xl bg-white object-contain p-1 ring-1 ring-ink/5`} />;
  }
  return (
    <span className={`${className} grid shrink-0 place-items-center rounded-2xl bg-cream-200 text-berry`}>
      <GiftIcon className="size-6" />
    </span>
  );
}

/** Cartão de desejo em modo leitura (para quem vai presentear) */
export function WishCard({ wish, index }: { wish: Wish; index: number }) {
  return (
    <li className="card group flex flex-col overflow-hidden p-0 transition hover:-translate-y-0.5">
      <div className="flex items-start gap-4 p-5">
        <WishThumb wish={wish} className="size-20" />
        <div className="min-w-0 flex-1">
          <p className="eyebrow text-ink/35">Opção {index + 1}</p>
          <p className="mt-1 line-clamp-2 font-medium leading-snug">{wish.title}</p>
          {wish.store && <p className="mt-1 text-xs text-ink/50">{wish.store}</p>}
        </div>
      </div>
      {wish.note && (
        <p className="mx-5 -mt-1 mb-4 rounded-2xl bg-gold/10 px-4 py-2.5 text-sm text-ink/75">
          <span className="mr-1">💬</span>
          {wish.note}
        </p>
      )}
      <div className="mt-auto flex items-center justify-between border-t border-ink/[0.06] bg-cream/50 px-5 py-3.5">
        <span className="font-display text-xl font-semibold text-pine-700">{money(wish.price)}</span>
        {wish.url ? (
          <a href={wish.url} target="_blank" rel="noopener noreferrer nofollow" className="btn-primary h-9 px-4 text-[13px]">
            Ver na loja <ExternalIcon className="size-3.5" />
          </a>
        ) : (
          <span className="text-xs text-ink/45">Sem link: procure em qualquer loja</span>
        )}
      </div>
    </li>
  );
}

export function BudgetBadge({ budget, light = false }: { budget: number; light?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        light ? "bg-gold/20 text-gold-soft" : "bg-gold/15 text-[#8a6d12]"
      }`}
    >
      Até {money(budget)}
    </span>
  );
}
