-- O servidor do app usa a chave secreta (papel service_role). Projetos novos do Supabase
-- não concedem acesso automático a tabelas criadas por SQL, então liberamos explicitamente.
grant usage on schema public to service_role;
grant select, insert, update, delete on public.users, public.sessions, public.groups, public.memberships, public.wishes
  to service_role;

notify pgrst, 'reload schema';
