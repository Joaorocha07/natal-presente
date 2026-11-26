-- Bucket público para as fotos de produtos enviadas pelo admin
-- Rode no Supabase: Dashboard > SQL Editor > New query > colar > Run
-- (o envio é feito pelo servidor com a chave secreta; ninguém mais grava aqui)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('produtos', 'produtos', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
