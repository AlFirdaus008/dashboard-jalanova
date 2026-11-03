import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal, flushSync } from 'react-dom';
import { createRouteTransition } from './lib/navigation.mjs';
import L from 'leaflet';
import { AuthProvider, useAuth } from './Auth.jsx';
import { AccountStrip, ResetPasswordPage } from './AccessPages.jsx';
import { CitizenReportForm } from './CitizenReportForm.jsx';
import { CitizenDashboard } from './CitizenDashboard.jsx';
import { RoleGateway } from './RoleGateway.jsx';
import { ReportQueue } from './ReportQueue.jsx';
import { CitizenReportDetail } from './ReportQueue.jsx';
import { LiveReportsPanel, useLiveReports } from './LiveReports.jsx';
import { REPORT_STATUSES, isDemoReport } from './lib/citizen-reports.mjs';
import './live-reports.css';
import { appHref, dashboardHome, parseAppRoute, DASHBOARD_MODE_KEY } from './lib/app-routes.mjs';
import { Inbox, LayoutDashboard } from 'lucide-react';
import { ArrowUpRight, ArrowRight, ArrowDown, MapPinned, Map, ListOrdered, Wallet, PanelLeftClose, PanelLeftOpen, Clock3, ChartNoAxesCombined, Database, ChevronRight, ChevronDown, Search, SlidersHorizontal, Download, X, Menu, Layers, LocateFixed, Check, Info, ExternalLink, CircleHelp, MoveUpRight, Route, ScanLine, GitMerge, Camera, BookOpen, ChevronLeft, RotateCcw, Table2, Crosshair, FileText, ShieldCheck, Link2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import './styles.css';
import './theme.css';
import './brand.css';
import './project.css';
import { AuthorityPage, AuthorityBadge, AuthorityDetails } from './Authority.jsx';
import { attachAuthorities, authorityNames, authorityColors, authorityLabel } from './lib/authority.mjs';
import { ProjectFocus } from './ProjectFocus.jsx';
import { Method } from './Method.jsx';
import { RobustnessChart } from './AnalysisSummaries.jsx';
import { PROJECT_HEADLINE, PROJECT_HEADLINE_PARTS } from './content/project.mjs';
import { SiteDetail } from './SiteDetail.jsx';
import { attachReportDetails, mapTooltip } from './lib/reports.mjs';
import { CompetitionSection } from './Competition.jsx';
import { Sidebar } from './Sidebar.jsx';
import { AppHeader } from './AppHeader.jsx';
import { StreetScene } from './StreetScene.jsx';
import { ThemeProvider, useTheme } from './Theme.jsx';
import { damageNames, treatments, triageNames, triageColors, rupiah, number, compactMoney, filterSites, summarizeSites, groupSites, formatWindow, csvForSites } from './lib/data.mjs';

import './navigation.css';
import './site-header.css';
import './design-refresh.css';

const NAV = [
  ['dashboard', 'Peta kerusakan', MapPinned], ['authority', 'Kewenangan jalan', ShieldCheck], ['priority', 'Prioritas penanganan', ListOrdered],
  ['budget', 'Estimasi biaya', Wallet], ['schedule', 'Jadwal kerja', Clock3], ['evaluation', 'Evaluasi model', ChartNoAxesCombined], ['inbox', 'Laporan masyarakat', Inbox],
];
const CITIZEN_NAV = [
  ['warga', 'Dashboard saya', LayoutDashboard], ['report', 'Laporkan jalan rusak', Camera], ['my-reports', 'Laporan saya', Inbox],
];
const ALL = { query: '', road: '', damage: '', triage: '', source: '', authority: '' };
const sourceName = value => value === 'deteksi' ? 'Estimasi dari deteksi' : 'Imputasi dimensi';
const badgeClass = value => value?.includes('Mendesak') ? 'urgent' : value?.includes('Terjadwal') ? 'scheduled' : 'monitor';
const routeHref = name => `#/${name}`;
function useRoute() {
  const [route, setRoute] = useState(location.hash.replace(/^#\/?/, '') || 'about');
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (document.startViewTransition) document.documentElement.classList.add('has-view-transitions');
    const transition = createRouteTransition({ document, reducedMotion: () => reduced.matches, commit: next => {
      flushSync(() => setRoute(next));
      window.scrollTo({ top:0, behavior:'instant' });
      document.getElementById('main-content')?.focus({ preventScroll:true });
    } });
    const listener = () => transition.navigate(location.hash.replace(/^#\/?/, '') || 'about');
    window.addEventListener('hashchange', listener);
    return () => { window.removeEventListener('hashchange', listener); transition.destroy(); document.documentElement.classList.remove('has-view-transitions'); };
  }, []);
  return route;
}
function Logo({href = '#/about', label = 'Jalanova AI, halaman pengenalan'}) { return <a href={href} className="brand brand-logo-only" aria-label={label}><img src="/favicon.svg" width="1080" height="1080" alt="Jalanova AI" /></a>; }
function Badge({ status }) { return <span className={`badge ${badgeClass(status)}`}><i />{triageNames[status] || status}</span>; }
function Eyebrow({ children }) { return <div className="eyebrow">{children}</div>; }
function PageHead({ eyebrow = 'ANALISIS JALAN SURABAYA', title, children, action }) { return <div className="page-heading"><div><Eyebrow>{eyebrow}</Eyebrow><h1>{title}</h1>{children && <p>{children}</p>}</div>{action}</div>; }
function Notice({ children, subtle = false }) { return <div className={`notice ${subtle ? 'subtle' : ''}`}><Info size={15} /><span>{children}</span></div>; }
function DownloadButton({ sites, label = 'Ekspor data', className = 'button secondary' }) { return <button className={className} onClick={() => { const url = URL.createObjectURL(new Blob([csvForSites(sites)], { type: 'text/csv;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = 'jalanova-keputusan-terpilih.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }}><Download size={16} />{label}</button>; }
function Empty({ children = 'Tidak ada titik yang cocok dengan filter.' }) { return <div className="empty"><Search size={26} /><h3>Belum ada hasil</h3><p>{children}</p></div>; }
function Figure({ src, alt, caption }) { const [open, setOpen] = useState(false); useEffect(() => { if (!open) return; const key = e => e.key === 'Escape' && setOpen(false); document.addEventListener('keydown', key); return () => document.removeEventListener('keydown', key); }, [open]); return <><figure className="project-figure"><button onClick={() => setOpen(true)} aria-label={`Perbesar: ${alt}`}><img loading="lazy" src={`/figures/${src}`} alt={alt} /><span><ScanLine size={15} /> Perbesar gambar</span></button>{caption && <figcaption>{caption}</figcaption>}</figure>{open && <div className="image-modal" role="dialog" aria-modal="true" aria-label={alt} onClick={() => setOpen(false)}><button className="icon-button" autoFocus onClick={() => setOpen(false)} aria-label="Tutup gambar"><X /></button><img src={`/figures/${src}`} alt={alt} /></div>}</>; }

function About() {
  const {session, profile} = useAuth();
  return <div className="public-page page-enter"><AppHeader route="about" brand={<Logo />} />
    <main id="main-content" tabIndex={-1}><section className="hero"><div className="hero-copy"><h1 className="hero-headline"><span>{PROJECT_HEADLINE_PARTS[0]}</span>{' '}<em>{PROJECT_HEADLINE_PARTS[1]}</em></h1><p>Jalanova dirancang untuk membantu aduan sampai ke pihak yang berwenang, membaca kerusakan dalam kondisi foto yang beragam, dan memperkirakan kebutuhan perbaikan jalan.</p><div className="hero-actions"><a className="button primary" href="#/report">Laporkan jalan rusak <ArrowUpRight size={18} /></a><a className="text-link" href="#/method">Pelajari metodenya <ArrowRight size={17} /></a></div><div className="hero-stats"><div><strong>850<span>laporan</span></strong><p className="simulation-label">Data simulasi proyek</p></div><div><strong>659<span>titik</span></strong><p>Lokasi dalam simulasi</p></div><div><strong>15<span>ruas</span></strong><p>Cakupan simulasi</p></div></div></div>
    <div className="hero-scene"><StreetScene /><div className="scene-caption"><span>INOVBOYO 2.0</span><span className="scene-caption-brand">Jalanova</span></div></div></section>
    <section className="audience-paths" aria-labelledby="audience-heading"><div className="audience-heading"><span className="eyebrow">PILIH JALUR ANDA</span><h2 id="audience-heading">Apa yang ingin Anda lakukan?</h2></div><div className="audience-options"><article className="audience-card"><div className="audience-icon"><Camera size={24} strokeWidth={1.6} /></div><h3>Untuk masyarakat</h3><p>Foto jalan yang rusak, tandai lokasinya, lalu pantau laporan yang Anda kirim.</p><div className="audience-actions"><a className="button primary" href="#/report">Laporkan jalan rusak <ArrowUpRight size={16} /></a>{session && profile?.role === 'citizen' ? <a className="text-link" href="#/warga">Dashboard saya</a> : <><a className="text-link" href="#/account?role=citizen">Masuk</a><a className="text-link" href="#/account?role=citizen&mode=register">Daftar akun</a></>}</div></article><article className="audience-card audience-card-staff"><div className="audience-icon"><ShieldCheck size={24} strokeWidth={1.6} /></div><h3>Untuk petugas dan instansi</h3><p>Tinjau laporan warga, periksa kewenangan ruas, dan catat tindak lanjutnya.</p><div className="audience-actions"><a className="button secondary" href="#/account?role=staff">Masuk sebagai petugas <ArrowUpRight size={16} /></a></div></article></div></section><CompetitionSection /><section className="intro-band"><div><span className="section-number">01 / LATAR BELAKANG</span><h2>Data yang dibutuhkan<br /><span>untuk menindaklanjuti aduan.</span></h2></div><p>Melaporkan jalan rusak belum selesai saat foto terkirim. Warga perlu tahu siapa yang menangani jalan tersebut. Petugas juga perlu foto yang dapat dibaca dan ukuran kerusakan untuk merencanakan pekerjaan. Tiga kebutuhan ini menjadi fokus pengembangan Jalanova.</p></section>
    <section className="purpose-section innovation-section"><div className="section-side"><Eyebrow>TUJUAN & MANFAAT</Eyebrow><h2>Tiga fokus<br />pengembangan.</h2><p>Tujuannya agar warga tahu ke mana harus melapor dan petugas mendapat data yang cukup untuk merencanakan perbaikan.</p><a href="#/method" className="text-link">Lihat data dan metode <ArrowUpRight size={16} /></a></div><ProjectFocus /></section>
    <section className="visual-story"><div className="visual-story-text"><Eyebrow>CONTOH DETEKSI</Eyebrow><h2>Hasil deteksi<br />kerusakan jalan.</h2><p>Kotak pada gambar menandai prediksi retak memanjang, retak melintang, retak buaya, atau lubang. Ukuran kerusakan diperkirakan dari kotak tersebut dengan asumsi posisi dan geometri kamera.</p><a href="#/evaluation" className="text-link">Periksa hasil model <ArrowUpRight size={16} /></a></div><Figure src="overlay_dimensi.png" alt="Contoh deteksi dan estimasi dimensi dari dataset India, China MotorBike, dan Czech" caption="Contoh dari dataset RDD2022. Foto ini bukan dokumentasi titik kerusakan Surabaya." /></section>
    <section className="workflow-section"><div className="section-heading"><div><Eyebrow>ALUR JALANOVA</Eyebrow><h2>Cara Jalanova mengolah data.</h2></div><a className="text-link" href="#/method">Data, metode & referensi <ArrowUpRight size={16} /></a></div><div className="workflow-grid">{[['01', 'Kumpulkan', 'Citra, aduan, lalu lintas, AHSP, dan riwayat.'], ['02', 'Deteksi', 'Jenis kerusakan dari citra jalan.'], ['03', 'Gabungkan', 'Aduan berulang pada titik yang sama.'], ['04', 'Perkirakan', 'Keparahan, dimensi, dan biaya.'], ['05', 'Prioritaskan', 'Lima kriteria dengan AHP dan entropi.'], ['06', 'Jadwalkan', 'Jendela kerja dan simulasi tundaan.']].map(([n, title, copy]) => <div key={n}><span>{n}</span><h3>{title}</h3><p>{copy}</p></div>)}</div></section>
    <section className="honest-note"><Info size={21} /><div><h3>Dari laporan ke rencana kerja</h3><p>Jalanova menghubungkan laporan, lokasi, pengelola jalan, prioritas, biaya, dan waktu kerja dalam satu alur. Peta hasil notebook memakai data simulasi; laporan baru dari warga tampil terpisah untuk ditindaklanjuti petugas.</p></div><a href="#/method">Tentang data simulasi <ArrowUpRight size={16} /></a></section>
    <section className="closing-section"><div><Eyebrow>JELAJAHI HASILNYA</Eyebrow><h2>Lihat hasil analisis per ruas.</h2><p>Lihat titik kerusakan, alasan prioritas, estimasi biaya, dan waktu penanganannya.</p></div><a className="button primary" href={dashboardHome(profile)}>Buka Dashboard <ArrowUpRight size={19} /></a></section></main>
    <footer className="public-footer"><Logo /><p>Proyek pemeliharaan jalan Surabaya untuk INOVBOYO 2.0</p><a href="#/method">Data & referensi <ArrowUpRight size={15} /></a></footer></div>;
}


function Filters({ filters, onChange, roads, full = false }) {
  const set = (key, value) => onChange({ ...filters, [key]: value }); const active = Object.values(filters).some(Boolean);
  return <div className="filter-block"><div className="filter-bar"><label className="search-field"><Search size={17} /><input aria-label="Cari ruas atau ID laporan" placeholder="Cari ruas atau ID laporan…" value={filters.query} onChange={e => set('query', e.target.value)} /></label><label className="select-field"><Route size={16} /><select aria-label="Filter ruas jalan" value={filters.road} onChange={e => set('road', e.target.value)}><option value="">Semua ruas</option>{roads.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}</select></label><label className="select-field"><select aria-label="Filter status triase" value={filters.triage} onChange={e => set('triage', e.target.value)}><option value="">Semua prioritas</option>{Object.entries(triageNames).map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select></label><label className="select-field"><ShieldCheck size={15} /><select aria-label="Filter status jalan" value={filters.authority} onChange={e => set('authority', e.target.value)}><option value="">Semua status jalan</option>{Object.entries(authorityNames).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>{full && <label className="select-field"><select aria-label="Filter jenis kerusakan" value={filters.damage} onChange={e => set('damage', e.target.value)}><option value="">Semua kerusakan</option>{Object.entries(damageNames).map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select></label>}<button className={`filter-reset ${active ? 'has-filters' : ''}`} onClick={() => onChange({ ...ALL })} disabled={!active} title="Hapus semua filter" aria-label="Hapus semua filter"><RotateCcw size={16} />{active && <span>Reset</span>}</button></div></div>;
}

function MapView({ sites, selected, onSelect, roads, liveReports = [], onLiveSelect, compact = false }) {
  const { resolved } = useTheme();
  const roadsLayerRef = useRef(null);
  const el = useRef(null), mapRef = useRef(null), markersRef = useRef(null), liveMarkersRef = useRef(null), liveFitRef = useRef(false), selectedRef = useRef(null), tileRef = useRef(null);
  const onSelectRef = useRef(onSelect); onSelectRef.current = onSelect;
  const onLiveSelectRef = useRef(onLiveSelect); onLiveSelectRef.current = onLiveSelect;
  const [base, setBase] = useState('online'), [tileIssue, setTileIssue] = useState(false);
  const [colorBy, setColorBy] = useState('triage');
  useEffect(() => {
    const map = L.map(el.current, { zoomControl: false, minZoom: 10, maxZoom: 19, scrollWheelZoom: true }).setView([-7.276, 112.733], 12);
    mapRef.current = map;
    map.attributionControl.addAttribution('Jaringan jalan &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>');
    L.control.zoom({ position: 'bottomleft' }).addTo(map);
    L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map);
    const tile = L.tileLayer(`https://{s}.basemaps.cartocdn.com/${resolved === 'dark' ? 'dark_all' : 'light_all'}/{z}/{x}/{y}{r}.png`, { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>' }).addTo(map);
    tile.on('tileerror', () => setTileIssue(true)); tileRef.current = tile;
    roadsLayerRef.current = L.geoJSON(roads, { style: { color: resolved === 'dark' ? '#50695c' : '#a2b9a8', weight: 1.3, opacity: .65 }, interactive: false }).addTo(map);
    markersRef.current = L.layerGroup().addTo(map);
    liveMarkersRef.current = L.layerGroup().addTo(map);
    const observer = new ResizeObserver(() => map.invalidateSize()); observer.observe(el.current);
    return () => { observer.disconnect(); map.remove(); mapRef.current = null; };
  }, [roads]);
  useEffect(() => {
    tileRef.current?.setUrl(`https://{s}.basemaps.cartocdn.com/${resolved === 'dark' ? 'dark_all' : 'light_all'}/{z}/{x}/{y}{r}.png`);
    roadsLayerRef.current?.setStyle({ color: resolved === 'dark' ? '#50695c' : '#a2b9a8' });
    setTileIssue(false);
  }, [resolved]);
  useEffect(() => { const map = mapRef.current; if (!map || !tileRef.current) return; if (base === 'online') tileRef.current.addTo(map); else map.removeLayer(tileRef.current); }, [base]);
  useEffect(() => {
    const group = markersRef.current; if (!group) return; group.clearLayers();
    sites.forEach(site => { const marker = L.circleMarker([site.coordinates[1], site.coordinates[0]], { radius: site.triage.includes('Mendesak') ? 5.5 : 4, color: 'var(--map-marker-border)', weight: 1.1, fillColor: colorBy === 'authority' ? authorityColors[site.jurisdiction.authority] : triageColors[site.triage], fillOpacity: .9 }).addTo(group);
      const tooltip = document.createElement('div'); tooltip.textContent = mapTooltip(site); marker.bindTooltip(tooltip, { direction: 'top' }); marker.on('click', () => onSelectRef.current(site));
      marker.on('add', () => { const node = marker.getElement(); if (node) { node.setAttribute('tabindex', '0'); node.setAttribute('role', 'button'); node.setAttribute('aria-label', tooltip.textContent); node.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectRef.current(site); } }); } });
      const node = marker.getElement(); if (node) { node.setAttribute('tabindex', '0'); node.setAttribute('role', 'button'); node.setAttribute('aria-label', tooltip.textContent); node.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectRef.current(site); } }); }
    });
  }, [sites, colorBy]);
  useEffect(() => {
    const group=liveMarkersRef.current;if(!group)return;group.clearLayers();
    liveReports.forEach(report=>{
      if(!Number.isFinite(report.latitude) || !Number.isFinite(report.longitude))return;
      const demo=isDemoReport(report);
      const marker=L.circleMarker([report.latitude,report.longitude],{radius:7,color:demo?'#a5643d':'#153f39',weight:2.5,fillColor:demo?'#fff0df':'#ffffff',fillOpacity:1}).addTo(group);
      const label=`${demo ? 'Laporan demo' : 'Laporan warga'}: ${report.road_name} | ${REPORT_STATUSES[report.status] || report.status}`;
      marker.bindTooltip(label,{direction:'top'});
      marker.on('click',()=>onLiveSelectRef.current?.(report));
      marker.on('add',()=>{const node=marker.getElement();if(node){node.setAttribute('tabindex','0');node.setAttribute('role','button');node.setAttribute('aria-label',label);node.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onLiveSelectRef.current?.(report);}});}});
    });
  },[liveReports]);
  useEffect(() => {
    if (sites.length) mapRef.current.fitBounds(L.latLngBounds(sites.map(s => [s.coordinates[1], s.coordinates[0]])), { padding: [35, 35], maxZoom: sites.length === 1 ? 16 : 14, animate: false });
  }, [sites]);
  useEffect(() => {
    if (!mapRef.current || !liveReports.length || liveFitRef.current) return;
    const points=[...sites.map(site=>[site.coordinates[1],site.coordinates[0]]),...liveReports.map(report=>[report.latitude,report.longitude])];
    mapRef.current.fitBounds(L.latLngBounds(points),{padding:[35,35],maxZoom:14,animate:false});
    liveFitRef.current=true;
  },[liveReports,sites]);
  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    if (selectedRef.current) map.removeLayer(selectedRef.current);
    if (selected && sites.some(s => s.id === selected.id)) selectedRef.current = L.circleMarker([selected.coordinates[1], selected.coordinates[0]], { radius: 10, color: 'var(--map-selected)', weight: 2.5, fillOpacity: 0, interactive: false }).addTo(map);
  }, [selected, sites]);
  const recenter = () => { const points=[...sites.map(site=>[site.coordinates[1],site.coordinates[0]]),...liveReports.map(report=>[report.latitude,report.longitude])];if(points.length) mapRef.current?.fitBounds(L.latLngBounds(points),{padding:[35,35],maxZoom:14}); };
  return <div className={`map-container ${compact ? 'compact' : ''}`}><div ref={el} className="leaflet-map" role="region" aria-label="Peta kerusakan jalan Surabaya" /><div className="map-tools"><div className="map-location"><span className="live-dot" />SURABAYA <span>15 ruas analisis</span></div><div className="map-tool-buttons"><button title="Ubah peta dasar" aria-label={base === 'online' ? 'Gunakan jaringan jalan lokal' : 'Gunakan peta dasar daring'} onClick={() => setBase(base === 'online' ? 'local' : 'online')}><Layers size={18} /></button><button title="Tampilkan semua titik terpilih" aria-label="Tampilkan semua titik terpilih" onClick={recenter}><LocateFixed size={18} /></button></div></div><label className="map-authority-selector">Warna titik<select aria-label="Warna titik pada peta" value={colorBy} onChange={e => setColorBy(e.target.value)}><option value="triage">Prioritas kerusakan</option><option value="authority">Status jalan</option></select></label><div className={`map-legend ${colorBy === 'authority' ? 'authority-legend' : ''}`}>{Object.entries(colorBy === 'authority' ? authorityNames : triageNames).map(([key, text]) => <span key={key}><i style={{ background: colorBy === 'authority' ? authorityColors[key] : triageColors[key] }} />{text}</span>)}{liveReports.some(report=>!isDemoReport(report)) && <span className="live-report-map-label"><i />Laporan warga</span>}{liveReports.some(isDemoReport) && <span className="live-report-map-label demo"><i />Data demo</span>}</div>{colorBy === 'authority' && <div className="map-authority-note">Warna menunjukkan status ruas: Nasional, Provinsi, atau Kota. Titik kerusakan merupakan lokasi simulasi.</div>}{(tileIssue || base === 'local') && <div className="map-fallback">Jaringan OSM lokal aktif{base === 'online' && '. Sebagian peta dasar gagal dimuat.'}</div>}<div className="map-count">{number(sites.length)} titik eksperimen{liveReports.some(report=>!isDemoReport(report)) && `, ${liveReports.filter(report=>!isDemoReport(report)).length} laporan warga`}{liveReports.some(isDemoReport) && `, ${liveReports.filter(isDemoReport).length} data demo`}</div></div>;
}


