"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldIcon, UsersIcon } from "./icons";

/** Abas do header com a página atual destacada */
export function HeaderTabs({ admin }: { admin: boolean }) {
  const path = usePathname();
  const tabs = [
    { href: "/grupos", label: "Meus grupos", short: "Grupos", Icon: UsersIcon, gold: false },
    ...(admin ? [{ href: "/admin", label: "Admin", short: "Admin", Icon: ShieldIcon, gold: true }] : []),
  ];

  return (
    <div className="flex items-center gap-1 rounded-full bg-black/25 p-1 shadow-[inset_0_2px_6px_rgb(0_0_0/0.35),inset_0_0_0_1px_rgb(255_255_255/0.07)]">
      {tabs.map(({ href, label, short, Icon, gold }) => {
        const on = path === href || path.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={on ? "page" : undefined}
            className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold transition sm:px-3.5 ${
              on
                ? "bg-gradient-to-b from-[#fbf2e3] to-[#ecdcc2] text-[#2b211d] shadow-[inset_0_1px_0_#fff,0_2px_0_#d5bf9e]"
                : gold
                  ? "text-gold-soft hover:bg-white/10"
                  : "text-cream/70 hover:bg-white/10 hover:text-cream"
            }`}
          >
            <Icon className={`size-4 ${on && gold ? "text-[#a8752d]" : ""}`} />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{short}</span>
          </Link>
        );
      })}
    </div>
  );
}
