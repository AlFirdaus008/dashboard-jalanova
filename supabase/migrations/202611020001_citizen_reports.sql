-- Apply once in a dedicated Supabase project. No secret key is needed in the web app.
begin;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 1 and 120),
  role text not null default 'citizen' check (role in ('citizen','stakeholder')),
  agency text check (char_length(agency) <= 160),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create function private.is_stakeholder() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = (select auth.uid()) and role = 'stakeholder');
$$;
revoke all on function private.is_stakeholder() from public,anon;
grant execute on function private.is_stakeholder() to authenticated;
create policy profiles_read_self on public.profiles for select to authenticated using (id = (select auth.uid()));
revoke all on public.profiles from public,anon,authenticated;
grant select on public.profiles to authenticated;

create function private.create_citizen_profile() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- Signup metadata never determines the user's role or government agency.
  insert into public.profiles(id,full_name) values(new.id,coalesce(nullif(left(trim(new.raw_user_meta_data->>'full_name'),120),''),'Pengguna Jalanova'));
  return new;
end;
$$;
revoke all on function private.create_citizen_profile() from public,anon,authenticated;
create trigger jalanova_new_user after insert on auth.users for each row execute function private.create_citizen_profile();
insert into public.profiles(id,full_name)
select id,coalesce(nullif(left(trim(raw_user_meta_data->>'full_name'),120),''),'Pengguna Jalanova') from auth.users on conflict(id) do nothing;

create table public.road_registry (
  id text primary key,
  road_name text not null,
  authority text not null check (authority in ('national','provincial','city')),
  owner text not null
);
alter table public.road_registry enable row level security;
create policy roads_public_read on public.road_registry for select to anon,authenticated using (true);
revoke all on public.road_registry from public,anon,authenticated;
grant select on public.road_registry to anon,authenticated;

create table public.citizen_reports (
  id uuid primary key,
  report_code text not null unique default ('JNV-' || upper(replace(gen_random_uuid()::text,'-',''))),
  user_id uuid not null references public.profiles(id),
  reporter_name text not null check (char_length(reporter_name) between 1 and 120),
  road_name text not null check (char_length(road_name) between 3 and 160),
  address text not null check (char_length(address) between 5 and 500),
  description text not null check (char_length(description) between 20 and 2000),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  contact text not null default '' check (char_length(contact) <= 160),
  photo_path text not null,
  status text not null default 'draft' check (status in ('draft','received','reviewing','scheduled','in_progress','resolved','rejected')),
  urgency text not null default 'unassessed' check (urgency in ('unassessed','routine','priority','urgent')),
  priority_order smallint generated always as (case urgency when 'urgent' then 3 when 'priority' then 2 when 'routine' then 1 else 0 end) stored,
  verified_road_id text references public.road_registry(id),
  assigned_agency text check (char_length(assigned_agency) <= 160),
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  updated_at timestamptz not null default now(),
  check (photo_path in (user_id::text || '/' || id::text || '/photo.jpg',user_id::text || '/' || id::text || '/photo.png',user_id::text || '/' || id::text || '/photo.webp'))
);
create index citizen_reports_owner on public.citizen_reports(user_id,created_at desc);
create index citizen_reports_queue on public.citizen_reports(status,submitted_at desc);
alter table public.citizen_reports enable row level security;
create policy reports_read_owner_or_staff on public.citizen_reports for select to authenticated
using (user_id = (select auth.uid()) or (status <> 'draft' and (select private.is_stakeholder())));
revoke all on public.citizen_reports from public,anon,authenticated;
grant select on public.citizen_reports to authenticated;