function Stats({ sites, summary }) { const stats = summarizeSites(sites), isAll = sites.length === summary.titik_unik; return <div className="stat-grid"><div className="stat-card"><span>Titik simulasi<MapPinned size={17} /></span><strong>{number(stats.count)}<small>titik</small></strong><p>{isAll ? 'Pada 15 ruas dalam analisis' : 'Sesuai filter yang aktif'}</p></div><div className="stat-card"><span>Laporan simulasi<GitMerge size={17} /></span><strong>{number(stats.reports)}<small>laporan</small></strong><p>Diringkas menurut lokasi yang sama</p></div><div className="stat-card"><span>Penanganan mendesak<ArrowUpRight size={17} /></span><strong>{number(stats.urgent)}<small>titik</small></strong><p><i className="tiny-dot orange" />Titik dengan prioritas tertinggi</p></div><div className="stat-card"><span>{isAll ? 'Estimasi total RAB' : 'Perkiraan biaya'}<Wallet size={17} /></span><strong className="money-stat">{compactMoney(isAll ? summary.rab_total_idr.P50 : stats.sumMedians)}</strong><p>{isAll ? 'Perkiraan biaya seluruh titik' : 'Sesuai titik yang ditampilkan'}</p></div></div>; }

function SiteTable({ sites, onSelect, selected, compact = false }) {
  const [page, setPage] = useState(1), [sort, setSort] = useState('priority');
  const size = compact ? 8 : 12;
  const sorted = useMemo(() => [...sites].sort((a, b) => sort === 'cost' ? b.cost.p50 - a.cost.p50 : sort === 'reports' ? b.reports - a.reports : b.priority - a.priority), [sites, sort]);
  useEffect(() => setPage(1), [sites, sort]);
  const pages = Math.max(1, Math.ceil(sorted.length / size));
  return <div className="table-component"><div className="table-toolbar"><span>{number(sites.length)} titik ditemukan</span><label>Urutkan <select aria-label="Urutkan titik" value={sort} onChange={e => setSort(e.target.value)}><option value="priority">Prioritas tertinggi</option><option value="cost">Biaya tertinggi</option><option value="reports">Aduan terbanyak</option></select></label></div>{sites.length ? <div className="table-scroll"><table><thead><tr><th>Ruas & laporan</th><th>Kerusakan</th><th>Prioritas</th><th>Penanganan</th><th>RAB median</th><th /></tr></thead><tbody>{sorted.slice((page - 1) * size, page * size).map(s => <tr key={s.id} className={selected?.id === s.id ? 'selected' : ''}><td><button className="table-road" onClick={() => onSelect(s)}>{s.road}<small>{s.id}</small></button><AuthorityBadge jurisdiction={s.jurisdiction} /></td><td>{damageNames[s.damage]}<small className="table-secondary">{s.severity}</small></td><td><div className="score-cell"><strong>{number(s.priority, 1)}</strong><span style={{ background: triageColors[s.triage] }} /></div><small className="table-secondary">{triageNames[s.triage]}</small></td><td>{treatments[s.treatment]}</td><td className="table-currency">{rupiah(s.cost.p50)}</td><td><button className="icon-button" onClick={() => onSelect(s)} aria-label={`Lihat detail ${s.id}`}><ArrowUpRight size={16} /></button></td></tr>)}</tbody></table></div> : <Empty />}<div className="pagination"><span>{sites.length ? `${(page - 1) * size + 1}–${Math.min(page * size, sites.length)}` : '0'} dari {number(sites.length)} titik</span><div><button disabled={page <= 1} className="icon-button" aria-label="Halaman sebelumnya" onClick={() => setPage(p => p - 1)}><ChevronLeft size={17} /></button><span>{page} / {pages}</span><button disabled={page >= pages} className="icon-button" aria-label="Halaman berikutnya" onClick={() => setPage(p => p + 1)}><ChevronRight size={17} /></button></div></div></div>;
}

