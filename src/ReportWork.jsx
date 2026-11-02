import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Camera, FileText } from 'lucide-react';
import { Photo } from './ReportDetails.jsx';
import { rupiah } from './lib/data.mjs';
import { reportDate } from './lib/reports.mjs';
import { NEXT_STATUSES, REPORT_STATUSES, URGENCY } from './lib/citizen-reports.mjs';
import { WORK_BUCKET, checkEvidenceFile, saveWorkUpdate } from './lib/work-evidence.mjs';
import { supabase } from './lib/supabase.mjs';

export function ReportWorkForm({report,data,onSaved}) {
  const [status,setStatus]=useState(NEXT_STATUSES[report.status][0]);
  const [urgency,setUrgency]=useState(report.urgency);
  const [roadId,setRoadId]=useState(report.verified_road_id || '');
  const [agency,setAgency]=useState(report.assigned_agency || '');
  const [note,setNote]=useState('');
  const [workedAt,setWorkedAt]=useState('');
  const [spentIdr,setSpentIdr]=useState('');
  const [workPhoto,setWorkPhoto]=useState(null);
  const [expenseDocument,setExpenseDocument]=useState(null);
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const road=data.roads.find(item=>item.id===roadId);
  const workStarted=status==='in_progress' || status==='resolved';
  const completed=status==='resolved';

  const submit=async event=>{
    event.preventDefault();setError('');
    const fileError=checkEvidenceFile(workPhoto) || checkEvidenceFile(expenseDocument,true);
    if(fileError){setError(fileError);return;}
    if(completed && (!workPhoto || !expenseDocument || spentIdr==='')){
      setError('Untuk menandai selesai, isi biaya dan unggah foto hasil serta dokumen pengeluaran.');return;
    }
    setBusy(true);
    try {
      const updated=await saveWorkUpdate(supabase,{report,status,urgency,roadId,agency,note,
        workedAt:workStarted ? workedAt : '',spentIdr:workStarted ? spentIdr : '',
        workPhoto:workStarted ? workPhoto : null,expenseDocument:workStarted ? expenseDocument : null});
      onSaved(updated);
    } catch(problem) {
      setError(/petugas lain/i.test(problem.message || '')
        ? 'Laporan sudah diperbarui petugas lain. Tutup detail lalu muat ulang antrean.'
        : /record_report_work|schema cache|function.*does not exist/i.test(problem.message || '')
          ? 'Pencatatan pekerjaan belum aktif di database. Terapkan migrasi 003 terlebih dahulu.'
          : problem.message || 'Perubahan belum tersimpan. Periksa isian dan coba lagi.');
    } finally {setBusy(false);}
  };

  return <form className="report-review-form" onSubmit={submit}>
    <h3>Catat tindak lanjut</h3><p>Setiap perubahan status dan catatan akan terlihat oleh pelapor. Untuk menandai selesai, lampirkan hasil kerja dan dokumen biaya.</p>
    <fieldset disabled={busy}>
      <div className="report-input-grid">
        <label>Status berikutnya<select value={status} onChange={event=>setStatus(event.target.value)}>{NEXT_STATUSES[report.status].map(key=><option key={key} value={key}>{REPORT_STATUSES[key]}</option>)}</select></label>
        <label>Prioritas petugas<select value={urgency} onChange={event=>setUrgency(event.target.value)}>{Object.entries(URGENCY).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
        <label>Ruas yang sudah diperiksa<select value={roadId} onChange={event=>{setRoadId(event.target.value);const match=data.roads.find(item=>item.id===event.target.value);if(match)setAgency(match.jurisdiction.owner);}}><option value="">Belum dicocokkan / di luar daftar</option>{data.roads.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>Instansi koordinasi<input maxLength={160} value={agency} onChange={event=>setAgency(event.target.value)} /></label>
      </div>
      {road && <p className="report-review-jurisdiction">Rujukan pengelola ruas: {road.jurisdiction.owner}. Pastikan titik laporan berada di ruas tersebut.</p>}
      {workStarted && <div className="work-evidence-fields"><h4>Catatan pekerjaan</h4><p>Isi waktu kerja dan total biaya yang sudah digunakan sampai pembaruan ini. Angka ini berasal dari catatan petugas, bukan perkiraan notebook.</p>
        <div className="report-input-grid"><label>Tanggal dan jam pekerjaan<input type="datetime-local" required value={workedAt} onChange={event=>setWorkedAt(event.target.value)} /></label><label>Total biaya digunakan (Rp)<input type="number" inputMode="numeric" min="0" max="999999999999" step="1" required={completed} value={spentIdr} onChange={event=>setSpentIdr(event.target.value)} placeholder="Contoh: 2500000" /></label></div>
        <div className="report-input-grid"><label>Foto hasil pekerjaan<input type="file" accept="image/jpeg,image/png,image/webp" required={completed} onChange={event=>setWorkPhoto(event.target.files?.[0] || null)} /><small>Foto lokasi setelah atau selama penanganan. Maksimal 10 MB.</small></label><label>Dokumen biaya<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required={completed} onChange={event=>setExpenseDocument(event.target.files?.[0] || null)} /><small>Kuitansi, nota, atau dokumen pengeluaran. JPG, PNG, WebP, atau PDF; maksimal 10 MB.</small></label></div>
      </div>}
      <label>Catatan untuk pelapor<textarea required minLength={5} maxLength={1500} rows={4} value={note} onChange={event=>setNote(event.target.value)} placeholder="Tuliskan tindakan yang sudah dilakukan atau langkah berikutnya." /></label>
      <button className="button primary" type="submit">{busy ? 'Menyimpan…' : 'Simpan perkembangan'}</button>
    </fieldset>
    {error && <p className="form-error" role="alert">{error}</p>}
  </form>;
}

export function WorkEventDetails({event}) {
  const [urls,setUrls]=useState({}),[error,setError]=useState(false);
  useEffect(()=>{
    let active=true;
    const paths=[event.work_photo_path,event.expense_document_path].filter(Boolean);
    if(!paths.length)return;
    Promise.all(paths.map(path=>supabase.storage.from(WORK_BUCKET).createSignedUrl(path,900)))
      .then(results=>{if(active){setUrls(Object.fromEntries(paths.map((path,i)=>[path,results[i].data?.signedUrl])));setError(results.some(result=>result.error));}})
      .catch(()=>active && setError(true));
    return()=>{active=false;};
  },[event.id,event.work_photo_path,event.expense_document_path]);
  if(!event.work_at && event.spent_idr==null && !event.work_photo_path && !event.expense_document_path)return null;
  const photoUrl=urls[event.work_photo_path],documentUrl=urls[event.expense_document_path];
  return <div className="work-event-details"><dl>{event.work_at && <div><dt>Pekerjaan dilakukan</dt><dd>{reportDate(event.work_at)}</dd></div>}{event.spent_idr!=null && <div><dt>Biaya tercatat</dt><dd>{rupiah(Number(event.spent_idr))}</dd></div>}</dl>
    {photoUrl && <div className="work-event-photo"><span><Camera size={15} />Foto hasil pekerjaan</span><a href={photoUrl} target="_blank" rel="noreferrer"><Photo photo={{src:photoUrl}} alt="Bukti pekerjaan dari petugas" /><span>Buka foto penuh <ArrowUpRight size={13} /></span></a></div>}
    {documentUrl && <a className="work-document-link" href={documentUrl} target="_blank" rel="noreferrer"><FileText size={16} />Lihat dokumen pengeluaran <ArrowUpRight size={13} /></a>}
    {error && <p className="form-error">Bukti belum dapat dibuka. Tutup dan buka kembali laporan untuk memuat tautan baru.</p>}
    {(photoUrl || documentUrl) && <small>Berkas diunggah petugas. Kebenaran isi dokumen perlu diperiksa oleh instansi terkait.</small>}
  </div>;
}
