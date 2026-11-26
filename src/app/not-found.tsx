import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <p className="float text-6xl">🎄</p>
      <h1 className="mt-6 font-display text-3xl tracking-tight">Página não encontrada</h1>
      <p className="mt-3 text-ink/60">Talvez o grupo tenha sido excluído ou você não participe dele.</p>
      <Link href="/grupos" className="btn-primary mt-8">
        Ver meus grupos
      </Link>
    </main>
  );
}