function Dashboard({ data, roads, filters, setFilters, sites, selected, setSelected }) {
  const [view,setView]=useState('map'),[selectedLive,setSelectedLive]=useState(null);
  const live=useLiveReports();
  return <>
    <PageHead eyebrow="PETA ANALISIS JALANOVA" title="Peta kerusakan jalan Surabaya" action={<DownloadButton sites={sites} />}>Telusuri titik simulasi, lihat alasan prioritasnya, dan buka laporan warga yang masuk untuk ditindaklanjuti.</PageHead>
    <Stats sites={sites} summary={data.summary} />
    <LiveReportsPanel state={live} onSelect={setSelectedLive} />
    <section className="map-workspace">
      <div className="workspace-heading"><div><h2>Peta kerusakan jalan <span className="count-pill">{sites.length} titik</span></h2><p>Klik titik eksperimen atau laporan warga untuk melihat rinciannya.</p></div><div className="segmented"><button className={view === 'map' ? 'active' : ''} onClick={() => setView('map')}><Map size={15} />Peta</button><button className={view === 'table' ? 'active' : ''} onClick={() => setView('table')}><Table2 size={15} />Tabel</button></div></div>
      <Filters filters={filters} onChange={setFilters} roads={data.roads} full />
      <div className="map-detail-grid"><div className="map-main">{view === 'map'
        ? <MapView sites={sites} selected={selected} onSelect={setSelected} roads={roads} liveReports={live.reports} onLiveSelect={setSelectedLive} />
        : <SiteTable sites={sites} selected={selected} onSelect={setSelected} compact />}
        {!sites.length && view === 'map' && <div className="map-empty"><Empty /></div>}</div>
        <SiteDetail site={selected} schedules={data.schedules} reports={data.reports} onClose={() => setSelected(null)} />
      </div>
      <div className="workspace-note"><Info size={14} /><span>Peta menampilkan titik simulasi dan laporan warga secara terpisah. Pilih titik untuk melihat usulan penanganan atau buka laporan warga untuk mencatat tindak lanjut.</span></div>
    </section>
    {selectedLive && <CitizenReportDetail report={selectedLive} data={data} staff onClose={()=>setSelectedLive(null)} onSaved={updated=>{setSelectedLive(updated);live.refresh();}} />}
    <div className="dashboard-bottom"><div><span className="live-dot" /> 15 ruas jalan dalam analisis Jalanova</div><a href="#/priority">Baca daftar prioritas <ArrowRight size={15} /></a></div>
  </>;
}

