import { reportCoordinates } from './reports.mjs';

export function directionsUrl(coordinates) {
  const point = reportCoordinates(coordinates);
  if (!point) return null;
  const params = new URLSearchParams({ api:'1', destination:`${point[1]},${point[0]}` });
  return `https://www.google.com/maps/dir/?${params}`;
}
export function siteDestination(site, reports = []) {
  const related = new Map(reports.filter(r => r.siteId === site.id && site.reportIds.includes(r.id)).map(r => [r.id,r]));
  const ordered = [site.id,...site.reportIds.filter(id => id !== site.id)];
  for (const id of ordered) {
    const report = related.get(id), coordinates = reportCoordinates(report?.location?.coordinates);
    if (coordinates) return { coordinates, source:'report', reportId:id, address:report.location.address || null, url:directionsUrl(coordinates) };
  }
  const coordinates = reportCoordinates(site.coordinates);
  return { coordinates, source:coordinates ? 'project' : 'missing', reportId:null, address:null, url:directionsUrl(coordinates) };
}
