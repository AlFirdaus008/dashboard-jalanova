import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { parseCsv } from '../src/lib/data.mjs';
import { copyNotebookFigures } from './prepare-figures.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const input = path.join(root, 'output_jalanova');
const output = path.resolve(import.meta.dirname, '../public');
fs.mkdirSync(path.join(output, 'data'), { recursive: true });
fs.mkdirSync(path.join(output, 'figures'), { recursive: true });
const read = name => fs.readFileSync(path.join(input, 'data', name), 'utf8');
const json = name => JSON.parse(read(name));
const csv = name => parseCsv(read(name));
const recap = json('rekap_keputusan_jalanova.json');
const geo = json('sebaran_titik_unik.geojson');
const byId = new Map(geo.features.map(f => [f.properties.report_id, f.geometry.coordinates]));
const notebook = JSON.parse(fs.readFileSync(path.join(root, 'Jalanova_AI.ipynb'), 'utf8'));
const roadNames = {};
for (const o of notebook.cells[88].outputs || []) {
  const html = (o.data?.['text/html'] || []).join('');
  for (const match of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const values = [...match[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map(m => m[1].replace(/<[^>]*>/g, '').trim());
    if (/^SBY-\d+$/.test(values[0]) && values[1]?.startsWith('Jl.')) roadNames[values[0]] = values[1];
  }
}
if (Object.keys(roadNames).length !== 15) throw Error('Could not recover the complete road ID/name mapping from notebook cell 88');
const roadIds = Object.fromEntries(Object.entries(roadNames).map(([id, name]) => [name, id]));
const reports = csv('pemetaan_laporan_ke_titik_unik.csv').map(r => ({ id: r.report_id, siteId: r.id_titik_unik, duplicate: r.is_duplicate_pred === 'True' }));
const reportGroups = Map.groupBy(reports, r => r.siteId);
const sites = recap.map(r => {
  const id = r['ID Laporan'];
  if (!byId.has(id) || !roadIds[r['Ruas Jalan']]) throw Error(`Missing linked geometry or road ID: ${id}`);
  return { id, road: r['Ruas Jalan'], roadId: roadIds[r['Ruas Jalan']], damage: r['Jenis Kerusakan'], severity: r['Tingkat Kerusakan (Prediksi)'], reports: r['Jumlah Aduan'], priority: r['Skor Prioritas'], triage: r['Status Triase'], treatment: r['Jenis Penanganan'], width: r['Lebar (m)'], length: r['Panjang (m)'], area: r['Luas (m2)'], workVolume: r['Volume Kerja'], workUnit: r['Jenis Penanganan'] === 'segel_retak' ? 'm' : 'm²', cost: { p10: r['RAB P10 (Rp)'], p50: r['RAB Median (Rp)'], p90: r['RAB P90 (Rp)'] }, dimensionSource: r['Sumber Dimensi'], weekdayWindow: r['Jadwal Hari Kerja'], weekendWindow: r['Jadwal Akhir Pekan'], coordinates: byId.get(id), reportIds: (reportGroups.get(id) || []).map(r => r.id) };
});
const numericRows = rows => rows.map(r => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v !== '' && Number.isFinite(Number(v)) ? Number(v) : v])));
const schedules = numericRows(csv('jadwal_optimal_per_ruas.csv')).map(r => ({ ...r, roadName: roadNames[r.road_id] }));
const data = { summary: json('ringkasan_analitik.json'), metadata: json('metadata_eksperimen.json'), sites, schedules, reports, roads: Object.entries(roadNames).map(([id, name]) => ({ id, name })), evaluations: { detection: numericRows(csv('evaluasi_deteksi_per_kelompok.csv')), dedup: numericRows(csv('evaluasi_duplikat.csv')), severity: numericRows(csv('evaluasi_keparahan_varian.csv')), robustness: numericRows(csv('evaluasi_ketahanan_degradasi.csv')) }, provenance: { source: 'output_jalanova', locationMode: 'simulated_on_osm', imagePairing: 'class_matched_dataset_examples', roadMapping: 'Jalanova_AI.ipynb, cell 88, saved HTML table', normalizedBy: 'scripts/prepare-data.mjs' } };
fs.writeFileSync(path.join(output, 'data/project.json'), JSON.stringify(data));
fs.copyFileSync(path.join(input, 'data/rekap_keputusan_jalanova.csv'), path.join(output, 'data/rekap_keputusan_jalanova.csv'));
fs.copyFileSync(path.join(input, 'data/sebaran_titik_unik.geojson'), path.join(output, 'data/sebaran_titik_unik.geojson'));

// GeoPackage geometry is a small GP header followed by WKB. The source layer is EPSG:4326 LINESTRING.
function lineString(blob) {
  const b = Buffer.from(blob);
  if (b.toString('ascii', 0, 2) !== 'GP') throw Error('Invalid GeoPackage geometry header');
  const envelope = (b[3] >> 1) & 7;
  let offset = 8 + [0, 32, 48, 48, 64][envelope];
  const little = b[offset++] === 1;
  const uint = () => { const v = little ? b.readUInt32LE(offset) : b.readUInt32BE(offset); offset += 4; return v; };
  const double = () => { const v = little ? b.readDoubleLE(offset) : b.readDoubleBE(offset); offset += 8; return v; };
  const type = uint();
  if (type !== 2) throw Error(`Unsupported WKB geometry ${type}`);
  const count = uint(), coordinates = [];
  for (let i = 0; i < count; i++) coordinates.push([Number(double().toFixed(6)), Number(double().toFixed(6))]);
  return coordinates;
}
const db = new DatabaseSync(path.join(input, 'data/osm_jalan_surabaya.gpkg'), { readOnly: true });
const layer = db.prepare('SELECT table_name, column_name, geometry_type_name, srs_id FROM gpkg_geometry_columns').get();
if (layer.srs_id !== 4326 || layer.geometry_type_name !== 'LINESTRING') throw Error('Unexpected road layer CRS or geometry');
const quoteId = value => '"' + value.replaceAll('"', '""') + '"';
const rows = db.prepare(`SELECT name, highway, ${quoteId(layer.column_name)} AS geom FROM ${quoteId(layer.table_name)}`).all();
const network = { type: 'FeatureCollection', features: rows.map(r => ({ type: 'Feature', properties: { name: r.name, highway: r.highway }, geometry: { type: 'LineString', coordinates: lineString(r.geom) } })) };
db.close();
fs.writeFileSync(path.join(output, 'data/roads.geojson'), JSON.stringify(network));
copyNotebookFigures();
console.log(JSON.stringify({ sites: sites.length, reports: reports.length, roads: Object.keys(roadNames).length, schedules: schedules.length, networkSegments: network.features.length }));
