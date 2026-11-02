import React from 'react';
import { ArrowUpRight, Download, Info, ChevronDown } from 'lucide-react';
import { authorityRegistry, authorityLabel, authorityNames, authoritySource, evidenceNames, groupAuthorities } from './lib/authority.mjs';
import { compactMoney, number } from './lib/data.mjs';
import './authority.css';

export function AuthorityBadge({ jurisdiction }) {
  return <span className={`authority-badge authority-${jurisdiction?.authority || ''}`}>{authorityLabel(jurisdiction)}</span>;
}

export function AuthorityDetails({ jurisdiction, full = false }) {
  if (!jurisdiction) return null;
  const j = jurisdiction;
  const detail = <section className={`authority-detail ${full ? 'expanded' : ''}`} aria-label="Kewenangan ruas dan sumber">
    {full && <div className="authority-detail-heading"><span>KEWENANGAN RUAS</span><AuthorityBadge jurisdiction={j} /></div>}
    <strong className="authority-owner">{j.owner}</strong>
    <p>{j.scope}</p><p>{j.note}</p>
    <div className="authority-evidence">{evidenceNames[j.evidence]}<span>Lokasi titik belum diverifikasi</span></div>
    <ul className="authority-citations">{j.sources.map((ref, i) => {
      const source = authoritySource(ref.sourceId);
      return source && <li key={`${ref.sourceId}-${i}`}><a href={ref.url || source.url} target="_blank" rel="noreferrer">{source.publisher}<ArrowUpRight size={12} /></a><span>{ref.locator}</span></li>;
    })}</ul>
    {!full && <a className="authority-more" href="#/authority">Daftar ruas & dasar kewenangan <ArrowUpRight size={13} /></a>}
  </section>;
  return full ? detail : <details className="authority-detail-disclosure"><summary><span className="section-mini-title">KEWENANGAN RUAS</span><AuthorityBadge jurisdiction={j} /><ChevronDown size={13} /></summary>{detail}</details>;
}

export function AuthorityReferences() {
  return <details className="authority-references" id="authority-references"><summary><span><span className="eyebrow">SUMBER STATUS JALAN</span><strong>Lihat dokumen rujukan</strong><small>Peraturan, dokumen pemerintah, dan keterangan resmi yang dipakai untuk memeriksa status ruas.</small></span><ChevronDown size={19} /></summary>
    <div className="authority-source-list"><p className="authority-sources-intro">Buka sumber di bawah untuk memeriksa dasar penetapan jalan Nasional, Provinsi, atau Kota. Rujukan ini mencakup 15 ruas proyek, bukan semua jalan di Surabaya. Diperiksa 1 November 2026.</p>{authorityRegistry.sources.filter(source => source.kind !== 'Kanal layanan').map(source => <article key={source.id}><span>{source.kind}{source.date && `, ${source.date}`}</span><a href={source.url} target="_blank" rel="noreferrer"><h3>{source.title}</h3><ArrowUpRight size={17} /></a><p>{source.description}</p><small>{source.publisher}</small></article>)}</div>
  </details>;
}

function RegistryDownload() {
  const download = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(authorityRegistry, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = 'jalanova-rujukan-kewenangan-2026-11-01.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <button className="button secondary" onClick={download}><Download size={15} />Unduh rujukan ruas</button>;
}

export function AuthorityPage({ data, sites, controls, download, onInspect }) {
  const groups = groupAuthorities(sites);
  const rows = data.roads.map(road => ({ ...road, sites: sites.filter(s => s.roadId === road.id) })).filter(r => r.sites.length);
  return <div className="authority-page">
    <div className="page-heading"><div><div className="eyebrow">STATUS & PENANGGUNG JAWAB</div><h1>Siapa yang menangani ruas ini?</h1><p>Status dan penanggung jawab 15 ruas dalam proyek. Pilih status jalan atau buka ruas untuk membaca sumbernya.</p></div>{download}</div>
    <div className="authority-intro"><Info size={19} /><div><h2>Tiga status jalan, tiga lingkup kewenangan.</h2><p>Jalan nasional ditangani pemerintah pusat, jalan provinsi oleh Pemprov Jawa Timur, dan jalan kota oleh Pemkot Surabaya. Sumber penetapan dan dokumen pendukung tersedia pada detail masing-masing ruas.</p><a href="#authority-references" onClick={e => { e.preventDefault(); document.getElementById('authority-references')?.scrollIntoView({ behavior: 'smooth' }); }}>Baca sumber status jalan <ArrowUpRight size={13} /></a></div></div>
    <div className="authority-summary" aria-label="Ringkasan menurut status jalan">{groups.map(g => <div key={g.key}><span className={`authority-category authority-${g.key}`}>{g.name}</span><strong>{number(g.count)}<small>titik eksperimen</small></strong><div className="authority-summary-labels"><span>{g.roads} ruas</span><span>{g.urgent} mendesak</span></div><span className="authority-summary-cost">{compactMoney(g.sumMedians)}</span></div>)}</div>
    <section className="panel authority-registry"><div className="workspace-heading"><div><h2>Status jalan per ruas</h2><p>{rows.length} ruas sesuai filter. Buka baris untuk membaca bukti dan catatan.</p></div><RegistryDownload /></div>{controls}
      <div className="authority-column-labels" aria-hidden="true"><span>Ruas dalam proyek</span><span>Status jalan</span><span>Titik / mendesak</span><span>Perkiraan biaya</span><span /></div>
      {rows.length ? rows.map(road => {
        const cost = road.sites.reduce((n, s) => n + s.cost.p50, 0), urgent = road.sites.filter(s => s.triage === 'Perlu Penanganan Mendesak').length;
        return <details className="authority-road" key={road.id}><summary><span className="authority-road-name">{road.name}<small>{road.id}{road.jurisdiction.aliasNeedsReview ? ' (nama ruas perlu diperiksa)' : ''}</small></span><AuthorityBadge jurisdiction={road.jurisdiction} /><span>{road.sites.length} / {urgent}<small>titik / mendesak</small></span><span>{compactMoney(cost)}<small>perkiraan</small></span><ChevronDown size={16} /></summary><div className="authority-road-body"><AuthorityDetails jurisdiction={road.jurisdiction} full /><button className="text-link" onClick={() => onInspect(road.name)}>Lihat titik ruas ini di peta <ArrowUpRight size={15} /></button></div></details>;
      }) : <div className="empty"><h3>Tidak ada ruas sesuai filter.</h3><p>Ubah pilihan ruas, kerusakan, atau prioritas untuk melihat hasil lain.</p></div>}
    </section>
    <p className="authority-accounting-note">Biaya di atas adalah perkiraan dari data eksperimen. Angka ini belum menjadi anggaran resmi. Status jalan membantu petugas menentukan instansi yang perlu diajak berkoordinasi.</p>
    <AuthorityReferences />
  </div>;
}