function Priority({ data, filters, setFilters, sites, selected, setSelected }) {
  const [detailOpen, setDetailOpen] = useState(false);
  useEffect(() => { if (!detailOpen) return; const previousOverflow=document.body.style.overflow; document.body.style.overflow='hidden'; const handler = e => { if (e.key === 'Escape') setDetailOpen(false); }; document.addEventListener('keydown', handler); return () => { document.body.style.overflow=previousOverflow; document.removeEventListener('keydown', handler); }; }, [detailOpen]);
  const criteria = [['severity', 'Keparahan'], ['traffic', 'Lalu lintas'], ['function', 'Fungsi ruas'], ['scale', 'Skala pekerjaan'], ['reports', 'Jumlah aduan']];
  return <><PageHead title="Urutan prioritas penanganan" action={<DownloadButton sites={sites} />}>Urutan berdasarkan keparahan, lalu lintas, fungsi jalan, skala, dan aduan.</PageHead><div className="priority-explainer"><div><Eyebrow>BOBOT PRIORITAS</Eyebrow><h2>Dasar perhitungan<br />prioritas.</h2><p>Gabungan AHP 70% dan entropi 30%. Skor dan triase bersifat relatif terhadap seluruh titik dalam eksperimen.</p></div><div className="weight-bars">{criteria.map(([key, label]) => <div key={key}><span>{label}</span><div><i style={{ width: `${data.summary.bobot_prioritas[key] * 250}%` }} /></div><strong>{number(data.summary.bobot_prioritas[key] * 100, 1)}%</strong></div>)}</div></div><section className="panel"><div className="workspace-heading"><div><h2>Daftar titik prioritas</h2><p>Filter tidak mengubah skor hasil eksperimen.</p></div><span className="count-pill">{number(sites.length)} titik</span></div><Filters filters={filters} onChange={setFilters} roads={data.roads} full /><SiteTable sites={sites} selected={selected} onSelect={s => { setSelected(s); setDetailOpen(true); }} /></section><Notice subtle>Dari semua titik, 20% dengan skor tertinggi ditandai mendesak. Titik pada urutan berikutnya, sampai setengah dari daftar, masuk jadwal penanganan. Sisanya dipantau. Petugas tetap perlu memeriksa kondisi jalan.</Notice>{detailOpen && createPortal(<div className="detail-modal" role="dialog" aria-modal="true" aria-label="Detail keputusan titik" onClick={() => setDetailOpen(false)}><div onClick={e => e.stopPropagation()}><button className="modal-close icon-button" autoFocus aria-label="Tutup panel" onClick={() => setDetailOpen(false)}><X /></button><SiteDetail site={selected} schedules={data.schedules} reports={data.reports} standalone /></div></div>, document.body)}</>;
}

