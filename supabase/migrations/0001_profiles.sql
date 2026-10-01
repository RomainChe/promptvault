-- Public profile, one row per auth user (see SPEC-identity.md).
create table public.profiles (
  id         uuid primary key references auth.users on delete cascade,
  username   text unique not null check (username ~ '^[a-z0-9_]{3,30}$'),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Usernames appear on public prompts; the owner may change only their username.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant update (username) on public.profiles to authenticated;

create policy "profiles are readable by everyone"
  on public.profiles for select to anon, authenticated
  using (true);

create policy "owner updates own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Username from the GitHub login, else the email local part; numeric suffix if taken.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base      text;
  candidate text;
  n         int := 0;
begin
  base := lower(coalesce(new.raw_user_meta_data ->> 'user_name', split_part(new.email, '@', 1), 'user'));
  base := left(regexp_replace(base, '[^a-z0-9_]', '_', 'g'), 24);
  if length(base) < 3 then
    base := rpad(base, 3, '0');
  end if;

  -- ponytail: two simultaneous sign-ups with the same base can collide on the unique index; retry loop if it ever happens
  candidate := base;
  while exists (select 1 from public.profiles where username = candidate) loop
    n := n + 1;
    candidate := base || n;
  end loop;

  insert into public.profiles (id, username) values (new.id, candidate);
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
