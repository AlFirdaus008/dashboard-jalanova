import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Camera, MapPin } from 'lucide-react';
import { DetailDialog } from './DetailDialog.jsx';
import { AuthorityBadge } from './Authority.jsx';
import { coordinateText, osmLocation, reportDate } from './lib/reports.mjs';
import { damageNames, number, treatments } from './lib/data.mjs';

export function Photo({ photo, alt, eager = false }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [photo?.src]);
  return photo && !failed ? <img src={photo.src} alt={photo.caption || alt} loading={eager ? 'eager' : 'lazy'} onError={() => setFailed(true)} /> : <div className="location-photo-empty"><Camera size={25} strokeWidth={1.4} /><span>{failed ? 'Foto belum dapat dimuat' : 'Foto lokasi belum tersedia'}</span></div>;
}

export function SitePhoto({ site, photos, onOpenReport }) {
  const photo = photos[0];
  return <section className="site-photo"><div className="section-mini-title">FOTO KERUSAKAN{photos.length > 0 && <span>{photos.length} foto</span>}</div>{photo ? <button className="site-photo-button" onClick={() => onOpenReport(photo.reportId)} aria-label={`Lihat foto dan aduan ${photo.reportId}`}><Photo photo={photo} alt={`Kerusakan di ${site.road}`} /><span>Lihat foto & aduan <ArrowUpRight size={13} /></span></button> : <Photo />}{photo && <p>Dari aduan {photo.reportId}</p>}</section>;
}

function Field({ label, value }) { return <div><dt>{label}</dt><dd className={!value ? 'record-missing' : ''}>{value || 'Belum tersedia'}</dd></div>; }
export function ReportBody({ report, site }) {
  const [photoIndex, setPhotoIndex] = useState(0);
  useEffect(() => setPhotoIndex(0), [report.id]);
  const photos = report.photos || [], photo = photos[photoIndex] || photos[0];
  const location = report.location || {}, reporter = report.reporter || {};
  const originalMap = osmLocation(location.coordinates);
  return <div className="report-record">
    <div className="report-record-heading"><div><span>{report.duplicate ? 'Aduan terkait' : 'Aduan induk'}</span><h3>{site.road}</h3></div><AuthorityBadge jurisdiction={site.jurisdiction} /></div>
    <div className="report-record-grid"><section className="report-media"><h3>Foto kerusakan</h3><div className="report-main-photo"><Photo photo={photo} alt={`Foto aduan ${report.id}`} /></div>{photos.length > 1 && <div className="report-photo-choices" aria-label="Pilih foto aduan">{photos.map((p,i) => <button key={`${p.src}-${i}`} aria-pressed={i === photoIndex} onClick={() => setPhotoIndex(i)} aria-label={`Foto ${i + 1}`}><Photo photo={p} alt={`Foto ${i + 1}`} /></button>)}</div>}{photo && <div className="report-photo-caption"><p>{photo.caption || 'Foto dari lampiran aduan.'}</p>{photo.capturedAt && <small>{reportDate(photo.capturedAt)}</small>}<a href={photo.src} target="_blank" rel="noreferrer">Buka foto penuh <ArrowUpRight size={13} /></a></div>}</section>
      <section><h3>Informasi aduan</h3><dl className="record-fields"><Field label="Nomor aduan" value={report.id} /><Field label="Tanggal masuk" value={reportDate(report.submittedAt)} /><Field label="Sumber aduan" value={report.channel} /><Field label="Pelapor" value={reporter.name} /><Field label="Kontak pelapor" value={reporter.contact} /><Field label="Terhubung ke titik" value={report.siteId} /></dl><div className="report-description"><h4>Isi aduan</h4><p>{report.description || 'Isi aduan belum tersedia.'}</p></div></section></div>
    <section className="report-location"><h3><MapPin size={17} />Lokasi laporan</h3><dl className="record-fields location-fields"><Field label="Nama jalan" value={site.road} /><Field label="Alamat rinci" value={location.address} /><Field label="Kecamatan" value={location.district} /><Field label="Kelurahan" value={location.subdistrict} /><Field label="Patokan lokasi" value={location.landmark} /><Field label="Koordinat laporan" value={coordinateText(location.coordinates)} /></dl>{originalMap && <a className="text-link" href={originalMap} target="_blank" rel="noreferrer">Lihat lokasi laporan <ArrowUpRight size={14} /></a>}<details className="project-coordinate-note"><summary>Koordinat yang ditampilkan di peta proyek</summary><p>{coordinateText(site.coordinates)}</p><small>Posisi simulasi pada peta proyek. Koordinat asli laporan ditampilkan pada kolom di atas jika tersedia.</small></details></section>
    <section className="report-analysis"><h3>Analisis titik terkait</h3><dl className="record-fields analysis-fields"><Field label="Jenis kerusakan" value={damageNames[site.damage]} /><Field label="Tingkat kerusakan" value={site.severity} /><Field label="Prioritas" value={`${number(site.priority,1)}/100`} /><Field label="Rekomendasi" value={treatments[site.treatment]} /></dl></section>
  </div>;
}
export function ReportDetails({ report, site, onClose }) {
  return <DetailDialog title="Detail aduan" subtitle={report.id} onClose={onClose}><ReportBody report={report} site={site} /></DetailDialog>;
}