function HorizontalBars({ rows, color = '#337c65', money = false }) { const max = Math.max(1, ...rows.map(r => r.value)); return <div className="horizontal-bars">{rows.map(r => <div key={r.name}><div><span>{r.name}</span><strong>{money ? compactMoney(r.value) : number(r.value, 3)}</strong></div><div className="bar-rail"><i style={{ width: `${r.value / max * 100}%`, background: r.color || color }} /></div></div>)}</div>; }
function Budget({ data, sites, filters, setFilters, preview = false }) {
  const total = summarizeSites(sites), all = sites.length === data.sites.length;
  const roads = groupSites(sites, 'road').sort((a, b) => b.sumMedians - a.sumMedians);
  const groups = groupSites(sites, 'treatment');
  return <><PageHead title="Estimasi biaya perbaikan" action={<DownloadButton sites={sites} label="Ekspor estimasi" />}>Estimasi AHSP dari jenis penanganan dan dimensi. Seluruh nilai dalam rupiah.</PageHead><div className="budget-hero"><div><Eyebrow>{all ? 'PERKIRAAN TOTAL BIAYA' : 'PERKIRAAN BIAYA TITIK TERPILIH'}</Eyebrow><h2>{rupiah(all ? data.summary.rab_total_idr.P50 : total.sumMedians)}</h2><p>{all ? '659 titik dianalisis dengan 200 simulasi biaya untuk tiap titik.' : `${sites.length} titik sesuai filter. Angka ini menjumlahkan perkiraan biaya tiap titik.`}</p></div>{all && <div className="budget-bounds"><div><span>Perkiraan rendah</span><strong>{rupiah(data.summary.rab_total_idr.P10)}</strong></div><div><span>Perkiraan tinggi</span><strong>{rupiah(data.summary.rab_total_idr.P90)}</strong></div></div>}</div><Filters filters={filters} onChange={setFilters} roads={data.roads} /><div className="analytics-columns"><section className="panel padded"><Eyebrow>ESTIMASI PER RUAS</Eyebrow><h2>Perkiraan biaya per ruas</h2><p className="muted small-copy">Perkiraan tiap titik dijumlahkan menurut ruas jalan.</p>{roads.length ? <HorizontalBars rows={roads.map(r => ({ name: r.name, value: r.sumMedians }))} money /> : <Empty />}</section><div><section className="panel padded"><Eyebrow>JENIS PENANGANAN</Eyebrow><h2>Lingkup pekerjaan</h2><div className="treatment-list">{groups.map(g => <div key={g.name}><span className="treatment-icon"><Route size={20} /></span><div><strong>{treatments[g.name]}</strong><small className="treatment-meta"><span>{g.count} titik</span><span>{compactMoney(g.sumMedians)}</span></small></div><span>{number(g.count / Math.max(1, sites.length) * 100, 1)}%</span></div>)}</div></section><div className="cost-note">
  <Info size={20} />
  <h3>Memahami perkiraan biaya</h3>
  <p className="cost-note-intro">{!sites.length ? 'Tidak ada titik yang sesuai dengan filter. Ubah pilihan untuk melihat perkiraan biaya.' : all ? 'Angka utama adalah nilai tengah dari simulasi biaya untuk seluruh 659 titik.' : <>Angka utama menjumlahkan perkiraan biaya untuk {sites.length} titik yang tampil.</>}</p>
  {sites.length > 0 && <div className="cost-note-points">
    <section><h4>Dasar hitungan</h4><p>Notebook menghitung biaya dari ukuran kerusakan, tebal lapisan perbaikan, harga pekerjaan, dan pajak.</p></section>
    <section><h4>Ukuran yang masih diperkirakan</h4><p>Pada {sites.length - total.detection} dari {sites.length} titik yang tampil, ukuran kerusakan masih memakai perkiraan karena hasil deteksi tidak menyediakan ukurannya.</p></section>
    {all ? <section><h4>Kisaran biaya</h4><p>Sekitar 8 dari 10 hasil simulasi berada di antara angka rendah dan tinggi. Biaya saat perbaikan bisa berbeda.</p></section>
      : <section><h4>Jika titik disaring</h4><p>Kisaran rendah dan tinggi belum dihitung ulang untuk pilihan ini. Angka utama bisa dipakai sebagai perkiraan awal.</p></section>}
  </div>}
</div></div></div></>;
}

