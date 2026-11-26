import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PRIVATE, pageMeta } from "@/lib/seo";
import { requireUser } from "@/lib/auth";
import { getProfileStats } from "@/lib/data";
import { logout } from "@/app/actions";
import { Avatar, BackLink, Container, PageSkeleton } from "@/components/ui";
import { ProfileForm } from "@/components/profile-form";
import { LogoutButton } from "@/components/form-bits";
import { LogOutIcon, UserIcon } from "@/components/icons";

export const metadata: Metadata = pageMeta(
  "Meu perfil",
  "Veja e edite como você aparece para os participantes dos seus grupos de amigo oculto.",
  PRIVATE,
);

export default function Page() {
  return (
    <Container>
      <Suspense fallback={<PageSkeleton />}>
        <Profile />
      </Suspense>
    </Container>
  );
}

async function Profile() {
  const user = await requireUser("/perfil");
  const stats = await getProfileStats(user.id);
  const fromGoogle = Boolean(user.avatar_url);

  return (
    <>
      <BackLink href="/grupos">Meus grupos</BackLink>

      <div className="mt-5 grid gap-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-start">
        {/* Cartão de visita */}
        <section className="night rise relative overflow-hidden rounded-[2rem] px-6 py-8 text-center text-cream sm:px-8 sm:py-10">
          <span aria-hidden className="ornament gold right-6 top-6 size-8" />
          <span aria-hidden className="ornament left-6 top-16 size-6" style={{ animationDelay: "-3s" }} />
          <div className="relative flex flex-col items-center">
            <Avatar
              id={user.id}
              name={user.name}
              src={user.avatar_url}
              size="xl"
              className="ring-4 ring-gold/50 shadow-[0_10px_30px_-8px_rgb(0_0_0/0.7)]"
            />
            <h1 className="mt-5 break-words font-display text-3xl tracking-tight">{user.name}</h1>
            <p className="mt-1 max-w-full truncate text-sm text-cream/55">{user.email}</p>
            {fromGoogle && (
              <p className="mt-3 rounded-full bg-white/[0.07] px-3 py-1 text-xs text-cream/60">
                Foto da sua conta Google
              </p>
            )}
          </div>

          <dl className="relative mt-8 grid grid-cols-3 gap-2 text-left">
            <Stat label="Grupos" value={stats.groups} />
            <Stat label="Organiza" value={stats.organizing} />
            <Stat label="Desejos" value={stats.wishes} />
          </dl>
        </section>

        {/* Edição */}
        <section className="card rise p-6 sm:p-8 [animation-delay:120ms]">
          <div className="flex items-center gap-3">
            <span className="chip3d grid size-11 place-items-center text-berry">
              <UserIcon className="size-5" />
            </span>
            <div>
              <p className="eyebrow text-berry">Meu perfil</p>
              <h2 className="font-display text-2xl tracking-tight">Dados da conta</h2>
            </div>
          </div>
          <div className="mt-7">
            <ProfileForm name={user.name} email={user.email} />
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-ink/[0.07] pt-6">
            <Link href="/grupos" className="text-sm font-medium text-pine-700 underline-offset-4 hover:underline">
              Ver meus grupos
            </Link>
            <LogoutButton
              action={logout}
              className="btn h-10 border border-berry/25 px-4 text-sm text-berry hover:bg-berry/5"
            >
              <LogOutIcon className="size-4" /> Sair da conta
            </LogoutButton>
          </div>
        </section>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-black/20 px-3 py-3 shadow-[inset_0_2px_6px_rgb(0_0_0/0.25)]">
      <dt className="text-[11px] text-cream/55">{label}</dt>
      <dd className="mt-0.5 font-display text-2xl font-semibold">{value}</dd>
    </div>
  );
}
