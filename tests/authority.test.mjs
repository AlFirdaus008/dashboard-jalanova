import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { attachAuthorities, authorityForRoad, authorityRegistry, authoritySource, authorityLabel, authorityNames, groupAuthorities } from '../src/lib/authority.mjs';
import { filterSites, summarizeSites, csvForSites, parseCsv } from '../src/lib/data.mjs';
const original = JSON.parse(fs.readFileSync(new URL('../public/data/project.json', import.meta.url), 'utf8'));
const project = attachAuthorities(original);

test('registry covers each notebook road exactly once, without inferring jurisdiction from simulated coordinates', () => {
  assert.equal(authorityRegistry.roads.length, 15);
  assert.deepEqual(authorityRegistry.roads.map(r => r.roadId).sort(), original.roads.map(r => r.id).sort());
  for (const s of project.sites) {
    assert.equal(s.jurisdiction.roadId, s.roadId);
    assert.equal(s.jurisdiction.spatiallyVerified, false);
    assert.deepEqual(s.coordinates, original.sites.find(o => o.id === s.id).coordinates);
    assert.equal(s.priority, original.sites.find(o => o.id === s.id).priority);
  }
  assert.equal(original.sites[0].jurisdiction, undefined);
  assert.deepEqual(summarizeSites(project.sites), summarizeSites(original.sites));
  assert.throws(() => authorityForRoad('unregistered-road'), /belum dikonfigurasi/);
});

test('all roads use exactly the three requested status categories with segment notes kept separately', () => {
  assert.deepEqual(Object.values(authorityNames), ['Nasional', 'Provinsi', 'Kota']);
  assert.equal(authorityForRoad('SBY-01').authority, 'national');
  assert.equal(authorityForRoad('SBY-07').authority, 'national');
  assert.equal(authorityForRoad('SBY-13').authority, 'national');
  assert.equal(authorityForRoad('SBY-13').aliasNeedsReview, false);
  assert.equal(authorityForRoad('SBY-09').authority, 'provincial');
  assert.equal(authorityRegistry.roads.filter(r => r.authority === 'city').length, 11);
  assert.equal(authorityLabel(authorityForRoad('SBY-11')), 'Kota');
  assert.equal(authorityLabel(authorityForRoad('SBY-01')), 'Nasional');
  assert(authorityForRoad('SBY-07').note.includes('batas segmen'));
  assert.equal(authorityRegistry.roads.filter(r => r.authority === 'national').length, 3);
});

test('every road has traceable official evidence, location notes, and explicitly limited spatial certainty', () => {
  const sourceIds = new Set(authorityRegistry.sources.map(s => s.id));
  assert.equal(sourceIds.size, authorityRegistry.sources.length);
  for (const r of authorityRegistry.roads) {
    assert(r.scope.length > 30 && r.note.length > 30 && r.sources.length > 0);
    for (const ref of r.sources) {
      assert(sourceIds.has(ref.sourceId));
      assert(ref.locator);
      assert(new URL(ref.url || authoritySource(ref.sourceId).url).hostname.endsWith('.go.id'));
    }
  }
  assert(authorityForRoad('SBY-07').sources.some(s => s.sourceId === 'national-status-2022' && s.url.endsWith('#page=64')));
});

test('authority filtering combines with priority, search and road filters and keeps original scores', () => {
  const before = JSON.stringify(project.sites);
  const rows = filterSites(project.sites, { authority: 'city', triage: 'Perlu Penanganan Mendesak' });
  assert(rows.length > 0);
  assert(rows.every(s => s.jurisdiction.authority === 'city' && s.triage.includes('Mendesak')));
  assert.equal(filterSites(project.sites, { authority: 'city', road: 'Jl. Mastrip' }).length, 0);
  assert(filterSites(project.sites, { authority: 'provincial', query: 'Mastrip' }).length > 0);
  assert.equal(filterSites(project.sites, { authority: '' }).length, 659);
  for (const status of Object.keys(authorityNames)) {
    const filtered = filterSites(project.sites, { authority: status });
    assert(filtered.length > 0);
    assert(filtered.every(s => s.jurisdiction.authority === status));
  }
  assert.deepEqual([...new Set(filterSites(project.sites, { authority: 'national' }).map(s => s.roadId))].sort(), ['SBY-01', 'SBY-07', 'SBY-13']);
  assert(filterSites(project.sites, { query: 'Pemprov' }).every(s => s.roadId === 'SBY-09'));
  assert.equal(JSON.stringify(project.sites), before);
});

test('three status groups partition every experimental site and cost', () => {
  const groups = groupAuthorities(project.sites);
  assert.equal(groups.length, 3);
  assert.equal(groups.reduce((n, g) => n + g.count, 0), 659);
  assert.equal(groups.reduce((n, g) => n + g.roads, 0), 15);
  assert.equal(groups.reduce((n, g) => n + g.urgent, 0), 132);
  assert(Math.abs(groups.reduce((n, g) => n + g.sumMedians, 0) - summarizeSites(project.sites).sumMedians) < .01);
  assert.equal(groups.find(g => g.key === 'national').count, project.sites.filter(s => ['SBY-01', 'SBY-07', 'SBY-13'].includes(s.roadId)).length);
  assert(groupAuthorities([]).every(g => g.count === 0 && g.sumMedians === 0));
});

test('CSV keeps uncertainty and provenance beside exported authority labels', () => {
  const sample = project.sites.filter(s => ['SBY-01', 'SBY-07', 'SBY-09', 'SBY-13'].includes(s.roadId));
  const rows = parseCsv(csvForSites(sample));
  assert.equal(rows.length, sample.length);
  rows.forEach((row, i) => {
    assert.equal(row['Status Jalan'], authorityLabel(sample[i].jurisdiction));
    assert.equal(row['Tanggal Pemeriksaan Rujukan'], '2026-11-01');
    assert.equal(row['Lokasi Terverifikasi'], 'Belum; koordinat eksperimen');
    assert(row['Sumber Kewenangan'].includes('https://'));
    assert(row['Catatan Verifikasi']);
    assert.equal(Number(row['Skor Prioritas']), sample[i].priority);
  });
});