function Timeline({ start, length }) { return <div className="timeline" aria-label={`Jendela kerja ${formatWindow(start, length)}`}>{Array.from({ length: 24 }, (_, h) => <div key={h} className={((h - start + 24) % 24) < length ? 'working' : ''} title={`${h}.00`}>{h % 4 === 0 && <span>{String(h).padStart(2, '0')}</span>}</div>)}</div>; }
function Schedule({ data }) {
  const [day, setDay] = useState('Weekday'), [road, setRoad] = useState('');
  const rows = data.schedules.filter(s => s.tipe_hari === day && (!road || s.road_id === road));
  const before = rows.reduce((n, s) => n + s.tundaan_08, 0), after = rows.reduce((n, s) => n + s.tundaan_tambahan_optimal, 0);
  return <><PageHead title="Rekomendasi waktu pengerjaan" >Bandingkan jadwal hari kerja dan akhir pekan berdasarkan simulasi lalu lintas.</PageHead><div className="schedule-summary"><div><span className="stat-label">Pengurangan tundaan simulasi</span><strong>{before ? number((1 - after / before) * 100, 1) : '0'}<small>%</small></strong><p>Dibandingkan mulai pukul 08.00 pada ruas terpilih.</p></div><div><span className="stat-label">Tundaan jika mulai 08.00</span><strong>{number(before)}<small>smp-jam</small></strong><p>Agregat satu shift per ruas</p></div><div><span className="stat-label">Tundaan pada jadwal rekomendasi</span><strong>{number(after)}<small>smp-jam</small></strong><p>Hasil simulasi, bukan pengukuran lapangan</p></div></div><section className="panel"><div className="workspace-heading"><div><h2>Jendela kerja per ruas</h2><p>Jam ditampilkan dalam WIB. Pekerjaan dapat melewati tengah malam.</p></div><div className="segmented"><button className={day === 'Weekday' ? 'active' : ''} onClick={() => setDay('Weekday')}>Hari kerja</button><button className={day === 'Weekend' ? 'active' : ''} onClick={() => setDay('Weekend')}>Akhir pekan</button></div></div><div className="schedule-filters"><label className="select-field"><Route size={16} /><select aria-label="Pilih ruas jadwal" value={road} onChange={e => setRoad(e.target.value)}><option value="">Semua ruas</option>{data.roads.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></label><span>00.00 <span className="schedule-divider">→</span> 24.00</span></div><div className="schedule-rows">{rows.map(s => <article key={s.road_id}><div className="schedule-road"><small>{s.road_id}</small><strong>{s.roadName}</strong><span>{formatWindow(s.mulai_optimal, s.shift_jam)}</span></div><div className="schedule-visual"><Timeline start={s.mulai_optimal} length={s.shift_jam} /></div><div className="schedule-meta"><strong>{s.shift_jam} jam</strong><span>Stabilitas {number(s.stabilitas_bobot * 100)}%</span></div></article>)}</div></section><Notice subtle>Optimasi memilih jam mulai per ruas. Kalender tanggal, jumlah kru, cuaca, dan konflik antarpekerjaan belum dimodelkan. Durasi segel retak memerlukan koreksi satuan sebelum penggunaan operasional.</Notice></>;
}


function EvaluationTakeaway({ children }) {
  return <div className="evaluation-takeaway"><strong>Poin utama</strong><p>{children}</p></div>;
}

function Evaluation({ data }) {
  const [tab, setTab] = useState('vision');
  const overall = data.evaluations.detection.find(r => r.kelompok === 'keseluruhan');
  const domains = data.evaluations.detection.filter(r => r.kelompok === 'domain kamera');
  const photoOriginal = data.evaluations.robustness.find(r => r.degradasi === 'asli');
  const photoInMotion = data.evaluations.robustness.find(r => r.degradasi === 'gerak');
  const severityNames = {
    'jenis+urgensi+embedding+visual': 'Semua informasi',
    baseline_jenis_urgensi: 'Aturan sederhana: jenis dan urgensi',
    baseline_jenis: 'Aturan sederhana: jenis kerusakan',
    jenis_kerusakan: 'Model terlatih: jenis kerusakan',
    'jenis+embedding+visual': 'Jenis, isi laporan, hasil foto',
    'jenis+embedding': 'Jenis dan isi laporan',
  };
  return <>
    <PageHead eyebrow="HASIL PENGUJIAN" title="Bagaimana Jalanova diuji">Hasil ini berasal dari foto dan laporan dalam data uji. Jalanova belum diuji langsung di jalan-jalan Surabaya.</PageHead>
    <div className="method-tabs" role="tablist" aria-label="Jenis evaluasi">
      {[['vision', 'Membaca foto jalan'], ['language', 'Mengolah laporan warga']].map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>)}
    </div>
    {tab === 'vision' ? <>
      <p className="evaluation-guide">Angka berikut berasal dari 365 foto uji RDD2022. Skornya berkisar dari 0 sampai 1; semakin tinggi, semakin cocok hasilnya dengan tanda kerusakan pada foto acuan.</p>
      <div className="metric-grid">{[
        ['Skor deteksi', data.summary.evaluasi_deteksi_uji.mAP50, 'Menilai apakah kerusakan ditemukan dan posisinya tepat (mAP50).'],
        ['Tanda yang tepat', overall.presisi, 'Dari semua tanda Jalanova, berapa banyak yang cocok (presisi).'],
        ['Kerusakan ditemukan', overall.recall, 'Dari semua kerusakan pada foto acuan, berapa banyak yang ditemukan (recall).'],
        ['Skor gabungan', overall.F1, 'Menggabungkan tanda yang tepat dan kerusakan ditemukan (F1).'],
      ].map(([label, value, desc]) => <div className="panel metric" key={label}><span>{label}</span><strong>{number(value, 3)}</strong><p>{desc}</p></div>)}</div>
      <div className="analytics-columns equal">
        <section className="panel padded"><Eyebrow>SUMBER FOTO</Eyebrow><h2>Hasil pada tiga sumber foto</h2><HorizontalBars rows={domains.map(r => ({ name: r.nilai.replace('_', ' '), value: r.F1 }))} /><EvaluationTakeaway>Skor gabungan tertinggi ada pada foto China MotorBike (0,707) dan terendah pada foto India (0,381). Hasil Jalanova masih berubah cukup jauh menurut sumber fotonya.</EvaluationTakeaway><p className="muted small-copy">Foto uji ini tidak berasal dari aduan jalan di Surabaya.</p><details className="evaluation-technical"><summary>Cara skor dihitung</summary><p>Jalanova menampilkan dugaan kerusakan mulai dari tingkat keyakinan 0,25. Tanda lokasi dianggap cocok jika sedikitnya separuh kotaknya bertumpuk dengan tanda acuan (IoU 0,5). Perkiraan rentang skor gabungan untuk seluruh foto uji adalah 0,503 sampai 0,582.</p></details></section>
        <section className="panel padded"><Eyebrow>KONDISI FOTO</Eyebrow><h2>Pengaruh kualitas foto</h2><RobustnessChart rows={data.evaluations.robustness} /><EvaluationTakeaway>Saat foto uji dibuat seolah diambil sambil bergerak, skor deteksi turun dari {number(photoOriginal.mAP50,3)} menjadi {number(photoInMotion.mAP50,3)}. Foto yang goyang paling menyulitkan Jalanova pada uji ini.</EvaluationTakeaway><p className="muted small-copy">Perubahan foto dibuat di komputer. Hasil ini belum berasal dari foto lapangan Surabaya.</p></section>
      </div>
      <section className="panel padded evaluation-story"><div><Eyebrow>FOTO LUBANG BPID</Eyebrow><h2>Setelah belajar dari foto lubang</h2><p>Jalanova dilatih lagi memakai foto lubang dari BPID, lalu diuji pada 24 foto BPID. Skor gabungannya 0,667. Sekitar 58% tanda yang dibuat sesuai dengan acuan, dan sekitar 78% lubang yang sudah ditandai pada foto acuan berhasil ditemukan.</p><p>Namun, saat dicoba kembali pada foto RDD2022, skor deteksinya turun dari 0,563 menjadi 0,537. Penyesuaian untuk satu sumber foto belum tentu memperbaiki hasil pada sumber lain.</p><p className="muted small-copy">Contoh foto di samping berasal dari BPID, bukan dari jalan di Surabaya.</p><details className="evaluation-technical"><summary>Catatan tentang gambar perbandingan</summary><p>Gambar menampilkan tanda dari model awal mulai dari tingkat keyakinan 0,278 dan model setelah dilatih lagi mulai dari 0,219. Angka hasil akhir di atas dihitung dengan batas yang sama, yaitu 0,25.</p></details></div><Figure src="bpid_sebelum_sesudah.png" alt="Perbandingan tanda lubang sebelum dan sesudah model dilatih lagi dengan foto BPID" caption="Tanda hijau dibuat oleh pemeriksa data. Tanda merah dibuat oleh Jalanova. Ini contoh dari foto uji BPID." /></section>
    </> : <>
      <p className="evaluation-guide">Laporan diuji dalam dua langkah: menggabungkan laporan tentang lokasi yang sama dan memperkirakan apakah kerusakannya ringan, sedang, atau berat. Skor gabungan (F1) berkisar dari 0 sampai 1; semakin tinggi, semakin cocok dengan data acuan.</p>
      <div className="language-grid"><section className="panel padded"><Eyebrow>LAPORAN BERULANG</Eyebrow><h2>850 laporan simulasi menjadi 659 lokasi</h2><div className="big-metric">0,983<span>Skor penggabungan laporan</span></div><p className="muted">Pada bagian akhir data uji, Jalanova mendapat skor 0,983 saat mengelompokkan laporan yang menuju lokasi sama. Saat pasangan laporan diperiksa satu per satu, skornya 0,979.</p><p className="muted">Jalanova menemukan 191 laporan berulang. Data sumber menandai 189, sehingga selisih dua laporan ini masih perlu diperiksa.</p><EvaluationTakeaway>Laporan tentang lokasi yang sama dihitung sebagai satu titik. Dari 850 laporan simulasi, tersisa 659 lokasi untuk dianalisis.</EvaluationTakeaway><Notice subtle>Lokasi pada uji ini disusun ulang dengan bantuan penanda laporan berulang dalam data. Skor tersebut belum menunjukkan hasil pada laporan warga yang masuk langsung.</Notice></section><section className="panel padded"><Eyebrow>TINGKAT KERUSAKAN</Eyebrow><h2>Membandingkan cara membaca laporan</h2><HorizontalBars rows={data.evaluations.severity.slice(0, 6).map(r => ({ name: severityNames[r.varian] || r.varian.replaceAll('_', ' '), value: r.F1_makro }))} /><p className="muted small-copy">"Semua informasi" memakai jenis kerusakan, tingkat urgensi, isi laporan, dan ukuran kerusakan dari hasil pembacaan foto. Setiap cara diuji 10 kali. Laporan dengan isi yang sangat mirip dijaga dalam kelompok yang sama selama pengujian.</p></section></div>
      <Notice>Cara yang memakai semua informasi mendapat skor 0,833. Cara yang hanya memakai jenis kerusakan dan urgensi mendapat 0,822. Selisihnya kecil, sementara data uji hanya memuat 18 kalimat inti yang berbeda. Karena itu, belum dapat dipastikan bahwa cara pertama lebih baik.</Notice>
      <details className="evaluation-technical evaluation-technical-outside"><summary>Catatan angka perbandingan</summary><p>Perkiraan selisih skor kedua cara berada antara -0,061 dan 0,069. Karena rentang ini melewati nol, hasil uji belum menunjukkan perbedaan yang jelas.</p></details>
      <Figure src="confusion_keparahan.png" alt="Perbandingan tingkat kerusakan ringan, sedang, dan berat yang diperkirakan Jalanova dengan data acuan" caption="Gambar ini menunjukkan di mana perkiraan tingkat kerusakan cocok atau berbeda dari penilaian pada data acuan." />
    </>}
  </>;
}

