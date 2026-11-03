import registry from '../content/road-authorities.json' with { type: 'json' };

export const authorityRegistry = registry;
export const authorityNames = { national: 'Nasional', provincial: 'Provinsi', city: 'Kota' };
export const evidenceNames = { document: 'Dokumen resmi', planning: 'Dokumen perencanaan', report: 'Keterangan resmi', historical: 'Rujukan historis' };
export const authorityColors = { national: '#012A44', provincial: '#F7941D', city: '#00BFA5' };

export function authorityForRoad(roadId) {
  const road = registry.roads.find(r => r.roadId === roadId);
  if (!road || !Object.hasOwn(authorityNames, road.authority)) throw new Error(`Status jalan untuk ruas ${roadId} belum dikonfigurasi.`);
  return road;
}
export function attachAuthorities(project) {
  return { ...project, roads: project.roads.map(r => ({ ...r, jurisdiction: authorityForRoad(r.id) })), sites: project.sites.map(s => ({ ...s, jurisdiction: authorityForRoad(s.roadId) })) };
}
export function authorityLabel(jurisdiction) {
  return authorityNames[jurisdiction?.authority] || '—';
}
export function authoritySource(id) { return registry.sources.find(s => s.id === id); }
export function groupAuthorities(sites) {
  return Object.entries(authorityNames).map(([key, name]) => {
    const items = sites.filter(s => (s.jurisdiction || authorityForRoad(s.roadId)).authority === key);
    return { key, name, count: items.length, roads: new Set(items.map(s => s.roadId)).size, urgent: items.filter(s => s.triage === 'Perlu Penanganan Mendesak').length, sumMedians: items.reduce((n, s) => n + s.cost.p50, 0) };
  });
}
