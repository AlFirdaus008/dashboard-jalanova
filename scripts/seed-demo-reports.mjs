// Creates three clearly marked example reports through the same Supabase API as the citizen form.
// The password is read without echo and is never written to the repository.
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { demoRoadPng } from './demo-report-image.mjs';
import { submitCitizenReport } from '../src/lib/citizen-api.mjs';
import { DEMO_REPORT_MARKER, PHOTO_BUCKET, isDemoReport } from '../src/lib/citizen-reports.mjs';

const examples = [
  { roadId:'SBY-01', damage:'Pothole', photo:0, stage:'received', description:'Terlihat lubang di jalur kendaraan. Mohon petugas memeriksa lokasi dan menilai kebutuhan perbaikannya.' },
  { roadId:'SBY-11', damage:'Rutting/Depression', photo:2, stage:'reviewing', description:'Permukaan jalan tampak turun dan tidak rata. Kendaraan perlu melambat saat melewati bagian ini.' },
  { roadId:'SBY-13', damage:'Longitudinal Crack', photo:1, stage:'scheduled', description:'Tampak retak memanjang pada permukaan jalan. Mohon penanganan setelah kondisi lokasi diperiksa.' },
];

function readEnv() {
  const source = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
  const entries = source.split(/\r?\n/).filter(line => line.includes('=')).map(line => {
    const at = line.indexOf('='); return [line.slice(0, at), line.slice(at + 1)];
  });
  return Object.fromEntries(entries);
}

function uuidFor(value) {
  const bytes = createHash('sha256').update(`jalanova-example-report-2026-v1:${value}`).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

function hiddenPassword() {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY) return reject(Error('interactive-input-required'));
    let value = '';
    process.stdin.setRawMode(true);
    process.stdin.setEncoding('utf8');
    process.stdin.resume();
    process.stdout.write('Kata sandi akun contoh (input disembunyikan): ');
    const finish = () => { process.stdin.off('data', read); process.stdin.setRawMode(false); process.stdin.pause(); process.stdout.write('\n'); };
    const read = chunk => {
      if (chunk.includes('\u0003')) { finish(); reject(Error('cancelled')); return; }
      const ending = chunk.search(/[\r\n]/);
      if (ending >= 0) { value += chunk.slice(0, ending); finish(); resolve(value); return; }
      value += chunk;
    };
    process.stdin.on('data', read);
  });
}

function makeClient(url, key) {
  return createClient(url, key, { auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false} });
}

async function signIn(client, email, password, expectedRole) {
  const login = await client.auth.signInWithPassword({email, password});
  if (login.error || !login.data.user) throw Error(`${expectedRole}-login-failed`);
  const profile = await client.from('profiles').select('role,is_demo').eq('id', login.data.user.id).single();
  if (profile.error || profile.data?.role !== expectedRole || profile.data.is_demo) throw Error(`${expectedRole}-access-unavailable`);
  return login.data.user;
}

async function advance(client, report, example) {
  if (example.stage === 'received' || ['scheduled','in_progress','resolved'].includes(report.status)) return report;
  const update = async (status, urgency, note) => {
    const result = await client.rpc('record_report_work', {
      p_id:report.id, p_status:status, p_urgency:urgency, p_road_id:example.roadId,
      p_agency:'Tim simulasi Jalanova', p_note:note, p_expected_updated_at:report.updated_at,
      p_worked_at:null, p_spent_idr:null, p_work_photo_path:null, p_expense_document_path:null,
    });
    if (result.error) { const failure=Error('demo-status-update-failed'); failure.detail={code:result.error.code,message:result.error.message}; throw failure; }
    report = result.data;
  };
  if (report.status === 'received') await update('reviewing', example.stage === 'scheduled' ? 'urgent' : 'priority', 'Foto dan titik laporan sedang ditinjau.');
  if (example.stage === 'scheduled' && report.status === 'reviewing') await update('scheduled', 'urgent', 'Jadwal penanganan dicatat. Pekerjaan lapangan belum dimulai.');
  return report;
}

