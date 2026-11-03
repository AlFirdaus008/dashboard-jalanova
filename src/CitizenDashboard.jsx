import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Bell, Camera, CheckCircle2, RefreshCw } from 'lucide-react';
import { useAuth } from './Auth.jsx';
import { ReportQueue } from './ReportQueue.jsx';
import { REPORT_STATUSES } from './lib/citizen-reports.mjs';
import { reportDate } from './lib/reports.mjs';
import { supabase } from './lib/supabase.mjs';
import './citizen-dashboard.css';

export function CitizenDashboard({data}) {
  const {session,profile} = useAuth();
  const [summary,setSummary] = useState({total:0,active:0,resolved:0});
  const [updates,setUpdates] = useState([]), [roads,setRoads] = useState({}), [busy,setBusy] = useState(true), [error,setError] = useState(''), [notice,setNotice] = useState(''), [refresh,setRefresh] = useState(0), [queueRefresh,setQueueRefresh] = useState(0);
  const lastEvent=useRef(null);
  const userId=session?.user.id;
  useEffect(()=>{
    if(!userId || profile?.role!=='citizen' || !supabase)return;
    let active=true;
    const load=async()=>{
      try {
        const own=(columns,options)=>supabase.from('citizen_reports').select(columns,options).eq('user_id',userId).neq('status','draft');
        const [total,working,resolved,recent,events]=await Promise.all([
          own('id',{count:'exact',head:true}),
          own('id',{count:'exact',head:true}).in('status',['received','reviewing','scheduled','in_progress']),
          own('id',{count:'exact',head:true}).eq('status','resolved'),
          own('id,road_name,report_code').order('updated_at',{ascending:false}).limit(30),
          supabase.from('report_events').select('id,report_id,status,note,created_at,work_photo_path,expense_document_path,spent_idr').order('created_at',{ascending:false}).limit(6),
        ]);
        if([total,working,resolved,recent,events].some(result=>result.error))throw Error('load-failed');
        if(!active)return;
        const newest=events.data?.[0];
        if(lastEvent.current && newest && String(newest.id)!==lastEvent.current){
          setNotice(newest.status==='resolved' ? 'Perbaikan pada salah satu laporan Anda sudah ditandai selesai. Baca catatan petugas di bawah.' : 'Ada kabar baru untuk laporan Anda. Periksa pembaruan di bawah.');
          setQueueRefresh(value=>value+1);
        }
        if(newest)lastEvent.current=String(newest.id);
        setSummary({total:total.count||0,active:working.count||0,resolved:resolved.count||0});
        setUpdates(events.data||[]);
        setRoads(Object.fromEntries((recent.data||[]).map(report=>[report.id,report])));
        setError('');
      } catch {if(active)setError('Perkembangan laporan belum dapat dimuat. Coba muat ulang.');}
      finally {if(active)setBusy(false);}
    };
    load();
    const timer=setInterval(load,30000);
    window.addEventListener('focus',load);
    return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',load);};
  },[userId,profile?.role,refresh]);
  const latest=updates[0];
  return <div className="citizen-dashboard">
    <div className="citizen-dashboard-hero"><div><span className="eyebrow">RUANG MASYARAKAT</span><h1>Halo, Warga Surabaya.</h1><p>Foto jalan yang rusak, kirim lokasinya, lalu pantau kabar dari petugas di sini.</p>{session?.user?.email?.endsWith('@demo.jalanova.invalid') && <span className="demo-report-badge">Akun contoh untuk mencoba alur laporan</span>}<div className="citizen-dashboard-actions"><a className="button primary" href="#/report"><Camera size={17} />Ambil foto dan laporkan</a><button className="button secondary" type="button" onClick={()=>setRefresh(value=>value+1)}><RefreshCw size={15} />Perbarui</button></div></div></div>
    <div className="citizen-dashboard-stats" aria-label="Ringkasan laporan Anda"><div><span>Total laporan</span><strong>{summary.total}</strong></div><div><span>Menunggu atau ditangani</span><strong>{summary.active}</strong></div><div><span>Selesai</span><strong>{summary.resolved}</strong></div></div>
    {notice && <div className="citizen-live-notice" role="status"><Bell size={17} />{notice}<button onClick={()=>setNotice('')} aria-label="Tutup pemberitahuan">×</button></div>}
    {latest?.status==='resolved' && <div className="citizen-completion"><CheckCircle2 size={20} /><div><strong>Perbaikan sudah ditandai selesai</strong><p>{roads[latest.report_id]?.road_name || 'Laporan Anda'} memiliki foto hasil dan catatan biaya dari petugas. Buka laporannya di bawah untuk melihat bukti.</p></div></div>}
    {error && <p className="form-error" role="alert">{error}</p>}
    <section className="citizen-updates" aria-labelledby="citizen-updates-title"><div className="citizen-updates-heading"><div><span className="eyebrow">KABAR DARI PETUGAS</span><h2 id="citizen-updates-title">Perkembangan terbaru</h2></div><Bell size={20} /></div>{busy ? <p className="citizen-updates-empty">Memuat perkembangan…</p> : updates.length ? <ol>{updates.map(event=><li key={event.id}><span className="citizen-update-dot" /><div><strong>{roads[event.report_id]?.road_name || 'Laporan Anda'}</strong><span className="citizen-update-status">{REPORT_STATUSES[event.status] || event.status}</span><p>{event.note}</p>{event.work_photo_path && <small>Bukti pekerjaan tersedia di detail laporan</small>}<time>{reportDate(event.created_at)}</time></div></li>)}</ol> : <p className="citizen-updates-empty">Belum ada pembaruan. Setelah laporan dikirim, status dan catatan petugas akan muncul di sini.</p>}</section>
    <ReportQueue data={data} refreshKey={queueRefresh} />
    <div className="authority-channel-note"><div><h2>Menemukan jalan rusak?</h2><p>Masuk sebagai warga, unggah foto dan lokasi, lalu pantau perkembangan laporan di dashboard Anda. Petugas Jalanova akan menerima laporan di antrean pemeriksaan.</p></div><div><a className="button primary" href="#/report">Laporkan di Jalanova <ArrowUpRight size={15} /></a><a className="text-link" href="https://wa.me/62811338884" target="_blank" rel="noreferrer">Atau kirim pesan ke Lapor Cak Eri <ArrowUpRight size={15} /></a><small>WhatsApp 0811-338-884. Pesan lewat nomor ini berada di luar riwayat Jalanova.</small><a className="authority-channel-source" href="https://www.surabaya.go.id/id/berita/25108/wali-kota-eri-buka-layanan-hotline-awasi-langsung-aduan-warga-surabaya" target="_blank" rel="noreferrer">Sumber nomor: Pemerintah Kota Surabaya <ArrowUpRight size={12} /></a></div></div>
  </div>;
}
