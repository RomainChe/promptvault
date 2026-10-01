-- Expose only what public prompts need: queries must name columns (select=id,username), not *.
revoke select on public.profiles from anon, authenticated;
grant select (id, username) on public.profiles to anon, authenticated;

-- Same derivation as 0001, but a concurrent sign-up that takes the name first moves on to the next suffix.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base      text;
  candidate text;
  n         int := 0;
  violated  text;
begin
  base := lower(coalesce(new.raw_user_meta_data ->> 'user_name', split_part(new.email, '@', 1), 'user'));
  base := left(regexp_replace(base, '[^a-z0-9_]', '_', 'g'), 24);
  if length(base) < 3 then
    base := rpad(base, 3, '0');
  end if;

  loop
    candidate := base || case when n = 0 then '' else n::text end;
    if not exists (select 1 from public.profiles where username = candidate) then
      begin
        insert into public.profiles (id, username) values (new.id, candidate);
        return new;
      exception when unique_violation then
        get stacked diagnostics violated = constraint_name;
        if violated <> 'profiles_username_key' then
          raise;
        end if;
      end;
    end if;
    n := n + 1;
  end loop;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
