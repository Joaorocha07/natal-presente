import Link from "next/link";
import { GiftIcon, TagIcon, UsersIcon } from "./icons";

const TABS = [
  { href: "/admin/produtos", label: "Produtos", Icon: GiftIcon },
  { href: "/admin/categorias", label: "Categorias", Icon: TagIcon },
  { href: "/admin/usuarios", label: "Usuários", Icon: UsersIcon },
] as const;

type Tab = (typeof TABS)[number]["href"];
export type AdminStat = { label: string; value: string; hint?: string };

/** Cabeçalho do painel: título, abas em pílula de vidro e faixa de números */
export function AdminHeader({
  active,
  title,
  description,
  stats,
}: {
  active: Tab;
  title: string;
  description: string;
  stats: AdminStat[];
}) {
  return (
    <header className="rise">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow inline-flex items-center gap-2 text-gold-soft">
            <span className="size-1.5 rounded-full bg-gold" /> Painel do administrador
          </p>
          <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-1.5 max-w-md text-sm text-cream/60">{description}</p>
        </div>

        <nav
          aria-label="Seções do painel"
          className="flex w-full gap-1 rounded-full bg-black/20 p-1 sm:w-auto shadow-[inset_0_2px_6px_rgb(0_0_0/0.35),inset_0_0_0_1px_rgb(255_255_255/0.08)]"
        >
          {TABS.map(({ href, label, Icon }) =>
            active === href ? (
              <span key={href} aria-current="page" className="btn-primary h-10 flex-1 px-4 sm:flex-none sm:px-5">
                <Icon className="size-4" /> {label}
              </span>
            ) : (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className="btn h-10 px-4 text-cream/65 hover:bg-white/10 hover:text-cream sm:px-5"
              >
                <Icon className="size-4" /> <span className="hidden sm:inline">{label}</span>
              </Link>
            ),
          )}
        </nav>
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`night rounded-3xl px-5 py-4 ${i === 2 ? "col-span-2 sm:col-span-1" : ""}`}
          >
            <dt className="text-xs font-medium text-cream/55">{s.label}</dt>
            <dd className="mt-1 truncate font-display text-2xl font-semibold tracking-tight text-cream sm:text-3xl">{s.value}</dd>
            {s.hint && <dd className="mt-0.5 truncate text-xs text-gold-soft/80">{s.hint}</dd>}
          </div>
        ))}
      </dl>
    </header>
  );
}