create table public.report_events (
  id bigint generated always as identity primary key,
  report_id uuid not null references public.citizen_reports(id) on delete cascade,
  actor_id uuid not null references public.profiles(id),
  status text not null,
  note text not null check (char_length(note) between 5 and 1500),
  created_at timestamptz not null default now()
);
create index report_events_report on public.report_events(report_id,created_at);
alter table public.report_events enable row level security;
create policy events_read_visible_report on public.report_events for select to authenticated
using (exists(select 1 from public.citizen_reports where id = report_id));
revoke all on public.report_events from public,anon,authenticated;
grant select on public.report_events to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('citizen-report-photos','citizen-report-photos',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
create policy citizen_photos_read on storage.objects for select to authenticated using (
  bucket_id = 'citizen-report-photos' and exists(select 1 from public.citizen_reports r where r.photo_path = name)
);
create policy citizen_photos_insert_draft on storage.objects for insert to authenticated with check (
  bucket_id = 'citizen-report-photos' and exists(select 1 from public.citizen_reports r where r.photo_path = name and r.user_id = (select auth.uid()) and r.status = 'draft')
);
create policy citizen_photos_update_draft on storage.objects for update to authenticated using (
  bucket_id = 'citizen-report-photos' and exists(select 1 from public.citizen_reports r where r.photo_path = name and r.user_id = (select auth.uid()) and r.status = 'draft')
) with check (
  bucket_id = 'citizen-report-photos' and exists(select 1 from public.citizen_reports r where r.photo_path = name and r.user_id = (select auth.uid()) and r.status = 'draft')
);

create function public.create_report_draft(p_id uuid,p_road_name text,p_address text,p_description text,p_latitude double precision,p_longitude double precision,p_contact text,p_photo_path text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid(); r public.citizen_reports;
begin
  if u is null then raise exception 'Silakan masuk terlebih dahulu.'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(u::text));
  select * into r from public.citizen_reports where id = p_id;
  if found then
    if r.user_id <> u then raise exception 'Laporan tidak dapat diakses.'; end if;
    if r.status <> 'draft' then return to_jsonb(r); end if;
    update public.citizen_reports set road_name=trim(p_road_name),address=trim(p_address),description=trim(p_description),latitude=p_latitude,longitude=p_longitude,contact=trim(p_contact),photo_path=p_photo_path,updated_at=now() where id=p_id returning * into r;
    return to_jsonb(r);
  end if;
  if (select count(*) from public.citizen_reports where user_id=u and created_at>now()-interval '1 day') >= 20 then raise exception 'Batas laporan harian tercapai.'; end if;
  if (select count(*) from public.citizen_reports where user_id=u and created_at>now()-interval '1 minute') >= 3 then raise exception 'Terlalu banyak laporan dalam satu menit.'; end if;
  insert into public.citizen_reports(id,user_id,reporter_name,road_name,address,description,latitude,longitude,contact,photo_path)
  values(p_id,u,(select full_name from public.profiles where id=u),trim(p_road_name),trim(p_address),trim(p_description),p_latitude,p_longitude,trim(p_contact),p_photo_path) returning * into r;
  return to_jsonb(r);
end;
$$;

create function public.submit_citizen_report(p_id uuid) returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.citizen_reports;
begin
  if auth.uid() is null then raise exception 'Silakan masuk terlebih dahulu.'; end if;
  select * into r from public.citizen_reports where id=p_id and user_id=auth.uid() for update;
  if not found then raise exception 'Laporan tidak dapat diakses.'; end if;
  if r.status <> 'draft' then return to_jsonb(r); end if;
  if not exists(select 1 from storage.objects where bucket_id='citizen-report-photos' and name=r.photo_path) then raise exception 'Foto belum berhasil diunggah.'; end if;
  update public.citizen_reports set status='received',submitted_at=now(),updated_at=now() where id=p_id returning * into r;
  insert into public.report_events(report_id,actor_id,status,note) values(p_id,auth.uid(),'received','Laporan diterima di antrean Jalanova dan menunggu pemeriksaan petugas.');
  return to_jsonb(r);
end;
$$;

create function public.review_citizen_report(p_id uuid,p_status text,p_urgency text,p_road_id text,p_agency text,p_note text,p_expected_updated_at timestamptz)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.citizen_reports; allowed text[];
begin
  if auth.uid() is null or not private.is_stakeholder() then raise exception 'Akses petugas diperlukan.'; end if;
  select * into r from public.citizen_reports where id=p_id for update;
  if not found or r.status='draft' then raise exception 'Laporan belum tersedia untuk ditinjau.'; end if;
  if r.updated_at is distinct from p_expected_updated_at then raise exception 'Laporan sudah diperbarui petugas lain. Muat ulang terlebih dahulu.'; end if;
  allowed := case r.status
    when 'received' then array['reviewing','rejected']
    when 'reviewing' then array['reviewing','scheduled','rejected']
    when 'scheduled' then array['scheduled','in_progress','reviewing']
    when 'in_progress' then array['in_progress','resolved','reviewing']
    else array['reviewing'] end;
  if p_status is null or not p_status=any(allowed) then raise exception 'Perubahan status tidak sesuai alur penanganan.'; end if;
  if p_note is null or char_length(trim(p_note)) not between 5 and 1500 then raise exception 'Tambahkan catatan untuk pelapor (5–1500 karakter).'; end if;
  if p_status in ('scheduled','in_progress','resolved') and (p_road_id is null or nullif(trim(p_agency),'') is null or p_urgency='unassessed') then raise exception 'Pastikan ruas, prioritas, dan instansi penanganan sebelum menetapkan pelaksanaan.'; end if;
  update public.citizen_reports set status=p_status,urgency=p_urgency,verified_road_id=p_road_id,assigned_agency=nullif(trim(p_agency),''),updated_at=clock_timestamp() where id=p_id returning * into r;
  insert into public.report_events(report_id,actor_id,status,note) values(p_id,auth.uid(),p_status,trim(p_note));
  return to_jsonb(r);
end;
$$;
revoke all on function public.create_report_draft(uuid,text,text,text,double precision,double precision,text,text) from public,anon;
revoke all on function public.submit_citizen_report(uuid) from public,anon;
revoke all on function public.review_citizen_report(uuid,text,text,text,text,text,timestamptz) from public,anon;
grant execute on function public.create_report_draft(uuid,text,text,text,double precision,double precision,text,text) to authenticated;
grant execute on function public.submit_citizen_report(uuid) to authenticated;
grant execute on function public.review_citizen_report(uuid,text,text,text,text,text,timestamptz) to authenticated;
commit;
