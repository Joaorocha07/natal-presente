-- Foto de perfil (vem do Google no login; contas com senha ficam com as iniciais)
-- Rode no Supabase: Dashboard > SQL Editor > New query > colar > Run

alter table public.users add column if not exists avatar_url text;

notify pgrst, 'reload schema';
