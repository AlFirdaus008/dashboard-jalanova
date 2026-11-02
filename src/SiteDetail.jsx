import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Check, ChevronRight, Clock3, Crosshair, FileText, Printer, ScanLine, Wallet, X } from 'lucide-react';
import { AuthorityDetails } from './Authority.jsx';
import { ReportDetails, SitePhoto } from './ReportDetails.jsx';
import { TreatmentDetails } from './TreatmentDetails.jsx';
import { LocationShortcut } from './LocationShortcut.jsx';
import { SiteReport } from './SiteReport.jsx';
import { DimensionSummary } from './AnalysisSummaries.jsx';
import { photosForSite } from './lib/reports.mjs';
import { compactMoney, damageNames, formatWindow, number, rupiah, treatments, triageNames } from './lib/data.mjs';
import './detail-records.css';

export function SiteDetail({ site, schedules, reports = [], onClose, standalone = false }) {
  const [tab,setTab] = useState('decision'), [day,setDay] = useState('Weekday');
  const [reportId,setReportId] = useState(null), [treatmentOpen,setTreatmentOpen] = useState(false), [printOpen,setPrintOpen] = useState(false);
  useEffect(() => { setTab('decision'); setReportId(null); setTreatmentOpen(false); setPrintOpen(false); }, [site?.id]);
  const photos = useMemo(() => site ? photosForSite(site,reports) : [], [site,reports]);
  if (!site) return <aside className="site-detail"><div className="detail-placeholder"><Crosshair size={30} /><h3>Pilih satu titik</h3><p>Klik titik pada peta untuk melihat kerusakan dan rencana penanganannya.</p></div></aside>;
  const schedule = schedules.find(s => s.road_id === site.roadId && s.tipe_hari === day);
  const report = reportId && site.reportIds.includes(reportId) ? reports.find(r => r.id === reportId) : null;
  const badge = site.triage.includes('Mendesak') ? 'urgent' : site.triage.includes('Terjadwal') ? 'scheduled' : 'monitor';
  return <><aside className={`site-detail ${standalone ? 'standalone' : ''}`} aria-label={`Detail ${site.id}`}><div className="detail-topline"><span>DETAIL TITIK</span>{onClose && <button className="icon-button" onClick={onClose} aria-label="Tutup detail titik"><X size={17} /></button>}</div><div className="detail-title"><span className={`badge ${badge}`}><i />{triageNames[site.triage]}</span><h2>{site.road}</h2><p>{site.id}</p></div><div className="detail-report-actions"><button className="button secondary" onClick={() => setPrintOpen(true)} aria-haspopup="dialog"><Printer size={15} />Cetak laporan / PDF</button></div><div className="detail-tabs"><button className={tab === 'decision' ? 'active' : ''} onClick={() => setTab('decision')}>Penanganan</button><button className={tab === 'reports' ? 'active' : ''} onClick={() => setTab('reports')}>Aduan <span>{site.reports}</span></button></div>
    {tab === 'reports' ? <div className="detail-body record-detail-body"><h3>{site.reports} aduan terkait</h3><p className="muted small-copy">Pilih aduan untuk melihat foto, lokasi, dan informasi pelapor.</p><div className="report-links">{site.reportIds.map(id => <button key={id} onClick={() => setReportId(id)} aria-haspopup="dialog"><FileText size={17} /><span>{id}<small>{id === site.id ? 'Aduan induk' : 'Aduan terkait'}</small></span>{id === site.id ? <Check size={14} /> : <ChevronRight size={14} />}</button>)}</div></div> : <div className="detail-body record-detail-body"><div className="damage-summary"><span className="damage-icon"><ScanLine size={24} strokeWidth={1.5} /></span><div><strong>{damageNames[site.damage]}</strong><span>{site.severity}</span></div><div className="priority-mini"><strong>{number(site.priority,1)}</strong><span>prioritas / 100</span></div></div>
      <SitePhoto site={site} photos={photos} onOpenReport={setReportId} /><LocationShortcut site={site} reports={reports} compact /><AuthorityDetails jurisdiction={site.jurisdiction} />
      <DimensionSummary site={site} />
      <button className="treatment-box treatment-button" onClick={() => setTreatmentOpen(true)} aria-haspopup="dialog"><span>REKOMENDASI PENANGANAN</span><strong>{treatments[site.treatment]}<ArrowUpRight size={18} /></strong><span className="treatment-volume">Volume kerja {number(site.workVolume,2)} {site.workUnit}</span><span className="treatment-open-label">Alasan & langkah kerja <ChevronRight size={13} /></span></button>
      <div className="detail-section"><div className="section-mini-title">ESTIMASI BIAYA <Wallet size={14} /></div><div className="detail-cost">{rupiah(site.cost.p50)}<span>Perkiraan utama</span></div><div className="range-track"><i /><span /></div><div className="range-labels"><div>Perkiraan rendah<strong>{compactMoney(site.cost.p10)}</strong></div><div>Perkiraan tinggi<strong>{compactMoney(site.cost.p90)}</strong></div></div></div>
      <div className="detail-section"><div className="section-mini-title">REKOMENDASI WAKTU KERJA <Clock3 size={14} /></div><div className="segmented small"><button onClick={() => setDay('Weekday')} className={day === 'Weekday' ? 'active' : ''}>Hari kerja</button><button onClick={() => setDay('Weekend')} className={day === 'Weekend' ? 'active' : ''}>Akhir pekan</button></div><div className="schedule-time">{schedule ? formatWindow(schedule.mulai_optimal,schedule.shift_jam) : 'Belum tersedia'}</div><p className="muted small-copy">{schedule ? 'Perbaikan jalan disarankan dilakukan pada jam tersebut.' : 'Jam perbaikan belum tersedia.'}</p></div>
    </div>}</aside>{report && <ReportDetails report={report} site={site} onClose={() => setReportId(null)} />}{treatmentOpen && <TreatmentDetails site={site} schedule={schedule} reports={reports} onClose={() => setTreatmentOpen(false)} />}{printOpen && <SiteReport site={site} schedules={schedules} reports={reports} day={day} onClose={() => setPrintOpen(false)} />}</>;
}
