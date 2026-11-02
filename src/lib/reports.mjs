import { number } from './data.mjs';

const clean = value => typeof value === 'string' && value.trim() ? value.trim() : null;
export function reportCoordinates(value) {
  return Array.isArray(value) && value.length === 2 && value.every(Number.isFinite) && Math.abs(value[0]) <= 180 && Math.abs(value[1]) <= 90 ? [...value] : null;
}
export function photoUrl(value) {
  const url = clean(value);
  if (!url) return null;
  if (url.startsWith('/') && !url.startsWith('//') && !url.includes('\\')) return url;
  try { return ['https:', 'http:'].includes(new URL(url).protocol) ? url : null; } catch { return null; }
}
export function attachReportDetails(project, supplement = { reports: [] }) {
  if (!Array.isArray(supplement.reports)) throw Error('Daftar detail aduan harus berupa array reports.');
  const known = new Set(project.reports.map(r => r.id));
  const index = new Map();
  for (const row of supplement.reports) {
    if (!known.has(row.id)) throw Error(`ID detail aduan tidak ditemukan: ${row.id}`);
    if (index.has(row.id)) throw Error(`Detail aduan tercatat dua kali: ${row.id}`);
    index.set(row.id, row);
  }
  return { ...project, reports: project.reports.map(report => {
    const row = index.get(report.id) || {};
    return { ...report, description: clean(row.description), submittedAt: clean(row.submittedAt), channel: clean(row.channel),
      reporter: { name: clean(row.reporter?.name), contact: clean(row.reporter?.contact) },
      location: { address: clean(row.location?.address), district: clean(row.location?.district), subdistrict: clean(row.location?.subdistrict), landmark: clean(row.location?.landmark), coordinates: reportCoordinates(row.location?.coordinates) },
      photos: (Array.isArray(row.photos) ? row.photos : []).map(photo => ({ src:photoUrl(photo.src), caption:clean(photo.caption), capturedAt:clean(photo.capturedAt) })).filter(photo => photo.src),
    };
  }) };
}
export function photosForSite(site, reports = []) {
  const linked = new Set(site.reportIds);
  return reports.filter(report => linked.has(report.id)).flatMap(report => (report.photos || []).map(photo => ({ ...photo, reportId:report.id })));
}
export function mapTooltip(site) { return `${site.road} | ${number(Math.max(0, Math.min(100, site.priority)), 1)}/100`; }
export function reportDate(value) {
  if (!value || !Number.isFinite(new Date(value).getTime())) return 'Belum tersedia';
  return new Intl.DateTimeFormat('id-ID', { dateStyle:'medium', timeStyle:'short', timeZone:'Asia/Jakarta' }).format(new Date(value)) + ' WIB';
}
export function coordinateText(value) { return value ? `${value[1].toFixed(6)}, ${value[0].toFixed(6)}` : 'Belum tersedia'; }
export function osmLocation(value) { return value ? `https://www.openstreetmap.org/?mlat=${value[1]}&mlon=${value[0]}#map=18/${value[1]}/${value[0]}` : null; }
