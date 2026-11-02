// Local showcase accounts only. Read credentials from hidden stdin; never put passwords in web assets.
import fs from 'node:fs';
import pg from 'pg';

async function readHiddenJson() {
  return new Promise((resolve,reject)=>{
    let buffer='';
    if(process.stdin.isTTY)process.stdin.setRawMode(true);
    process.stdin.setEncoding('utf8');process.stdin.resume();
    process.stdout.write('Ready for account setup JSON on hidden stdin.\n');
    const read=chunk=>{
      buffer+=chunk;
      if(buffer.includes('\u0003')){cleanup();reject(Error('cancelled'));return;}
      if(buffer.includes('\n') || buffer.includes('\r')){
        cleanup();try{resolve(JSON.parse(buffer.trim()));}catch{reject(Error('invalid-input'));}buffer='';
      }
    };
    const cleanup=()=>{process.stdin.off('data',read);if(process.stdin.isTTY)process.stdin.setRawMode(false);process.stdin.pause();};
    process.stdin.on('data',read);
  });
}

const accounts=[
  {email:'userwarga@demo.jalanova.invalid',name:'Warga Jalanova',role:'citizen',agency:null},
  {email:'usergovernence@demo.jalanova.invalid',name:'Petugas Jalanova',role:'stakeholder',agency:null},
];
let client;
try {
  if(!process.argv.includes('--provision'))throw Error('explicit-provision-required');
  const input=await readHiddenJson();
  if(input.host!=='aws-0-eu-west-2.pooler.supabase.com' || typeof input.dbPassword!=='string' || typeof input.accountPassword!=='string')throw Error('invalid-input');
  const ca=fs.readFileSync(new URL('../supabase/certs/prod-ca-2021.crt',import.meta.url),'utf8');
  client=new pg.Client({host:input.host,port:5432,user:'postgres.kfevjvfmbsudfgahxmuj',database:'postgres',password:input.dbPassword,ssl:{rejectUnauthorized:true,ca},connectionTimeoutMillis:12000,statement_timeout:30000});
  input.dbPassword=undefined;
  await client.connect();
  await client.query('begin');
  try {
    for(const account of accounts){
      const existing=await client.query('select id from auth.users where lower(email)=lower($1)',[account.email]);
      if(existing.rowCount)throw Error('account-already-exists');
      const inserted=await client.query(`insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,recovery_token,email_change,email_change_token_new,email_change_token_current,reauthentication_token,is_sso_user,is_anonymous)
        values('00000000-0000-0000-0000-000000000000',gen_random_uuid(),'authenticated','authenticated',$1,extensions.crypt($2,extensions.gen_salt('bf')),now(),jsonb_build_object('provider','email','providers',jsonb_build_array('email')),jsonb_build_object('full_name',$3::text),now(),now(),'','','','','','',false,false) returning id`,[account.email,input.accountPassword,account.name]);
      const id=inserted.rows[0].id;
      await client.query(`insert into auth.identities(id,provider_id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
        values(gen_random_uuid(),$1::text,$1::uuid,jsonb_build_object('sub',$1::text,'email',$2::text,'email_verified',true),'email',now(),now(),now())`,[id,account.email]);
      await client.query('update public.profiles set role=$2,is_demo=false,agency=$3 where id=$1',[id,account.role,account.agency]);
    }
    await client.query('commit');
  } catch(error){await client.query('rollback');throw error;}
  const variables=Object.fromEntries(fs.readFileSync(new URL('../.env.local',import.meta.url),'utf8').split(/\r?\n/).filter(line=>line.includes('=')).map(line=>{const index=line.indexOf('=');return [line.slice(0,index),line.slice(index+1)];}));
  for(const account of accounts){
    const login=await fetch(variables.VITE_SUPABASE_URL+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:variables.VITE_SUPABASE_PUBLISHABLE_KEY,'Content-Type':'application/json'},body:JSON.stringify({email:account.email,password:input.accountPassword}),signal:AbortSignal.timeout(10000)});
    const session=await login.json();
    if(!login.ok || !session.access_token)throw Error('account-login-failed');
    const headers={apikey:variables.VITE_SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${session.access_token}`};
    const response=await fetch(variables.VITE_SUPABASE_URL+'/rest/v1/profiles?select=role,is_demo',{headers,signal:AbortSignal.timeout(10000)});
    const profile=(await response.json())[0];
    if(profile?.role!==account.role || profile?.is_demo!==false)throw Error('unexpected-profile');
    await fetch(variables.VITE_SUPABASE_URL+'/auth/v1/logout?scope=local',{method:'POST',headers,signal:AbortSignal.timeout(10000)});
  }
  input.accountPassword=undefined;
  console.log(JSON.stringify({created:accounts.length,loginsVerified:true,roles:['citizen','stakeholder'],passwordsStoredInRepository:false}));
} catch(error){
  const allowed=['explicit-provision-required','invalid-input','account-already-exists','account-login-failed','unexpected-profile','cancelled'];
  console.log(JSON.stringify({created:false,code:allowed.includes(error.message)?error.message:(error.code||'account-setup-failed')}));
  process.exitCode=1;
} finally {await client?.end().catch(()=>{});}
