-- Existing reports may come from roads outside the 15 notebook references.
begin;
create or replace function public.record_report_work(
  p_id uuid,p_status text,p_urgency text,p_road_id text,p_agency text,p_note text,
  p_expected_updated_at timestamptz,p_worked_at timestamptz,p_spent_idr numeric,
  p_work_photo_path text,p_expense_document_path text
) returns jsonb language plpgsql security definer set search_path = '' as $$
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
  if p_note is null or char_length(trim(p_note)) not between 5 and 1500 then raise exception 'Tambahkan catatan untuk pelapor (5-1500 karakter).'; end if;
  if p_status in ('scheduled','in_progress','resolved') and (nullif(trim(p_agency),'') is null or p_urgency='unassessed') then
    raise exception 'Pastikan prioritas dan instansi penanganan sebelum menetapkan pelaksanaan.';
  end if;
  if p_spent_idr is not null and (p_spent_idr<0 or p_spent_idr>999999999999.99) then raise exception 'Biaya aktual tidak valid.'; end if;
  if p_worked_at is not null and (p_worked_at<r.submitted_at or p_worked_at>now()+interval '5 minutes') then raise exception 'Tanggal kerja tidak sesuai waktu laporan.'; end if;
  if p_status='resolved' and (p_worked_at is null or p_spent_idr is null or p_work_photo_path is null or p_expense_document_path is null) then
    raise exception 'Penyelesaian memerlukan waktu, biaya, foto pekerjaan, dan dokumen pengeluaran.';
  end if;
  if p_status in ('in_progress','resolved') and p_worked_at is null then raise exception 'Isi tanggal dan jam pekerjaan.'; end if;
  if p_work_photo_path is not null and (
    p_work_photo_path !~ ('^'||p_id::text||'/[0-9a-f-]{36}/work\.(jpg|png|webp)$')
    or not exists(select 1 from storage.objects where bucket_id='report-work-evidence' and name=p_work_photo_path)
  ) then raise exception 'Foto pekerjaan belum tersedia.'; end if;
  if p_expense_document_path is not null and (
    p_expense_document_path !~ ('^'||p_id::text||'/[0-9a-f-]{36}/expense\.(jpg|png|webp|pdf)$')
    or not exists(select 1 from storage.objects where bucket_id='report-work-evidence' and name=p_expense_document_path)
  ) then raise exception 'Dokumen pengeluaran belum tersedia.'; end if;
  update public.citizen_reports set status=p_status,urgency=p_urgency,verified_road_id=p_road_id,
    assigned_agency=nullif(trim(p_agency),''),updated_at=clock_timestamp() where id=p_id returning * into r;
  insert into public.report_events(report_id,actor_id,status,note,work_at,spent_idr,work_photo_path,expense_document_path)
  values(p_id,auth.uid(),p_status,trim(p_note),p_worked_at,p_spent_idr,p_work_photo_path,p_expense_document_path);
  return to_jsonb(r);
end;
$$;
commit;
