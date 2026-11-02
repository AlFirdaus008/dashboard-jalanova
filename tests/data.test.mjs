import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { filterSites, summarizeSites, groupSites, formatWindow, parseCsv, csvForSites } from '../src/lib/data.mjs';
const project = JSON.parse(fs.readFileSync(new URL('../public/data/project.json', import.meta.url), 'utf8'));
const roads = JSON.parse(fs.readFileSync(new URL('../public/data/roads.geojson', import.meta.url), 'utf8'));

test('exported project preserves all sites, report relations, and map coordinates', () => {
  assert.equal(project.sites.length, 659); assert.equal(project.reports.length, 850);
  assert.equal(new Set(project.sites.map(s => s.id)).size, 659);
  assert.equal(project.sites.reduce((n, s) => n + s.reports, 0), 850);
  for (const s of project.sites) {
    assert.equal(s.reportIds.length, s.reports); assert(s.reportIds.includes(s.id));
    assert(s.coordinates[0] > 112.5 && s.coordinates[0] < 112.95);
    assert(s.coordinates[1] > -7.45 && s.coordinates[1] < -7.1);
    assert(s.cost.p10 <= s.cost.p50 && s.cost.p50 <= s.cost.p90);
  }
  assert.equal(project.reports.filter(r => r.duplicate).length, 191);
});
test('combined filters search Indonesian names and never mutate stored scores', () => {
  const before = JSON.stringify(project.sites);
  const result = filterSites(project.sites, { road: 'Jl. Basuki Rahmat', triage: 'Perlu Penanganan Mendesak', query: 'amblas' });
  assert(result.length > 0);
  assert(result.every(s => s.road === 'Jl. Basuki Rahmat' && s.damage === 'Rutting/Depression' && s.triage.includes('Mendesak')));
  assert.deepEqual(filterSites(project.sites, { query: 'tidak-ada-ruas-ini' }), []);
  assert.equal(filterSites(project.sites, { query: '  LAP-SBY-2026-0640  ' }).length, 1);
  assert.equal(filterSites(project.sites, { source: 'deteksi' }).length, 276);
  assert.equal(JSON.stringify(project.sites), before);
});
test('summary and road aggregation keep sum of site medians separate from total Monte Carlo median', () => {
  const s = summarizeSites(project.sites);
  assert.equal(s.urgent, 132); assert.equal(s.detection, 276); assert.equal(s.reports, 850);
  assert(Math.abs(s.sumMedians - 647842517.518457) < .01);
  assert.notEqual(Math.round(s.sumMedians), project.summary.rab_total_idr.P50);
  const groups = groupSites(project.sites, 'road');
  assert.equal(groups.length, 15);
  assert.equal(groups.reduce((n, g) => n + g.count, 0), 659);
  assert.deepEqual(summarizeSites([]), { count: 0, reports: 0, urgent: 0, sumMedians: 0, detection: 0 });
});
test('all schedules join exact road IDs recovered from saved notebook output', () => {
  assert.equal(project.schedules.length, 30);
  for (const r of project.roads) {
    assert.equal(project.schedules.filter(s => s.road_id === r.id).length, 2);
    for (const s of project.sites.filter(s => s.roadId === r.id)) {
      assert.equal(s.road, r.name);
      assert.equal(project.schedules.find(t => t.road_id === r.id && t.tipe_hari === 'Weekday').jendela_optimal, s.weekdayWindow);
      assert.equal(project.schedules.find(t => t.road_id === r.id && t.tipe_hari === 'Weekend').jendela_optimal, s.weekendWindow);
    }
  }
});
test('schedule comparison reproduces the notebook result for weekdays and handles overnight windows', () => {
  const weekday = project.schedules.filter(s => s.tipe_hari === 'Weekday');
  const before = weekday.reduce((n, s) => n + s.tundaan_08, 0);
  const after = weekday.reduce((n, s) => n + s.tundaan_tambahan_optimal, 0);
  assert.equal(((1 - after / before) * 100).toFixed(1), '89.8');
  assert.equal(formatWindow(20, 5), '20.00–01.00 (+1 hari)');
  assert.equal(formatWindow(9, 2), '09.00–11.00');
  assert.equal(formatWindow(20, 4), '20.00–00.00 (+1 hari)');
});
test('CSV export round trips commas, quotes, multiline text, and Indonesian UTF-8 BOM', () => {
  const sample = [{ ...project.sites[0], road: 'Jalan "A", arah\nTimur' }];
  const rows = parseCsv(csvForSites(sample));
  assert.equal(rows.length, 1); assert.equal(rows[0]['Ruas Jalan'], sample[0].road);
  assert.equal(rows[0]['ID Laporan'], sample[0].id);
  assert.equal(Number(rows[0]['RAB Median (Rp)']), sample[0].cost.p50);
  assert.equal(parseCsv(csvForSites([])).length, 0);
  const blankHeader = parseCsv(',nilai\r\nvarian,0.9\r\n');
  assert.equal(blankHeader[0].varian, 'varian');
});
test('offline road layer has valid line coordinates and preserves exported segment count', () => {
  assert.equal(roads.type, 'FeatureCollection'); assert.equal(roads.features.length, 4748);
  for (const f of roads.features) { assert.equal(f.geometry.type, 'LineString'); assert(f.geometry.coordinates.length >= 2); assert(f.geometry.coordinates.every(p => p.length === 2 && p.every(Number.isFinite))); }
});
