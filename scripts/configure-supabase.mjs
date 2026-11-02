// Credentials arrive over hidden stdin and are never saved to disk or printed.
import fs from 'node:fs';
import pg from 'pg';

function readHiddenJson() {
  return new Promise((resolve,reject)=>{
    let buffer='';
    if(process.stdin.isTTY)process.stdin.setRawMode(true);
    process.stdin.setEncoding('utf8');process.stdin.resume();
    process.stdout.write('Ready for database configuration JSON on stdin (input hidden).\n');
    const cleanup=()=>{process.stdin.off('data',read);if(process.stdin.isTTY)process.stdin.setRawMode(false);process.stdin.pause();};
    const read=chunk=>{buffer+=chunk;if(buffer.includes('\u0003')){cleanup();reject(Error('cancelled'));return;}if(buffer.includes('\n') || buffer.includes('\r')){cleanup();try{resolve(JSON.parse(buffer.trim()));}catch{reject(Error('invalid-input'));}buffer='';}};
    process.stdin.on('data',read);
  });
}
let client;
try {
  const input=await readHiddenJson();
  if(!['db.kfevjvfmbsudfgahxmuj.supabase.co','aws-0-eu-west-2.pooler.supabase.com'].includes(input.host))throw Error('unexpected-host');
  const user=input.host.includes('.pooler.') ? 'postgres.kfevjvfmbsudfgahxmuj' : 'postgres';
  const ca=fs.readFileSync(new URL('../supabase/certs/prod-ca-2021.crt',import.meta.url),'utf8');
  client=new pg.Client({host:input.host,port:5432,user,database:'postgres',password:input.password,ssl:{rejectUnauthorized:true,ca},connectionTimeoutMillis:12000,statement_timeout:30000});
  input.password=undefined;
  await client.connect();
  const existing=await client.query("select to_regclass('public.profiles') is not null as profiles, to_regclass('public.citizen_reports') is not null as reports");
  if(process.argv.includes('--work-evidence')) {
    const installed=await client.query("select 1 from information_schema.columns where table_schema='public' and table_name='report_events' and column_name='work_photo_path'");
    if(installed.rowCount) {
      const fn=await client.query("select to_regprocedure('public.record_report_work(uuid,text,text,text,text,text,timestamp with time zone,timestamp with time zone,numeric,text,text)') is not null as ready");
      if(!fn.rows[0]?.ready)throw Error('partial-work-evidence-schema');
      const policy=await client.query("select qual from pg_policies where schemaname='storage' and tablename='objects' and policyname='work_evidence_read'");
      if(!policy.rows[0])throw Error('partial-work-evidence-schema');
      if(!policy.rows[0].qual.includes('is_stakeholder'))await client.query(fs.readFileSync(new URL('../supabase/migrations/202611020004_work_upload_access.sql',import.meta.url),'utf8'));
      const body=await client.query("select prosrc from pg_proc where oid='public.record_report_work(uuid,text,text,text,text,text,timestamp with time zone,timestamp with time zone,numeric,text,text)'::regprocedure");
      if(body.rows[0]?.prosrc.includes('p_road_id is null or'))await client.query(fs.readFileSync(new URL('../supabase/migrations/202611020005_work_any_road.sql',import.meta.url),'utf8'));
      console.log(JSON.stringify({workEvidenceConfigured:true,alreadyInstalled:true,uploadReadReady:true,anyRoadReady:true}));
    } else {
      if(!existing.rows[0].reports)throw Error('base-schema-missing');
      await client.query(fs.readFileSync(new URL('../supabase/migrations/202611020003_work_evidence.sql',import.meta.url),'utf8'));
      await client.query(fs.readFileSync(new URL('../supabase/migrations/202611020004_work_upload_access.sql',import.meta.url),'utf8'));
      const bucket=await client.query("select public,file_size_limit from storage.buckets where id='report-work-evidence'");
      console.log(JSON.stringify({workEvidenceConfigured:true,privateBucket:bucket.rows[0]?.public===false,maxBytes:bucket.rows[0]?.file_size_limit}));
    }
  }
  else if(process.argv.includes('--demo-account')) {
    const hasDemo=await client.query("select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='is_demo'");
    if(!hasDemo.rowCount)await client.query(fs.readFileSync(new URL('../supabase/migrations/202611020002_demo_access.sql',import.meta.url),'utf8'));
    if(!input.demoPassword)throw Error('invalid-input');
    const email='usergovernance@demo.jalanova.invalid';
    const existingUser=await client.query('select id from auth.users where email=$1',[email]);
    if(!existingUser.rowCount) {
      await client.query('begin');
      try {
        const inserted=await client.query(`insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,recovery_token,email_change,email_change_token_new,email_change_token_current,reauthentication_token,is_sso_user,is_anonymous)
          values('00000000-0000-0000-0000-000000000000',gen_random_uuid(),'authenticated','authenticated',$1,extensions.crypt($2,extensions.gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Demo usergovernance"}',now(),now(),'','','','','','',false,false) returning id`,[email,input.demoPassword]);
        const id=inserted.rows[0].id;
        await client.query(`insert into auth.identities(id,provider_id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at) values(gen_random_uuid(),$1::text,$1::uuid,jsonb_build_object('sub',$1::text,'email',$2::text,'email_verified',true),'email',now(),now(),now())`,[id,email]);
        await client.query("update public.profiles set role='stakeholder',is_demo=true,agency='Demo pemangku kepentingan' where id=$1",[id]);
        await client.query('commit');
      } catch(error){await client.query('rollback');throw error;}
    }
    const variables=Object.fromEntries(fs.readFileSync(new URL('../.env.local',import.meta.url),'utf8').split(/\r?\n/).filter(line=>line.includes('=')).map(line=>{const index=line.indexOf('=');return [line.slice(0,index),line.slice(index+1)];}));
    const base=variables.VITE_SUPABASE_URL,apikey=variables.VITE_SUPABASE_PUBLISHABLE_KEY;
    const login=await fetch(base+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey,'Content-Type':'application/json'},body:JSON.stringify({email,password:input.demoPassword}),signal:AbortSignal.timeout(10000)});
    input.demoPassword=undefined;
    const session=await login.json();
    if(!login.ok || !session.access_token)throw Error('demo-login-failed');
    const headers={apikey,Authorization:`Bearer ${session.access_token}`};
    const response=await fetch(base+'/rest/v1/profiles?select=role,is_demo',{headers,signal:AbortSignal.timeout(10000)});const profile=(await response.json())[0];
    if(profile?.role !== 'stakeholder' || profile?.is_demo !== true)throw Error('unexpected-demo-profile');
    const denied=await fetch(base+'/rest/v1/rpc/review_citizen_report',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({p_id:'00000000-0000-0000-0000-000000000000',p_status:'reviewing',p_urgency:'routine',p_road_id:null,p_agency:'',p_note:'Permission check only; no report is modified.',p_expected_updated_at:'2000-01-01T00:00:00Z'}),signal:AbortSignal.timeout(10000)});
    const denial=await denied.json();
    if(denied.ok || !/Akses petugas diperlukan/.test(denial.message || ''))throw Error('unexpected-demo-access');
    await fetch(base+'/auth/v1/logout?scope=local',{method:'POST',headers,signal:AbortSignal.timeout(10000)});
    console.log(JSON.stringify({demoLoginVerified:true,role:profile.role,isDemo:profile.is_demo,realReportActionsDenied:true}));
  }
  else if(process.argv.includes('--verify')) {
    const rows=await client.query("select relname,relrowsecurity from pg_class where oid in ('public.profiles'::regclass,'public.citizen_reports'::regclass,'public.report_events'::regclass,'public.road_registry'::regclass)");
    const bucket=await client.query("select public,file_size_limit from storage.buckets where id='citizen-report-photos'");
    const roads=await client.query('select count(*)::int as count from public.road_registry');
    const users=await client.query('select count(*)::int as count from public.profiles');
    const reports=await client.query('select count(*)::int as count from public.citizen_reports');
    const workBucket=await client.query("select public,file_size_limit from storage.buckets where id='report-work-evidence'");
    const workFunction=await client.query("select to_regprocedure('public.record_report_work(uuid,text,text,text,text,text,timestamp with time zone,timestamp with time zone,numeric,text,text)') is not null as ready");
    console.log(JSON.stringify({connected:true,allTablesRls:rows.rows.length===4 && rows.rows.every(row=>row.relrowsecurity),privatePhotoBucket:bucket.rows[0]?.public===false,maxPhotoBytes:bucket.rows[0]?.file_size_limit,privateWorkBucket:workBucket.rows[0]?.public===false,maxWorkBytes:workBucket.rows[0]?.file_size_limit,workFunctionReady:workFunction.rows[0]?.ready,roadReferences:roads.rows[0].count,profileCount:users.rows[0].count,reportCount:reports.rows[0].count}));
  }
  else if(process.argv.includes('--check'))console.log(JSON.stringify({connected:true,...existing.rows[0]}));
  else {
    const migration=fs.readFileSync(new URL('../supabase/migrations/202611020001_citizen_reports.sql',import.meta.url),'utf8').replace(/^begin;$/m,'').replace(/^commit;$/m,'');
    const seed=fs.readFileSync(new URL('../supabase/seed-road-registry.sql',import.meta.url),'utf8');
    if(existing.rows[0].profiles || existing.rows[0].reports)throw Error('existing-schema-review-required');
    await client.query('begin');
    const demoMigration=fs.readFileSync(new URL('../supabase/migrations/202611020002_demo_access.sql',import.meta.url),'utf8').replace(/^begin;$/m,'').replace(/^commit;$/m,'');
    try {await client.query(migration);await client.query(demoMigration);await client.query(seed);await client.query('commit');}
    catch(error){await client.query('rollback');throw error;}
    console.log(JSON.stringify({configured:true,roadReferences:15,privatePhotoBucket:true,rlsEnabled:true}));
  }
} catch(error) {
  // Do not echo a connection string or the original error object.
  const code=error.code || (['existing-schema-review-required','unexpected-host','cancelled','invalid-input'].includes(error.message) ? error.message : 'database-configuration-failed');
  console.log(JSON.stringify({configured:false,code}));process.exitCode=1;
} finally {await client?.end().catch(()=>{});}
