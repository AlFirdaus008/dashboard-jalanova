begin;
alter table public.profiles add column is_demo boolean not null default false;
create or replace function private.is_stakeholder() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = (select auth.uid()) and role = 'stakeholder' and not is_demo);
$$;
revoke all on function private.is_stakeholder() from public,anon;
grant execute on function private.is_stakeholder() to authenticated;
create function private.reject_demo_submission() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if exists(select 1 from public.profiles where id=new.user_id and is_demo) then raise exception 'Akun demo hanya untuk melihat data eksperimen.'; end if;
  return new;
end;
$$;
revoke all on function private.reject_demo_submission() from public,anon,authenticated;
create trigger citizen_reports_no_demo before insert on public.citizen_reports for each row execute function private.reject_demo_submission();
commit;
