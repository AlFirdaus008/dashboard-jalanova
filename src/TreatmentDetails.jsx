import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { DetailDialog } from './DetailDialog.jsx';
import { explainTreatment } from './lib/treatment.mjs';
import { policySummary } from './lib/policy.mjs';
import { LocationShortcut } from './LocationShortcut.jsx';
import { damageNames, formatWindow, number, rupiah, treatments, triageNames } from './lib/data.mjs';

export function TreatmentBody({ site, schedule, reports = [] }) {
  const plan = explainTreatment(site);
  if (!plan) return <p>Rincian metode penanganan belum tersedia.</p>;
  const summary = policySummary(site,schedule);
  return <div className="treatment-record"><div className="treatment-record-heading"><span>{site.road}, prioritas {number(site.priority,1)}/100</span><h3>{summary.action}</h3><p>{summary.issue} Usulan penanganan: {summary.method.toLowerCase()}.</p></div>
    <section className="policy-overview"><h3>Ringkasan tindak lanjut</h3><dl className="policy-facts"><div className="policy-owner"><dt>Koordinasikan dengan</dt><dd>{summary.coordinator}<small>{summary.owner}</small></dd></div><div><dt>Usulan perbaikan</dt><dd>{summary.method}</dd></div><div><dt>Perkiraan biaya utama</dt><dd>{rupiah(site.cost.p50)}</dd></div><div><dt>Waktu yang disarankan</dt><dd>{summary.time}</dd></div></dl></section>
    <LocationShortcut site={site} reports={reports} />
    <section className="policy-next-steps"><h3>Langkah yang perlu dilakukan</h3><ol>{summary.steps.map((step,index) => <li key={step.title}><span>{index + 1}</span><div><h4>{step.title}</h4><p>{step.text}</p></div></li>)}</ol></section>
    <details className="technical-plan"><summary>Lihat alasan pemilihan metode dan rencana teknis</summary><div className="technical-plan-content">
    <section className="treatment-reason"><h3>Dasar pemilihan metode</h3><p>{plan.reason}</p><div className="rule-trace"><span>{damageNames[site.damage]}</span><b>+</b><span>{site.severity}</span><b>→</b><strong>{treatments[site.treatment]}</strong></div><small>Penjelasan ini mengikuti aturan penanganan pada notebook proyek. Tingkat kerusakan merupakan hasil prediksi model.</small></section>
    <dl className="treatment-facts"><div><dt>Prioritas</dt><dd>{number(site.priority,1)}/100<small>{triageNames[site.triage]}</small></dd></div><div><dt>Aduan terkait</dt><dd>{site.reports}<small>laporan</small></dd></div><div><dt>Perkiraan luas kerusakan</dt><dd>{number(site.area,2)} m²</dd></div><div><dt>Lingkup kerja</dt><dd>{number(site.workVolume,2)} {site.workUnit}</dd></div></dl>
    <section className="treatment-workflow"><h3>Urutan kerja yang disarankan</h3><ol>{plan.steps.map(([title,copy],i) => <li key={title}><span>{String(i + 1).padStart(2,'0')}</span><div><h4>{title}</h4><p>{copy}</p></div></li>)}</ol><p className="work-plan-note">Petugas menyesuaikan metode dan ukuran pekerjaan setelah memeriksa lokasi.</p></section>
    <section className="treatment-planning"><h3>Biaya dan waktu perbaikan</h3><dl className="record-fields"><div><dt>Perkiraan biaya utama</dt><dd>{rupiah(site.cost.p50)}</dd></div><div><dt>Kisaran perkiraan biaya</dt><dd>{rupiah(site.cost.p10)} – {rupiah(site.cost.p90)}</dd></div><div><dt>Waktu yang disarankan</dt><dd>{schedule ? formatWindow(schedule.mulai_optimal,schedule.shift_jam) + ' WIB' : 'Belum tersedia'}</dd></div><div><dt>Koordinasi penanganan</dt><dd>{site.jurisdiction?.owner || 'Belum tersedia'}</dd></div></dl><details className="treatment-assumption"><summary>Asumsi perhitungan biaya</summary><p>{plan.assumption}</p></details></section>
    <section className="treatment-sources"><h3>Rujukan langkah kerja</h3><p>Urutan kerja diringkas dari pedoman berikut. Pemilihan metode mengikuti aturan proyek.</p>{plan.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title}<ArrowUpRight size={14} /></a>)}</section></div></details>
  </div>;
}
export function TreatmentDetails({ site, schedule, reports = [], onClose }) { return <DetailDialog title="Alasan dan langkah penanganan" subtitle={site.id} onClose={onClose}><TreatmentBody site={site} schedule={schedule} reports={reports} /></DetailDialog>; }
