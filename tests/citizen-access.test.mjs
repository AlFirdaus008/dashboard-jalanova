import test from 'node:test';
import assert from 'node:assert/strict';
import { appHref, dashboardHome, parseAppRoute } from '../src/lib/app-routes.mjs';
import { validateCitizenReport, reportPhotoPath, loginEmail } from '../src/lib/citizen-reports.mjs';
import { submitCitizenReport } from '../src/lib/citizen-api.mjs';
import { supabaseConfiguration } from '../src/lib/supabase.mjs';

test('information pages are public unless explicitly opened from the workspace',()=>{
  for(const page of ['method','evaluation']){
    assert.equal(parseAppRoute(page).workspace,false);
    assert.equal(parseAppRoute(appHref(page,{workspace:true})).workspace,true);
    const preview=parseAppRoute(appHref(page,{workspace:true,preview:true}));
    assert.equal(preview.preview,true);assert.equal(preview.page,page);
  }
  assert.equal(appHref('about',{workspace:true,preview:true}),'#/about');
  assert.equal(appHref('inbox',{preview:true}),'#/inbox');
  assert.equal(parseAppRoute('access_token=not-a-real-token').page,'about');
  assert.equal(dashboardHome(null),'#/account');
  assert.equal(dashboardHome({role:'citizen'}),'#/warga');
  assert.equal(dashboardHome({role:'stakeholder'}),'#/dashboard');
  assert.equal(parseAppRoute('warga').workspace,false);
});
test('browser configuration rejects secret credentials and never constructs a client when missing',()=>{
  assert.equal(loginEmail(' usergovernance '),'usergovernance@demo.jalanova.invalid');
  assert.equal(loginEmail(' USERWARGA '),'userwarga@demo.jalanova.invalid');
  assert.equal(loginEmail('usergovernence'),'usergovernence@demo.jalanova.invalid');
  assert.equal(loginEmail('EXAMPLE@EXAMPLE.TEST'),'example@example.test');
  assert.equal(supabaseConfiguration({}).configured,false);
  for(const key of ['sb_secret_test','a-service-role-jwt'])assert.equal(supabaseConfiguration({VITE_SUPABASE_URL:'https://example.supabase.co',VITE_SUPABASE_PUBLISHABLE_KEY:key}).configured,false);
  assert.equal(supabaseConfiguration({VITE_SUPABASE_URL:'https://example.supabase.co',VITE_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test'}).configured,true);
});
test('citizen form requires a real coordinate pair, usable photo and explicit consent',()=>{
  const values={roadName:'Jalan uji',address:'Alamat uji saja',description:'Keterangan uji dengan panjang yang cukup.',latitude:'-7.2',longitude:'112.7',consent:true};
  const photo={type:'image/jpeg',size:1024};assert.deepEqual(validateCitizenReport(values,photo),{});
  assert(validateCitizenReport({...values,latitude:''},photo).location);
  assert(validateCitizenReport({...values,latitude:'NaN'},photo).location);
  assert(validateCitizenReport({...values,latitude:'91'},photo).location);
  assert(validateCitizenReport({...values,consent:false},photo).consent);
  assert(validateCitizenReport(values,{type:'image/svg+xml',size:100}).photo);
  assert(validateCitizenReport(values,{type:'image/jpeg',size:6*1024*1024}).photo);
  assert.throws(()=>reportPhotoPath('../','x','image/jpeg'));
});
test('submission uploads only a draft and retries the same report without duplicating a received record',async()=>{
  const id='11111111-1111-4111-8111-111111111111',userId='22222222-2222-4222-8222-222222222222';
  const calls=[];let draftStatus='draft';
  const client={rpc:async(name,args)=>{calls.push(name);return {data:{id,status:name==='submit_citizen_report' ? 'received' : draftStatus},error:null};},storage:{from:()=>({upload:async(path)=>{calls.push(path);return {error:null};}})}};
  const payload={id,userId,values:{roadName:'Road',address:'Address',description:'Description',latitude:'-7.2',longitude:'112.7'},photo:{type:'image/jpeg'}};
  assert.equal((await submitCitizenReport(client,payload)).status,'received');
  assert.deepEqual(calls,['create_report_draft',`${userId}/${id}/photo.jpg`,'submit_citizen_report']);
  calls.length=0;draftStatus='received';await submitCitizenReport(client,payload);assert.deepEqual(calls,['create_report_draft']);
});
