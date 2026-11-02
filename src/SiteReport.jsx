import React, { useEffect, useRef, useState } from 'react';
import { Printer } from 'lucide-react';
import { DetailDialog } from './DetailDialog.jsx';
import { Photo } from './ReportDetails.jsx';
import { AuthorityDetails } from './Authority.jsx';
import { siteReportRecords } from './lib/site-report.mjs';
import { coordinateText, reportDate } from './lib/reports.mjs';
import { siteDestination } from './lib/location.mjs';
import { policySummary } from './lib/policy.mjs';
import { explainTreatment } from './lib/treatment.mjs';
import { damageNames, formatWindow, number, rupiah, treatments, triageNames } from './lib/data.mjs';
import './site-report.css';

function Fields({ values }) {
  return <dl className="site-report-fields">{values.map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value ?? 'Belum tersedia'}</dd></div>)}</dl>;
}

function ReportEntry({ report, index }) {
  const location = report.location || {}, reporter = report.reporter || {};
  return <section className="site-report-complaint">
    <header><span>Aduan {index + 1} ({report.duplicate ? 'terkait' : 'induk'})</span><h3>{report.id}</h3></header>
    <Fields values={[
      ['Tanggal masuk',reportDate(report.submittedAt)],['Sumber aduan',report.channel],
      ['Pelapor',reporter.name],['Kontak pelapor',reporter.contact],
      ['Alamat rinci',location.address],['Kecamatan',location.district],['Kelurahan',location.subdistrict],
      ['Patokan lokasi',location.landmark],['Koordinat laporan asli',coordinateText(location.coordinates)],
    ]} />
    <div className="site-report-description"><h4>Isi aduan</h4><p>{report.description || 'Belum tersedia'}</p></div>
    <div className="site-report-photos"><h4>Foto kerusakan</h4>{report.photos?.length ? report.photos.map((photo,index) => <figure key={`${photo.src}-${index}`}><Photo photo={photo} alt={`Foto ${index + 1} aduan ${report.id}`} eager /><figcaption>{photo.caption || `Foto ${index + 1}`}{photo.capturedAt && `, diambil ${reportDate(photo.capturedAt)}`}</figcaption></figure>) : <p>Belum tersedia</p>}</div>
  </section>;
}