function PublicShell({route,children}) { return <div className="public-page"><a href="#main-content" className="skip-link">Lewati navigasi</a><AppHeader route={route} brand={<Logo />} /><main id="main-content" tabIndex={-1} className="public-information-main page-enter">{children}</main><footer className="public-footer"><Logo /><p>Proyek pemeliharaan jalan Surabaya untuk INOVBOYO 2.0</p><a href="#/about">Tentang proyek</a></footer></div>; }

function DashboardRedirect({href}) {
  useEffect(() => { window.location.replace(href); }, [href]);
  return <div className="loading-screen" role="status">Membuka dashboard...</div>;
}

function DashboardShell({route,items,open,close,onToggle,hrefFor,preview = false,showContext = true,pageKey,children}) {
  const citizen = route === 'warga' || route === 'report' || route === 'my-reports';
  const home = citizen ? '#/warga' : appHref('dashboard',{preview});
  const onNavigate = () => { if (window.matchMedia('(max-width:700px)').matches) close(); };
  return <div className={`app-shell ${citizen ? 'citizen-shell ' : ''}${open ? 'navigation-open' : 'navigation-closed'}`}>
    <a href="#main-content" className="skip-link" onClick={event => { event.preventDefault(); document.getElementById('main-content')?.focus(); }}>Lewati navigasi</a>
    <Sidebar items={items} route={route} open={open} close={close} onToggle={onToggle} onNavigate={onNavigate} hrefFor={hrefFor} showContext={showContext} />
    <div className="app-main"><main key={pageKey} id="main-content" tabIndex={-1} className="page-content page-enter"><AccountStrip preview={preview} brand={<Logo href={home} label="Jalanova AI, dashboard" />} />{children}</main></div>
  </div>;
}

