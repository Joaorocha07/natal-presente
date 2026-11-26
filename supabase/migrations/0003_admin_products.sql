-- Produtos cadastrados pelo administrador (aparecem nas sugestões de presente)
-- Rode no Supabase: Dashboard > SQL Editor > New query > colar > Run

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 140),
  price integer not null check (price > 0), -- centavos
  url text not null,
  image text,
  store text,
  category text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists products_price_idx on public.products(price);

alter table public.products enable row level security;
revoke all on public.products from anon, authenticated;
grant select, insert, update, delete on public.products to service_role;

notify pgrst, 'reload schema';
