import Link from "next/link";
import { Suspense } from "react";
import { getUser, isAdmin } from "@/lib/auth";
import { logout } from "@/app/actions";
import { LogoutButton } from "./form-bits";
import { Garland } from "./garland";
import { firstName } from "@/lib/format";
import { Avatar } from "./ui";
import { HeaderTabs } from "./header-nav";
import { LogOutIcon } from "./icons";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 group">
      <span className="grid place-items-center size-10 rounded-full bg-berry text-cream shadow-[0_3px_0_#85391f,0_10px_16px_-6px_rgb(0_0_0/0.7)] ring-1 ring-gold/50 transition group-hover:-rotate-12 group-hover:scale-105">
        <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
          <path d="M12 2 9.5 7h5L12 2Zm0 4L7 13h10l-5-7Zm0 5-6.5 9h13L12 11Z" opacity=".95" />
          <rect x="11" y="20" width="2" height="2.5" rx=".5" />
        </svg>
      </span>
      <span className="hidden font-display text-lg tracking-tight text-cream min-[420px]:inline">
        Amigo <em className="gold-text not-italic font-semibold">Oculto</em>
      </span>
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40">
      <div className="border-b border-cream/10 bg-pine-950/85 shadow-[0_8px_24px_-12px_rgb(0_0_0/0.6)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Logo />
          <Suspense fallback={<div className="h-10 w-40 rounded-full skeleton" />}>
            <UserNav />
          </Suspense>
        </div>
      </div>
      <Garland />
    </header>
  );
}

async function UserNav() {
  const user = await getUser();
  if (!user) {
    return (
      <nav className="flex items-center gap-2">
        <Link href="/entrar" className="btn h-9 px-4 text-cream/80 hover:bg-white/10 hover:text-cream">
          Entrar
        </Link>
        <Link href="/cadastrar" className="btn-primary h-9 px-4">
          Criar conta
        </Link>
      </nav>
    );
  }
  return (
    <nav className="flex items-center gap-2 sm:gap-3">
      <HeaderTabs admin={isAdmin(user)} />
      <div className="flex items-center gap-1 rounded-full bg-white/[0.06] py-1 pl-1 pr-1 ring-1 ring-white/10">
        <span title={user.name} className="flex items-center gap-2">
          <Avatar id={user.id} name={user.name} src={user.avatar_url} size="sm" className="ring-2 ring-gold/50" />
          <span className="hidden max-w-28 truncate pr-1 text-sm font-medium text-cream/85 md:block">
            {firstName(user.name)}
          </span>
        </span>
        <LogoutButton
          action={logout}
          label="Sair da conta"
          className="grid size-8 place-items-center rounded-full text-cream/55 transition hover:bg-berry/20 hover:text-[#f3a98a]"
        >
          <LogOutIcon className="size-4" />
        </LogoutButton>
      </div>
    </nav>
  );
}
