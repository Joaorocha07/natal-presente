import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { searchProducts } from "@/lib/products";

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Faça login" }, { status: 401 });

  const q = request.nextUrl.searchParams.get("q") ?? "";
  const max = Number(request.nextUrl.searchParams.get("max") ?? 10000);
  const maxCents = Number.isFinite(max) && max > 0 ? Math.min(max, 1_000_000) : 10000;

  const result = await searchProducts(q.slice(0, 80), maxCents);
  return NextResponse.json(result);
}
