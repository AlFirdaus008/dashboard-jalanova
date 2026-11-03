import React, { useId, useRef, useState } from 'react';
import { ArrowUpRight, Camera, Download, FileText, Info, MapPinned, Route, ScanLine, Wallet } from 'lucide-react';
import { ProjectFocus } from './ProjectFocus.jsx';
import { AnalysisPipeline } from './NotebookOutputs.jsx';
import { DATA_SOURCES, NOTEBOOK_REFERENCES } from './content/method.mjs';
import { DEVELOPMENT_REFERENCES } from './content/project.mjs';
import { authorityRegistry } from './lib/authority.mjs';
import './method.css';

const dataIcons = {rdd:Camera,bpid:ScanLine,reports:FileText,traffic:Route,cost:Wallet,roads:MapPinned};
const tabs = [['data','Pengumpulan data'],['pipeline','Alur analisis'],['development','Fokus pengembangan'],['references','Referensi']];
const authorityDescriptions = {
  'rtrw-2025':'Rencana jaringan jalan, pelaksana, dan pendanaan. Dibaca bersama dokumen penetapan status setiap ruas.',
  'national-status-2022':'Rujukan penetapan ruas nasional Tanjung Perak dan Kenjeran. Nama Perak Timur diperiksa melalui RKPD 2024.',
  'ahmad-yani-2024':'Berita resmi tentang JPO yang melintasi jalan nasional di koridor Ahmad Yani.',
  'dishub-2023':'Dokumen pendukung status jalan provinsi pada lokasi Mastrip di Karangpilang, Surabaya.',
  'rkpd-2024':'Tabel II.182, baris 39, mencatat kewenangan nasional untuk Jl. Perak Timur.',
};

export function DataCollection() {
  return <div className="method-content"><div className="method-intro"><span className="eyebrow">DATA YANG DIGUNAKAN</span><h2>Foto jalan dan data pendukung</h2><p>Kami memakai foto jalan dari Kaggle dan Mendeley, empat tabel data dari arsip proyek, serta jaringan jalan OpenStreetMap. Bahan uji ini membantu kami menunjukkan alur Jalanova, dari laporan masuk hingga usulan perbaikan.</p></div><div className="dataset-table panel"><table><caption className="visually-hidden">Sumber data, cakupan, dan perannya dalam analisis Jalanova</caption><colgroup><col style={{width:'28%'}} /><col style={{width:'31%'}} /><col style={{width:'41%'}} /></colgroup><thead><tr><th scope="col">Data</th><th scope="col">Cakupan</th><th scope="col">Peran dalam analisis</th></tr></thead><tbody>{DATA_SOURCES.map(source => { const Icon = dataIcons[source.id]; return <tr key={source.id}><th scope="row"><span><Icon size={18} /><strong>{source.name}</strong></span></th><td>{source.scope}</td><td>{source.role}</td></tr>; })}</tbody></table></div><div className="method-two-columns"><section><h3>Pemeriksaan data</h3><p>Sebelum diolah, kami memeriksa ID laporan, bagian yang kosong, laporan berulang, cakupan ruas, lalu lintas per jam, harga satuan pekerjaan, dan riwayat pekerjaan.</p><p>Foto lalu dibagi berurutan untuk melatih, memvalidasi, dan menguji model. Sebagian foto latih juga diberi perubahan kualitas.</p></section><details className="method-limit method-data-details"><summary><Info size={19} />Tentang data simulasi</summary><p>Empat berkas data (CSV) dari arsip proyek dipakai untuk menguji cara kerja Jalanova. Arsipnya belum mencatat asal pengumpulan dan tahun data. Karena itu, hasil analisis ini disajikan sebagai simulasi proyek, bukan catatan resmi Pemkot Surabaya.</p><p>Lokasi titik disusun pada jaringan jalan Surabaya untuk memperlihatkan cara sistem menyusun prioritas. Contoh foto berasal dari dataset dengan jenis kerusakan yang sesuai. Pada 383 dari 659 titik, ukuran kerusakan masih berupa perkiraan.</p></details></div><a className="button secondary" href="/data/rekap_keputusan_jalanova.csv" download><Download size={16} />Unduh rekap hasil</a></div>;
}

function ReferenceGroup({ number, title, description, items, label }) {
  return <section className="method-reference-group"><header><span className="eyebrow">{number} / {label}</span><h3>{title}</h3><p>{description}</p></header><div className="method-reference-list">{items.map(item => <a key={item.url} href={item.url} target="_blank" rel="noreferrer"><div><span>{item.publisher || item.label}</span><h4>{item.title}</h4><p>{item.desc || item.description}</p></div><ArrowUpRight size={17} /></a>)}</div></section>;
}

