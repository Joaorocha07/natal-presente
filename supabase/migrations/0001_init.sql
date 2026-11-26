-- Amigo Oculto · schema inicial
-- Rode uma vez no Supabase: Dashboard > SQL Editor > New query > colar > Run

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 60),
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.sessions (
  token_hash text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  expires_at timestamptz not null
);
create index if not exists sessions_user_idx on public.sessions(user_id);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 60),
  budget integer not null check (budget between 1000 and 100000), -- centavos
  event_date date,
  invite_code text not null unique,
  owner_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists groups_owner_idx on public.groups(owner_id);

create table if not exists public.memberships (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index if not exists memberships_user_idx on public.memberships(user_id);

create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null,
  user_id uuid not null,
  title text not null check (char_length(title) between 2 and 140),
  price integer not null check (price > 0), -- centavos
  url text,
  image text,
  store text,
  note text,
  created_at timestamptz not null default now(),
  -- só membros do grupo têm desejos; sair do grupo apaga a lista
  foreign key (group_id, user_id) references public.memberships(group_id, user_id) on delete cascade
);
create index if not exists wishes_member_idx on public.wishes(group_id, user_id);

-- Segurança: o app acessa o banco só pelo servidor, com a chave secreta (que ignora RLS).
-- RLS ligado e sem políticas = a chave publicável (anon) não lê nem grava nada.
alter table public.users enable row level security;
alter table public.sessions enable row level security;
alter table public.groups enable row level security;
alter table public.memberships enable row level security;
alter table public.wishes enable row level security;

revoke all on public.users, public.sessions, public.groups, public.memberships, public.wishes
  from anon, authenticated;

-- Recarrega o cache de schema da API
notify pgrst, 'reload schema';
