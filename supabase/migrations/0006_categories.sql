-- Categorias criadas pelo admin (viram atalhos na busca de presentes)
-- Rode no Supabase: Dashboard > SQL Editor > New query > colar > Run

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 40),
  emoji text not null default '🎁' check (char_length(emoji) between 1 and 16),
  created_at timestamptz not null default now()
);
create unique index if not exists categories_name_idx on public.categories (lower(name));

-- Aproveita as categorias que já foram digitadas nos produtos
insert into public.categories (name)
select distinct on (lower(category)) category
from public.products
where category is not null and char_length(category) between 2 and 40
on conflict do nothing;

alter table public.categories enable row level security;
revoke all on public.categories from anon, authenticated;
grant select, insert, update, delete on public.categories to service_role;

notify pgrst, 'reload schema';
