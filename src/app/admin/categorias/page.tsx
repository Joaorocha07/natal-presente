import type { Metadata } from "next";
import { PRIVATE, pageMeta } from "@/lib/seo";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { listCategories } from "@/lib/data";
import { AdminHeader } from "@/components/admin-nav";
import { CategoryRow, NewCategoryForm } from "@/components/admin-categories";
import { Container, PageSkeleton } from "@/components/ui";
import { TagIcon } from "@/components/icons";

export const metadata: Metadata = pageMeta(
  "Admin · Categorias",
  "Painel do administrador do Amigo Oculto.",
  PRIVATE,
);

export default function Page() {
  return (
    <Container>
      <Suspense fallback={<PageSkeleton />}>
        <Categories />
      </Suspense>
    </Container>
  );
}

async function Categories() {
  await requireAdmin("/admin/categorias");
  const categories = await listCategories();
  const used = categories.filter((c) => c.product_count > 0).length;
  const top = [...categories].sort((a, b) => b.product_count - a.product_count)[0];

  return (
    <>
      <AdminHeader
        active="/admin/categorias"
        title="Categorias"
        description="Organizam os produtos e viram atalhos na busca de presentes de todos os grupos."
        stats={[
          { label: "Categorias", value: String(categories.length) },
          { label: "Com produtos", value: String(used) },
          {
            label: "Mais usada",
            value: top?.product_count ? `${top.emoji} ${top.name}` : "—",
            hint: top?.product_count ? `${top.product_count} ${top.product_count === 1 ? "produto" : "produtos"}` : undefined,
          },
        ]}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
        <section className="card rise p-6 sm:p-7 lg:sticky lg:top-24" style={{ animationDelay: "120ms" }}>
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-2xl bg-berry/12 text-berry">
              <TagIcon className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-xl tracking-tight">Nova categoria</h2>
              <p className="text-xs text-ink/50">Aparece no cadastro de produtos e na busca</p>
            </div>
          </div>
          <div className="mt-6">
            <NewCategoryForm />
          </div>
        </section>

        <section className="rise" style={{ animationDelay: "200ms" }}>
          {categories.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-cream/20 px-6 py-16 text-center">
              <span className="float inline-block text-5xl">🏷️</span>
              <p className="mt-4 font-display text-xl">Nenhuma categoria ainda</p>
              <p className="mx-auto mt-1 max-w-xs text-sm text-cream/60">
                Crie a primeira ao lado, por exemplo “Games” ou “Cozinha”.
              </p>
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {categories.map((c) => (
                <CategoryRow key={c.id} category={c} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
