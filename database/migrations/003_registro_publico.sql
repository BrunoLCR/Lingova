-- Migración 003: registro público (country + trigger handle_new_user). Ya está incluida en schema.sql.

-- ============================================================
-- REGISTRO PÚBLICO: country en profiles + alta automática de perfil (siempre ESTUDIANTE)
-- El rol NUNCA se toma de los metadatos enviados por el cliente.
-- ============================================================
alter table public.profiles add column if not exists country text;
alter table public.profiles drop constraint if exists profiles_country_check;
alter table public.profiles add constraint profiles_country_check
  check (country is null or country ~ '^[A-Z]{2}$' or country = 'GLOBAL');

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_name text; v_country text;
begin
  v_name := left(coalesce(nullif(btrim(regexp_replace(coalesce(new.raw_user_meta_data->>'full_name', ''), '[<>]', '', 'g')), ''), split_part(new.email, '@', 1)), 100);
  v_country := upper(nullif(btrim(new.raw_user_meta_data->>'country'), ''));
  if v_country is not null and v_country !~ '^[A-Z]{2}$' and v_country <> 'GLOBAL' then v_country := null; end if;
  insert into public.profiles (id, full_name, email, role, status, country)
  values (new.id, v_name, new.email, 'ESTUDIANTE', 'ACTIVO', v_country)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();
