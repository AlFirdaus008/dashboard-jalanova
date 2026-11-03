import React, { useEffect, useState } from 'react';
import { ArrowUpRight, RefreshCw } from 'lucide-react';
import { useAuth } from './Auth.jsx';
import { REPORT_STATUSES, URGENCY, isDemoReport } from './lib/citizen-reports.mjs';
import { supabase } from './lib/supabase.mjs';
import { reportDate } from './lib/reports.mjs';

export function useLiveReports() {
  const {session,profile}=useAuth();
  const allowed=Boolean(session && profile?.role==='stakeholder' && !profile.is_demo);
  const [reports,setReports]=useState([]),[total,setTotal]=useState(0),[loading,setLoading]=useState(false),[error,setError]=useState(''),[refresh,setRefresh]=useState(0);
  useEffect(()=>{
    if(!allowed || !supabase){setReports([]);setTotal(0);return;}
    let active=true;
    const load=()=>{
      setLoading(true);
      supabase.from('citizen_reports').select('id,report_code,road_name,address,description,latitude,longitude,status,urgency,submitted_at,updated_at,verified_road_id,assigned_agency,reporter_name,contact,photo_path',{count:'exact'})
        .neq('status','draft').order('submitted_at',{ascending:false}).limit(500)
        .then(({data,count,error})=>{if(active){if(error){setError('Laporan terbaru belum dapat dimuat.');}else{setReports(data||[]);setTotal(count||0);setError('');}setLoading(false);}})
        .catch(()=>{if(active){setError('Laporan terbaru belum dapat dimuat.');setLoading(false);}});
    };
    load();const timer=setInterval(load,30000);window.addEventListener('focus',load);
    return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',load);};
  },[allowed,refresh]);
  return {allowed,reports,total,loading,error,refresh:()=>setRefresh(value=>value+1)};
}

export function LiveReportsPanel({state,onSelect}) {
  if(!state.allowed)return null;
  return <section className="live-reports-panel" aria-labelledby="live-reports-title"><div className="live-reports-head"><div><span className="eyebrow">LAPORAN WARGA</span><h2 id="live-reports-title">Laporan masuk</h2><p>Foto dan titik dari warga masuk ke antrean petugas. Laporan contoh diberi tanda Data demo agar mudah dibedakan.</p></div><div className="live-reports-actions"><strong>{state.total}<small>laporan</small></strong><button type="button" onClick={state.refresh} aria-label="Muat ulang laporan warga" title="Muat ulang laporan warga"><RefreshCw size={16} /></button><a href="#/inbox">Buka antrean <ArrowUpRight size={15} /></a></div></div>
    {state.error && <p className="form-error" role="alert">{state.error}</p>}
    {state.loading && !state.reports.length ? <p className="live-reports-empty">Memuat laporan…</p> : state.reports.length ? <div className="live-reports-list">{state.reports.slice(0,4).map(report=><button key={report.id} type="button" onClick={()=>onSelect(report)}><span>{report.report_code}{isDemoReport(report) && <span className="demo-report-badge">Data demo</span>}<strong>{report.road_name}</strong><small>{reportDate(report.submitted_at)}</small></span><span className={`citizen-status status-${report.status}`}>{REPORT_STATUSES[report.status]}</span><span className="live-urgency">{URGENCY[report.urgency]}</span><ArrowUpRight size={15} /></button>)}</div> : <p className="live-reports-empty">Belum ada laporan warga. Laporan yang dikirim akan muncul di sini dan di peta.</p>}
    <p className="live-reports-note">Titik warga di peta memakai lokasi yang dilaporkan. Titik eksperimen notebook tetap ditampilkan sebagai data terpisah.{state.total>state.reports.length && ` Peta menampilkan ${state.reports.length} laporan terbaru.`}</p>
  </section>;
}
