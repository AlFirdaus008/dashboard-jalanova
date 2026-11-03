import { authorityForRoad, authorityLabel, authorityNames, evidenceNames, authoritySource, authorityRegistry } from './authority.mjs';

export function parseCsv(text) {
  text = text.replace(/^\uFEFF/, '');
  const rows = []; let row = [], value = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { if (quoted && text[i + 1] === '"') { value += '"'; i++; } else quoted = !quoted; }
    else if (c === ',' && !quoted) { row.push(value); value = ''; }
    else if ((c === '\n' || c === '\r') && !quoted) { if (c === '\r' && text[i + 1] === '\n') i++; row.push(value); if (row.some(Boolean)) rows.push(row); row = []; value = ''; }
    else value += c;
  }
  if (value || row.length) { row.push(value); rows.push(row); }
  const headers = (rows.shift() || []).map((h, i) => h || (i === 0 ? 'varian' : `column_${i}`));
  return rows.map(values => Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ''])));
}

export const treatments = { tambal: 'Penambalan', overlay: 'Lapis ulang', rekonstruksi: 'Rekonstruksi', segel_retak: 'Segel retak' };
export const damageNames = { Pothole: 'Lubang', 'Alligator Crack': 'Retak buaya', 'Longitudinal Crack': 'Retak memanjang', 'Transverse Crack': 'Retak melintang', 'Rutting/Depression': 'Alur / amblas' };
export const triageNames = { 'Perlu Penanganan Mendesak': 'Mendesak', 'Penanganan Terjadwal Prioritas': 'Terjadwal', 'Pemantauan Rutin Berkala': 'Pemantauan' };
export const triageColors = { 'Perlu Penanganan Mendesak': '#F7941D', 'Penanganan Terjadwal Prioritas': '#00BFA5', 'Pemantauan Rutin Berkala': '#012A44' };
export const rupiah = value => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
export const number = (value, digits = 0) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: digits }).format(value);
export function compactMoney(value) { return value >= 1e9 ? `Rp${number(value / 1e9, 2)} M` : value >= 1e6 ? `Rp${number(value / 1e6, 1)} jt` : rupiah(value); }
export function filterSites(sites, filters = {}) {
  const query = (filters.query || '').trim().toLocaleLowerCase('id');
  return sites.filter(s => {
    const j = s.jurisdiction || authorityForRoad(s.roadId);
    return (!filters.authority || j.authority === filters.authority) && (!filters.road || s.road === filters.road) && (!filters.triage || s.triage === filters.triage) && (!filters.damage || s.damage === filters.damage) && (!filters.source || s.dimensionSource === filters.source) && (!query || [s.id, s.road, s.damage, damageNames[s.damage], treatments[s.treatment], authorityNames[j.authority], j.officialName, j.owner].join(' ').toLocaleLowerCase('id').includes(query));
  });
}
export function summarizeSites(sites) {
  return { count: sites.length, reports: sites.reduce((n, s) => n + s.reports, 0), urgent: sites.filter(s => s.triage === 'Perlu Penanganan Mendesak').length, sumMedians: sites.reduce((n, s) => n + s.cost.p50, 0), detection: sites.filter(s => s.dimensionSource === 'deteksi').length };
}
export function groupSites(sites, key) {
  return Object.entries(sites.reduce((a, s) => { const k = typeof key === 'function' ? key(s) : s[key]; (a[k] ||= []).push(s); return a; }, {})).map(([name, items]) => ({ name, sites: items, ...summarizeSites(items) })).sort((a, b) => b.count - a.count);
}
export function formatWindow(start, hours) { return `${String(start).padStart(2, '0')}.00–${String((start + hours) % 24).padStart(2, '0')}.00${start + hours >= 24 ? ' (+1 hari)' : ''}`; }
export function csvForSites(sites) {
  const headers = ['ID Laporan', 'Ruas Jalan', 'Jenis Kerusakan', 'Keparahan', 'Jumlah Aduan', 'Skor Prioritas', 'Status Triase', 'Penanganan', 'Sumber Dimensi', 'RAB P10 (Rp)', 'RAB Median (Rp)', 'RAB P90 (Rp)', 'Status Jalan', 'Dasar Bukti Status Jalan', 'Penanggung Jawab Jalan', 'Cakupan Segmen', 'Catatan Verifikasi', 'Sumber Kewenangan', 'Tanggal Pemeriksaan Rujukan', 'Lokasi Terverifikasi'];
  const values = sites.map(s => {
    const j = s.jurisdiction || authorityForRoad(s.roadId);
    return [s.id, s.road, s.damage, s.severity, s.reports, s.priority, s.triage, s.treatment, s.dimensionSource, s.cost.p10, s.cost.p50, s.cost.p90, authorityLabel(j), evidenceNames[j.evidence], j.owner, j.scope, j.note, j.sources.map(r => r.url || authoritySource(r.sourceId)?.url).filter(Boolean).join(' | '), authorityRegistry.reviewedAt, j.spatiallyVerified ? 'Ya' : 'Belum; koordinat eksperimen'];
  });
  return '\uFEFF' + [headers, ...values].map(row => row.map(v => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\r\n');
}
