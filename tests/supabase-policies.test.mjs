import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

test('Supabase migration and access policies run on embedded PostgreSQL',async t=>{
  const db=new PGlite();
  t.after(()=>db.close());
  await db.exec(`
    create role anon nologin; create role authenticated nologin;
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth,storage,public to anon,authenticated;
    grant execute on function auth.uid() to anon,authenticated;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text,metadata jsonb);
    alter table storage.objects enable row level security;
    grant select,insert,update,delete on storage.objects to authenticated;
  `);
  await db.exec(fs.readFileSync(new URL('../supabase/migrations/202611020001_citizen_reports.sql',import.meta.url),'utf8'));
  await db.exec(fs.readFileSync(new URL('../supabase/migrations/202611020002_demo_access.sql',import.meta.url),'utf8'));
  await db.exec(fs.readFileSync(new URL('../supabase/seed-road-registry.sql',import.meta.url),'utf8'));
  const citizen='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222',staff='33333333-3333-4333-8333-333333333333',id='44444444-4444-4444-8444-444444444444';
  await db.query('insert into auth.users(id,raw_user_meta_data) values ($1,$2),($3,$4),($5,$6)',[citizen,JSON.stringify({full_name:'QA Citizen',role:'stakeholder'}),other,JSON.stringify({full_name:'QA Other'}),staff,JSON.stringify({full_name:'QA Staff'})]);
  await db.query("update public.profiles set role='stakeholder',agency='QA-only agency' where id=$1",[staff]);
  const as=async(user,run)=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user || '']);await db.exec(user ? 'set role authenticated' : 'set role anon');try{return await run();}finally{await db.exec('reset role');}};
  const draft=()=>db.query('select public.create_report_draft($1,$2,$3,$4,$5,$6,$7,$8) as report',[id,'Jalan pengujian','Alamat pengujian saja','Keterangan pengujian, bukan laporan masyarakat sebenarnya.',-7.2,112.7,'QA-only',`${citizen}/${id}/photo.jpg`]);
  let report;
  await t.test('signup metadata cannot grant staff access; anonymous and direct mutations are denied',async()=>{
    const rows=await db.query('select role from public.profiles where id=$1',[citizen]);assert.equal(rows.rows[0].role,'citizen');
    await as(citizen,async()=>{await assert.rejects(db.query("update public.profiles set role='stakeholder'"),/permission denied/);});
    await as(null,async()=>{await assert.rejects(draft(),/permission denied/);await assert.rejects(db.query('select * from public.citizen_reports'),/permission denied/);});
  });
  await t.test('drafts are private and cannot be submitted without the uploaded photo',async()=>{
    await as(citizen,async()=>{report=(await draft()).rows[0].report;assert.equal(report.status,'draft');await assert.rejects(db.query('select public.submit_citizen_report($1)',[id]),/Foto belum/);});
    for(const user of [other,staff])await as(user,async()=>{assert.equal((await db.query('select * from public.citizen_reports')).rows.length,0);});
  });
  await t.test('only the draft owner can upload; submitted photos are immutable and private to owner/staff',async()=>{
    const path=`${citizen}/${id}/photo.jpg`;
    await as(other,async()=>{await assert.rejects(db.query('insert into storage.objects(bucket_id,name) values ($1,$2)',['citizen-report-photos',path]),/row-level security/);});
    await as(citizen,async()=>{await db.query('insert into storage.objects(bucket_id,name) values ($1,$2)',['citizen-report-photos',path]);report=(await db.query('select public.submit_citizen_report($1) as report',[id])).rows[0].report;assert.equal(report.status,'received');assert.equal(report.urgency,'unassessed');assert.equal(report.reporter_name,'QA Citizen');assert.equal((await db.query("update storage.objects set metadata='{}' returning *")).rows.length,0);});
    await as(other,async()=>{assert.equal((await db.query('select * from storage.objects')).rows.length,0);assert.equal((await db.query('select * from public.report_events')).rows.length,0);await assert.rejects(db.query('select public.submit_citizen_report($1)',[id]),/tidak dapat diakses/);});
    await as(staff,async()=>{assert.equal((await db.query('select * from public.citizen_reports')).rows.length,1);assert.equal((await db.query('select * from storage.objects')).rows.length,1);});
  });
  await t.test('only staff can follow the status workflow, with notes and stale-write protection',async()=>{
    const review=(status,when=report.updated_at,road=null,agency='')=>db.query('select public.review_citizen_report($1,$2,$3,$4,$5,$6,$7) as report',[id,status,'priority',road,agency,'Catatan QA untuk pelapor.',when]);
    await as(citizen,async()=>{await assert.rejects(review('reviewing'),/Akses petugas/);});
    await as(staff,async()=>{
      await assert.rejects(review('resolved'),/status tidak sesuai/);
      report=(await review('reviewing')).rows[0].report;
      await assert.rejects(review('scheduled'),/Pastikan ruas/);
      await assert.rejects(review('reviewing','2000-01-01T00:00:00Z'),/petugas lain/);
      const road=(await db.query('select id from public.road_registry limit 1')).rows[0].id;
      report=(await review('scheduled',report.updated_at,road,'QA-only agency')).rows[0].report;
      assert.equal(report.status,'scheduled');assert.equal(report.priority_order,2);
    });
    await as(citizen,async()=>{assert.equal((await db.query('select * from public.report_events')).rows.length,3);await db.query('select public.submit_citizen_report($1)',[id]);assert.equal((await db.query('select * from public.report_events')).rows.length,3);});
  });
  await t.test('photo bucket remains private with the expected size and MIME limits',async()=>{
    const bucket=(await db.query('select * from storage.buckets')).rows[0];assert.equal(bucket.public,false);assert.equal(Number(bucket.file_size_limit),5242880);assert.deepEqual(bucket.allowed_mime_types,['image/jpeg','image/png','image/webp']);
    assert.equal((await db.query('select * from public.road_registry')).rows.length,15);
  });
  await t.test('a demo stakeholder cannot read real reports or perform government actions',async()=>{
    await db.query('update public.profiles set is_demo=true where id=$1',[staff]);
    await as(staff,async()=>{assert.equal((await db.query('select * from public.citizen_reports')).rows.length,0);assert.equal((await db.query('select * from storage.objects')).rows.length,0);await assert.rejects(db.query('select public.review_citizen_report($1,$2,$3,$4,$5,$6,$7)',[id,'reviewing','routine',null,'','QA-only note',report.updated_at]),/Akses petugas/);await assert.rejects(db.query('select public.create_report_draft($1,$2,$3,$4,$5,$6,$7,$8)',[staff,'Jalan uji','Alamat uji','Keterangan pengujian bukan laporan sebenarnya.',-7.2,112.7,'',`${staff}/${staff}/photo.jpg`]),/Akun demo/);});
  });
  await t.test('work evidence is private and completion needs a dated photo, cost, and document',async()=>{
    await db.exec(fs.readFileSync(new URL('../supabase/migrations/202611020003_work_evidence.sql',import.meta.url),'utf8'));
    await db.exec(fs.readFileSync(new URL('../supabase/migrations/202611020004_work_upload_access.sql',import.meta.url),'utf8'));
    await db.exec(fs.readFileSync(new URL('../supabase/migrations/202611020005_work_any_road.sql',import.meta.url),'utf8'));
    await db.query('update public.profiles set is_demo=false where id=$1',[staff]);
    const entry='55555555-5555-4555-8555-555555555555';
    const photoPath=`${id}/${entry}/work.jpg`,documentPath=`${id}/${entry}/expense.pdf`;
    const road=(await db.query('select id from public.road_registry limit 1')).rows[0].id;
    const work=(status,when=report.updated_at,photo=null,document=null,spent=null,roadId=null)=>db.query('select public.record_report_work($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) as report',[id,status,'priority',roadId,'QA-only agency','Pekerjaan dicatat dalam uji akses.',when,new Date().toISOString(),spent,photo,document]);
    await as(citizen,async()=>{await assert.rejects(db.query('insert into storage.objects(bucket_id,name) values ($1,$2)',['report-work-evidence',photoPath]),/row-level security/);await assert.rejects(work('in_progress'),/permission denied|Akses petugas/);});
    await as(staff,async()=>{
      await assert.rejects(db.query('select public.review_citizen_report($1,$2,$3,$4,$5,$6,$7)',[id,'in_progress','priority',road,'QA-only agency','Trying old RPC',report.updated_at]),/permission denied/);
      report=(await work('in_progress')).rows[0].report;
      assert.equal(report.verified_road_id,null);
      await assert.rejects(work('resolved'),/memerlukan waktu, biaya, foto pekerjaan, dan dokumen/);
      await db.query('insert into storage.objects(bucket_id,name) values ($1,$2),($1,$3)',['report-work-evidence',photoPath,documentPath]);
      assert.equal((await db.query("select * from storage.objects where bucket_id='report-work-evidence'")).rows.length,2);
      report=(await work('resolved',report.updated_at,photoPath,documentPath,125000)).rows[0].report;
      assert.equal(report.status,'resolved');
    });
    await as(other,async()=>{assert.equal((await db.query("select * from storage.objects where bucket_id='report-work-evidence'")).rows.length,0);});
    await as(citizen,async()=>{
      assert.equal((await db.query("select * from storage.objects where bucket_id='report-work-evidence'")).rows.length,2);
      const rows=(await db.query('select status,spent_idr,work_photo_path,expense_document_path from public.report_events where report_id=$1 order by id desc limit 1',[id])).rows;
      assert.equal(rows[0].status,'resolved');assert.equal(Number(rows[0].spent_idr),125000);assert.equal(rows[0].work_photo_path,photoPath);assert.equal(rows[0].expense_document_path,documentPath);
    });
  });
});
