import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { AuthShell } from "@/components/auth-shell";

export const metadata: Metadata = pageMeta(
  "Entrar",
  "Entre para ver seus grupos de amigo oculto e a lista de desejos de quem você tirou.",
);

export default function Page({ searchParams }: PageProps<"/entrar">) {
  return <AuthShell mode="login" searchParams={searchParams} />;
}
