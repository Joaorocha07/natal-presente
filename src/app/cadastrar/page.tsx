import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { AuthShell } from "@/components/auth-shell";

export const metadata: Metadata = pageMeta(
  "Criar conta",
  "Crie sua conta grátis no Amigo Oculto: monte sua lista de desejos e descubra o presente certo para quem você tirou.",
);

export default function Page({ searchParams }: PageProps<"/cadastrar">) {
  return <AuthShell mode="register" searchParams={searchParams} />;
}