function App() {
  const currentRoute = useRoute(), {page:route,workspace,preview} = parseAppRoute(currentRoute), auth = useAuth();
  const [data, setData] = useState(null), [roads, setRoads] = useState(null), [error, setError] = useState('');
  const [filters, setFilters] = useState({ ...ALL }), [selected, setSelected] = useState(null), [navOpen, setNavOpen] = useState(() => window.matchMedia('(min-width:701px)').matches);
  useEffect(() => { let active = true; Promise.all(['/data/project.json', '/data/roads.geojson', '/data/report-details.json'].map(url => fetch(url).then(r => { if (r.status === 404 && url.endsWith('report-details.json')) return { reports:[] }; if (!r.ok) throw Error(`Data tidak dapat dibaca (${r.status})`); return r.json(); }))).then(([project, network, reportDetails]) => { if (active) { const enriched = attachReportDetails(attachAuthorities(project),reportDetails); setData(enriched); setRoads(network); setSelected(enriched.sites[0]); } }).catch(e => active && setError(e.message)); return () => { active = false; }; }, []);
  const closeNavigation = () => { setNavOpen(false); document.getElementById('navigation-toggle')?.focus(); };
  useEffect(() => {
    const desktop = window.matchMedia('(min-width:701px)');
    const change = () => setNavOpen(desktop.matches);
    desktop.addEventListener('change',change);
    return () => desktop.removeEventListener('change',change);
  }, []);
  const sites = useMemo(() => data ? filterSites(data.sites, filters) : [], [data, filters]);
  useEffect(() => { if (selected && !sites.some(s => s.id === selected.id)) setSelected(sites[0] || null); }, [sites, selected]);
  useEffect(() => { document.title = `Jalanova AI: ${route === 'about' ? PROJECT_HEADLINE : NAV.find(n => n[0] === route)?.[1] || ({method:'Data & metode',warga:'Dashboard warga',report:'Laporkan jalan rusak','my-reports':'Laporan saya',account:'Akun','reset-password':'Kata sandi baru'})[route] || 'Jalanova'}`; }, [route]);
  useEffect(() => { const key = e => { if (e.key === 'Escape' && navOpen) closeNavigation(); }; window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key); }, [navOpen]);
  const staff = auth.profile?.role === 'stakeholder';
  const citizen = auth.profile?.role === 'citizen';
  const storedPreview = typeof sessionStorage !== 'undefined' && sessionStorage.getItem(DASHBOARD_MODE_KEY) === 'preview';
  const previewMode = !auth.profile && (preview || storedPreview);
  useEffect(() => {
    if (preview && !auth.profile) sessionStorage.setItem(DASHBOARD_MODE_KEY, 'preview');
  }, [preview, auth.profile]);
  if (error) return <div className="loading-screen"><Logo /><h1>Data belum dapat dimuat.</h1><p>{error}</p><button className="button primary" onClick={() => location.reload()}>Coba lagi <RotateCcw size={16} /></button></div>;
  if (!data || !roads) return <div className="loading-screen"><Logo /><div className="loading-line" /><p>Menyiapkan peta dan hasil analisis…</p></div>;
  const publicPage = content => <PublicShell route={route}>{content}</PublicShell>;
  if (route === 'reset-password') return publicPage(<ResetPasswordPage />);
  if (citizen) {
    if (!['warga','report','my-reports'].includes(route)) return <DashboardRedirect href="#/warga" />;
    return <DashboardShell route={route} items={CITIZEN_NAV} open={navOpen} close={closeNavigation} onToggle={() => setNavOpen(open => !open)} hrefFor={id => `#/${id}`} showContext={false} pageKey={currentRoute}>
      {route === 'warga' ? <CitizenDashboard data={data} /> : route === 'report' ? <CitizenReportForm /> : <ReportQueue data={data} />}
    </DashboardShell>;
  }
  if (staff || previewMode) {
    const activePreview = !staff || preview || Boolean(auth.profile?.is_demo);
    const dashboardHref = appHref('dashboard',{preview:!staff});
    if (!['dashboard','authority','priority','budget','schedule','inbox'].includes(route)) return <DashboardRedirect href={dashboardHref} />;
    return <DashboardShell route={route} items={NAV} open={navOpen} close={closeNavigation} onToggle={() => setNavOpen(open => !open)} hrefFor={id => appHref(id,{workspace:true,preview:activePreview})} preview={activePreview} pageKey={currentRoute}>
      {route === 'dashboard' ? <Dashboard data={data} roads={roads} sites={sites} filters={filters} setFilters={setFilters} selected={selected} setSelected={setSelected} />
        : route === 'inbox' ? <ReportQueue data={data} staff />
        : route === 'authority' ? <AuthorityPage data={data} sites={sites} controls={<Filters filters={filters} onChange={setFilters} roads={data.roads} full />} download={<DownloadButton sites={sites} />} onInspect={road => { setFilters({ ...filters, road }); location.hash = appHref('dashboard',{preview:activePreview}); }} />
        : route === 'priority' ? <Priority data={data} filters={filters} setFilters={setFilters} sites={sites} selected={selected} setSelected={setSelected} />
        : route === 'budget' ? <Budget data={data} sites={sites} filters={filters} setFilters={setFilters} preview={activePreview} />
        : <Schedule data={data} />}
    </DashboardShell>;
  }
  if (route === 'about') return <><a href="#main-content" className="skip-link" onClick={e => { e.preventDefault(); document.querySelector('main')?.focus(); }}>Lewati navigasi</a><About /></>;
  if (route === 'warga') return publicPage(auth.loading ? <p>Memeriksa akun…</p> : <RoleGateway initialRole="citizen" />);
  if (route === 'report') return publicPage(auth.loading ? <p>Memeriksa akun…</p> : <RoleGateway initialRole="citizen" afterLogin="#/report" />);
  if (route === 'my-reports') return publicPage(auth.loading ? <p>Memeriksa akun…</p> : <RoleGateway initialRole="citizen" afterLogin="#/my-reports" />);
  if (route === 'account') { const params=new URLSearchParams(currentRoute.split('?')[1] || ''); return publicPage(<RoleGateway key={currentRoute} initialRole={params.get('role') === 'staff' ? 'staff' : 'citizen'} initialMode={params.get('mode') === 'register' ? 'register' : 'login'} />); }
  if (['method','evaluation'].includes(route)) return publicPage(route === 'method' ? <Method data={data} /> : <Evaluation data={data} />);
  const known = [...NAV.map(n => n[0]), 'method'].includes(route);
  if (!known) return publicPage(<div className="empty"><h1>Halaman tidak ditemukan.</h1><a href="#/about" className="button primary">Tentang proyek</a></div>);
  if (auth.loading) return publicPage(<p>Memeriksa akses dashboard…</p>);
  return publicPage(<RoleGateway initialRole="staff" />);

}

createRoot(document.getElementById('root')).render(<ThemeProvider forcedTheme="light"><AuthProvider><App /></AuthProvider></ThemeProvider>);