async function run() {
  const data = JSON.parse(fs.readFileSync(new URL('../public/data/project.json', import.meta.url), 'utf8'));
  const plan = examples.map(example => {
    const site = data.sites.find(row => row.roadId === example.roadId && row.damage === example.damage)
      || data.sites.find(row => row.road_id === example.roadId && row.damage === example.damage)
      || data.sites.find(row => data.roads.find(road => road.id === example.roadId)?.name === row.road && row.damage === example.damage);
    const road = data.roads.find(row => row.id === example.roadId);
    if (!road || !site?.coordinates) throw Error('demo-source-site-missing');
    return {...example, id:uuidFor(example.roadId), roadName:road.name, coordinates:site.coordinates};
  });
  if (!process.argv.includes('--apply')) {
    console.log(JSON.stringify({dryRun:true,examples:plan.map(({roadName,stage,coordinates})=>({roadName,stage,coordinates})),message:'Jalankan dengan --apply untuk menyimpan ke Supabase.'},null,2));
    return;
  }
  const {VITE_SUPABASE_URL:url,VITE_SUPABASE_PUBLISHABLE_KEY:key} = readEnv();
  if (!url?.startsWith('https://') || !key?.startsWith('sb_publishable_')) throw Error('supabase-config-missing');
  const password = await hiddenPassword();
  const citizen = makeClient(url,key), staff = makeClient(url,key);
  try {
    const user = await signIn(citizen,'userwarga@demo.jalanova.invalid',password,'citizen');
    await signIn(staff,'usergovernence@demo.jalanova.invalid',password,'stakeholder');
    const results = [];
    for (const example of plan) {
      const photo = new File([demoRoadPng(example.photo)], `ilustrasi-demo-${example.roadId}.png`, {type:'image/png'});
      const report = await submitCitizenReport(citizen, {
        id:example.id, userId:user.id, photo,
        values:{roadName:example.roadName,address:`${example.roadName}, Surabaya.`,description:`${DEMO_REPORT_MARKER} ${example.description}`,latitude:String(example.coordinates[1]),longitude:String(example.coordinates[0]),contact:''},
      });
      if (!isDemoReport(report)) throw Error('existing-report-id-mismatch');
      const current = await advance(staff,report,example);
      results.push({code:current.report_code,road:current.road_name,status:current.status});
    }
    const ids=plan.map(example=>example.id);
    const [ownerView,staffView]=await Promise.all([
      citizen.from('citizen_reports').select('id,status,description,photo_path').in('id',ids),
      staff.from('citizen_reports').select('id,status,description,photo_path').in('id',ids),
    ]);
    if (ownerView.error || staffView.error || ownerView.data?.length !== plan.length || staffView.data?.length !== plan.length || !ownerView.data.every(isDemoReport) || !staffView.data.every(isDemoReport)) throw Error('demo-visibility-check-failed');
    const samplePath=ownerView.data[0].photo_path;
    const [ownerPhoto,staffPhoto]=await Promise.all([
      citizen.storage.from(PHOTO_BUCKET).createSignedUrl(samplePath,60),
      staff.storage.from(PHOTO_BUCKET).createSignedUrl(samplePath,60),
    ]);
    if (ownerPhoto.error || staffPhoto.error || !ownerPhoto.data?.signedUrl || !staffPhoto.data?.signedUrl) throw Error('demo-photo-access-failed');
    console.log(JSON.stringify({saved:results.length,visibleToCitizen:true,visibleToStaff:true,photoVisibleToBoth:true,reports:results},null,2));
  } finally {
    await Promise.allSettled([citizen.auth.signOut(),staff.auth.signOut()]);
  }
}

run().catch(error => {
  const known = ['interactive-input-required','cancelled','citizen-login-failed','stakeholder-login-failed','citizen-access-unavailable','stakeholder-access-unavailable','demo-source-site-missing','supabase-config-missing','demo-status-update-failed','demo-visibility-check-failed','demo-photo-access-failed','existing-report-id-mismatch'];
  console.error(JSON.stringify({saved:false,code:known.includes(error.message) ? error.message : 'demo-seed-failed',detail:error.detail}));
  process.exitCode = 1;
});