export function SiteReportContent({ site, schedules = [], reports = [], day = 'Weekday', createdAt }) {
  const records = siteReportRecords(site,reports,schedules);
  const selected = records.schedules.find(schedule => schedule.tipe_hari === day);
  const summary = policySummary(site,selected), plan = explainTreatment(site);
  const destination = siteDestination(site,reports);
  return <article className="site-report">
    <header className="site-report-heading"><div><span className="site-report-kicker">LAPORAN TITIK KERUSAKAN JALAN</span><h1>{site.road}</h1><p>{site.id}, Surabaya, Jawa Timur, Indonesia</p><p>Disiapkan {reportDate(createdAt)}</p></div><span className="brand brand-logo-only"><img src="/favicon.svg" width="1080" height="1080" alt="Jalanova AI" /></span></header>
    <section className="site-report-section"><h2>Lokasi dan hasil analisis</h2><Fields values={[
      ['Nama jalan',site.road],['Koordinat tujuan',coordinateText(destination.coordinates)],
      ['Sumber lokasi',destination.source === 'report' ? `Koordinat asli aduan ${destination.reportId}` : destination.source === 'project' ? 'Titik simulasi proyek' : null],
      ['Alamat tujuan',destination.address],['Jenis kerusakan',damageNames[site.damage]],['Tingkat kerusakan',site.severity],
      ['Prioritas',`${number(site.priority,1)}/100 (${triageNames[site.triage]})`],['Aduan terkait',records.reports.length],
      ['Panjang estimasi',`${number(site.length,2)} m`],['Lebar estimasi',`${number(site.width,2)} m`],['Luas estimasi',`${number(site.area,2)} m²`],
      ['Sumber dimensi',site.dimensionSource === 'deteksi' ? 'Estimasi dari deteksi' : 'Imputasi'],
    ]} />{destination.url && <p className="site-report-route">Tujuan di Google Maps: <a href={destination.url} target="_blank" rel="noreferrer">{destination.url}</a></p>}</section>
    <section className="site-report-section"><h2>Kewenangan dan koordinasi</h2><Fields values={[
      ['Unit koordinator',summary.coordinator],['Penanggung jawab',summary.owner],
    ]} /><AuthorityDetails jurisdiction={site.jurisdiction} full /></section>
    <section className="site-report-section"><h2>Rekomendasi penanganan</h2><p className="site-report-action">{summary.action}</p><Fields values={[
      ['Metode',treatments[site.treatment]],['Lingkup kerja',`${number(site.workVolume,2)} ${site.workUnit}`],
      ['Perkiraan biaya utama',rupiah(site.cost.p50)],['Kisaran perkiraan biaya',`${rupiah(site.cost.p10)} – ${rupiah(site.cost.p90)}`],
    ]} /><h3>Langkah tindak lanjut</h3><ol className="site-report-steps">{summary.steps.map(step => <li key={step.title}><h4>{step.title}</h4><p>{step.text}</p></li>)}</ol>
      <h3>Waktu kerja yang disarankan</h3>{records.schedules.length ? <Fields values={records.schedules.map(schedule => [schedule.tipe_hari === 'Weekend' ? 'Akhir pekan' : 'Hari kerja',`${formatWindow(schedule.mulai_optimal,schedule.shift_jam)} WIB`])} /> : <p>Belum tersedia</p>}<p className="site-report-note">Jam tersebut merupakan rekomendasi untuk ruas jalan. Waktu pelaksanaan titik ini ditetapkan oleh pengelola ruas.</p>
      {plan && <><h3>Alasan pemilihan metode</h3><p>{plan.reason}</p><h3>Urutan pekerjaan</h3><ol className="site-report-steps">{plan.steps.map(([title,text]) => <li key={title}><h4>{title}</h4><p>{text}</p></li>)}</ol><h3>Asumsi biaya</h3><p>{plan.assumption}</p><h3>Rujukan pekerjaan</h3><ul className="site-report-sources">{plan.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul></>}
    </section>
    <section className="site-report-complaints"><h2>Aduan terkait ({records.reports.length})</h2>{records.reports.map((report,index) => <ReportEntry key={report.id} report={report} index={index} />)}</section>
    <footer className="site-report-footer">Laporan disusun dari hasil analisis notebook Jalanova. Koordinat simulasi dibedakan dari lokasi asli aduan. Estimasi ukuran, biaya, dan waktu menjadi bahan perencanaan dan perlu dicocokkan dengan hasil pemeriksaan lapangan.</footer>
  </article>;
}

export function SiteReport({ site, schedules, reports, day, onClose }) {
  const content = useRef(null), [preparing,setPreparing] = useState(false), [error,setError] = useState('');
  const [createdAt] = useState(() => new Date().toISOString());
  useEffect(() => {
    const title = document.title;
    document.title = `Laporan Jalanova - ${site.road} - ${site.id}`;
    document.body.classList.add('printing-site-report');
    return () => { document.body.classList.remove('printing-site-report'); document.title = title; };
  }, [site.id,site.road]);
  const print = async () => {
    setPreparing(true); setError('');
    try {
      const images = [...content.current.querySelectorAll('img')];
      await Promise.race([
        Promise.allSettled([document.fonts?.ready,...images.map(img => img.decode?.())]),
        new Promise(resolve => setTimeout(resolve,5000)),
      ]);
      if (!content.current?.isConnected) return;
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      if (content.current?.isConnected) window.print();
    } catch { setError('Dialog cetak belum dapat dibuka. Silakan coba lagi.'); }
    finally { setPreparing(false); }
  };
  return <DetailDialog title="Laporan titik" subtitle={site.id} className="site-report-backdrop" onClose={onClose}><div className="site-report-toolbar"><p>Penanganan dan seluruh aduan terkait digabung dalam laporan ini. Pilih <strong>Simpan sebagai PDF</strong> pada tujuan cetak untuk menyimpan berkasnya.</p><button className="button primary" disabled={preparing} onClick={print}><Printer size={16} />{preparing ? 'Menyiapkan laporan…' : 'Cetak / Simpan PDF'}</button>{error && <p role="alert">{error}</p>}</div><div ref={content}><SiteReportContent site={site} schedules={schedules} reports={reports} day={day} createdAt={createdAt} /></div></DetailDialog>;
}