export function ProjectReferences({ data }) {
  const authoritySources = authorityRegistry.sources.filter(source => source.id !== 'channels').map(source => ({...source,desc:authorityDescriptions[source.id] || source.description}));
  return <div className="method-content"><div className="method-intro"><span className="eyebrow">RUJUKAN PROYEK</span><h2>Sumber data dan metode</h2><p>Rujukan dikelompokkan menurut pemakaiannya: bahan notebook, informasi kewenangan jalan, dan rencana pengembangan.</p></div>
    <ReferenceGroup number="01" label="DIPAKAI DI NOTEBOOK" title="Dataset dan peta" description="Sumber foto dan jaringan jalan yang digunakan dalam eksperimen." items={NOTEBOOK_REFERENCES.filter(item => item.group === 'data')} />
    <ReferenceGroup number="02" label="DIPAKAI DI NOTEBOOK" title="Model deteksi dan pengolahan teks" description="Dokumentasi model untuk membaca foto dan membandingkan isi laporan." items={NOTEBOOK_REFERENCES.filter(item => item.group === 'models')} />
    <ReferenceGroup number="03" label="TAMBAHAN PADA DASHBOARD" title="Status dan kewenangan jalan" description="Dokumen untuk menelusuri status ruas. Batas segmen dan catatan setiap jalan tersedia pada halaman Kewenangan jalan." items={authoritySources} />
    <a className="button secondary method-authority-link" href="#/authority">Lihat status dan sumber per ruas<ArrowUpRight size={15} /></a>
    <ReferenceGroup number="04" label="BAHAN PENGEMBANGAN" title="Layanan pengaduan dan pengukuran kedalaman" description="Bahan untuk tahap berikutnya. Integrasi layanan dan pengukuran kedalaman belum tersedia pada prototipe ini." items={DEVELOPMENT_REFERENCES} />
    <aside className="method-reference-note"><h3>Informasi yang masih perlu dilengkapi</h3><p>CSV proyek diunduh dari arsip Google Drive di dalam notebook. Sumber pengumpulan, tahun data, dan dasar harga AHSP perlu dilengkapi sebelum dipakai sebagai rujukan resmi.</p></aside>
    <div className="version-note"><span>Versi alat yang dipakai dalam eksperimen</span><p className="version-items"><span>Seed {data.metadata.seed}</span><span>Python {data.metadata.versi.python}</span><span>Ultralytics {data.metadata.versi.ultralytics}</span><span>scikit-learn {data.metadata.versi.sklearn}</span></p></div>
  </div>;
}

export function Method({ data }) {
  const [tab,setTab] = useState('data'), id = useId(), buttons = useRef([]);
  const move = (event,index) => {
    const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : null;
    if (next === null) return;
    event.preventDefault(); setTab(tabs[next][0]); buttons.current[next]?.focus();
  };
  return <div className="method-page"><div className="page-heading"><div><span className="eyebrow">DATA & METODE</span><h1>Data dan cara kerja Jalanova</h1><p>Lihat data yang kami pakai, hasil dari tiap tahap analisis, dan rencana pengembangan Jalanova.</p></div></div><div className="method-tabs" role="tablist" aria-label="Bagian metodologi">{tabs.map(([key,label],index) => <button key={key} id={`${id}-${key}-tab`} ref={node => {buttons.current[index] = node;}} role="tab" aria-selected={tab === key} aria-controls={`${id}-panel`} tabIndex={tab === key ? 0 : -1} className={tab === key ? 'active' : ''} onClick={() => setTab(key)} onKeyDown={event => move(event,index)}>{label}</button>)}</div><div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-${tab}-tab`} tabIndex={0} className="method-tab-panel">
    {tab === 'data' && <DataCollection />}
    {tab === 'pipeline' && <AnalysisPipeline />}
    {tab === 'development' && <div className="method-content"><div className="method-intro development-intro"><span className="eyebrow">FOKUS PENGEMBANGAN</span><h2>Yang sudah ada dan yang akan dikembangkan</h2><p>Tiga kebutuhan utama proyek: mengetahui pengelola jalan, membaca foto dengan lebih baik, dan memperkirakan ukuran kerusakan. Cuplikan berikut menampilkan fitur dashboard yang sudah tersedia.</p></div><ProjectFocus detailed data={data} /></div>}
    {tab === 'references' && <ProjectReferences data={data} />}
  </div></div>;
}
