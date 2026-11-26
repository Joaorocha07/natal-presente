import type { Metadata } from "next";
import { PRIVATE, pageMeta } from "@/lib/seo";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { listCatalogProducts, listCategoriesSafe } from "@/lib/data";
import { money } from "@/lib/format";
import { removeCatalogProduct } from "@/app/actions";
import { AdminHeader } from "@/components/admin-nav";
import { AdminProductForm } from "@/components/admin-product-form";
import { ConfirmSubmit } from "@/components/form-bits";
import { Container, PageSkeleton, WishThumb } from "@/components/ui";
import { ExternalIcon, GiftIcon, PlusIcon, TrashIcon } from "@/components/icons";

export const metadata: Metadata = pageMeta(
  "Admin · Produtos",
  "Painel do administrador do Amigo Oculto.",
  PRIVATE,
);

export default function Page() {
  return (
    <Container>
      <Suspense fallback={<PageSkeleton />}>
        <Products />
      </Suspense>
    </Container>
  );
}

async function Products() {
  await requireAdmin("/admin/produtos");
  const [products, categoryList] = await Promise.all([listCatalogProducts(), listCategoriesSafe()]);
  const avg = products.length ? products.reduce((s, p) => s + p.price, 0) / products.length : 0;
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];

  return (
    <>
      <AdminHeader
        active="/admin/produtos"
        title="Produtos"
        description="Aparecem primeiro nas sugestões de presente dos grupos cujo valor máximo comporta o preço."
        stats={[
          { label: "Cadastrados", value: String(products.length) },
          { label: "Preço médio", value: products.length ? money(avg) : "—" },
          {
            label: "Categorias",
            value: String(categories.length),
            hint: categories.length ? categories.slice(0, 4).join(" · ") : undefined,
          },
        ]}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
        <section className="card rise p-6 sm:p-7 lg:sticky lg:top-24" style={{ animationDelay: "120ms" }}>
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-2xl bg-berry/12 text-berry">
              <PlusIcon className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-xl tracking-tight">Novo produto</h2>
              <p className="text-xs text-ink/50">A loja é identificada pelo link</p>
            </div>
          </div>
          <div className="mt-6">
            <AdminProductForm categories={categoryList} />
          </div>
        </section>

        <section className="rise" style={{ animationDelay: "200ms" }}>
          {products.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-cream/20 px-6 py-16 text-center">
              <span className="float inline-block text-5xl">🎁</span>
              <p className="mt-4 font-display text-xl">Nenhum produto ainda</p>
              <p className="mx-auto mt-1 max-w-xs text-sm text-cream/60">
                Cadastre o primeiro ao lado e ele já aparece nas sugestões dos grupos.
              </p>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {products.map((p) => (
                <li key={p.id} className="card flex flex-col p-4">
                  <div className="flex gap-3.5">
                    <WishThumb wish={p} className="size-[4.5rem]" />
                    <div className="min-w-0 flex-1">
                      {p.category && (
                        <p className="eyebrow truncate text-[10px] text-berry">{p.category}</p>
                      )}
                      <p className="mt-0.5 line-clamp-2 text-sm font-medium leading-snug">{p.title}</p>
                      {p.store && <p className="mt-1 truncate text-xs text-ink/45">{p.store}</p>}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1 border-t border-ink/[0.07] pt-3">
                    <span className="mr-auto font-display text-xl font-semibold text-pine-700">{money(p.price)}</span>
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="grid size-9 place-items-center rounded-full text-ink/45 transition hover:bg-ink/5 hover:text-ink"
                      aria-label={`Abrir ${p.title} na loja`}
                      title="Abrir na loja"
                    >
                      <ExternalIcon className="size-4" />
                    </a>
                    <form action={removeCatalogProduct.bind(null, p.id)}>
                      <ConfirmSubmit
                        title="Excluir produto?"
                        message={`"${p.title}" sai do catálogo e das sugestões.`}
                        confirmLabel="Excluir"
                        className="grid size-9 place-items-center rounded-full text-ink/45 transition hover:bg-berry/10 hover:text-berry"
                      >
                        <TrashIcon className="size-4" />
                      </ConfirmSubmit>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {products.length > 0 && (
            <p className="mt-4 flex items-center gap-2 text-xs text-cream/50">
              <GiftIcon className="size-3.5" /> Produtos acima do valor máximo de um grupo não aparecem nele.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
