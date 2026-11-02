-- Let staff confirm an uploaded file before its event is filed, and remove failed uploads.
begin;
drop policy work_evidence_read on storage.objects;
create policy work_evidence_read on storage.objects for select to authenticated using (
  bucket_id='report-work-evidence' and (
    (select private.is_stakeholder()) or exists (
      select 1 from public.report_events e
      where e.work_photo_path=name or e.expense_document_path=name
    )
  )
);
commit;
