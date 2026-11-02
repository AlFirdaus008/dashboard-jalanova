import React from 'react';
import { ArrowUpRight, MapPin, Navigation } from 'lucide-react';
import { siteDestination } from './lib/location.mjs';
import { coordinateText } from './lib/reports.mjs';

export function LocationShortcut({ site, reports = [], compact = false }) {
  const destination = siteDestination(site,reports);
  const original = destination.source === 'report';
  return <section className={`location-shortcut ${compact ? 'compact' : ''}`} aria-label="Lokasi tujuan perbaikan"><div className="location-shortcut-heading"><MapPin size={17} /><div><h3>Lokasi yang dituju</h3><strong>{site.road}</strong>{destination.address && <p>{destination.address}</p>}
    {destination.coordinates && <p className="destination-coordinates">{coordinateText(destination.coordinates)}</p>}</div></div>
    {destination.url ? <a className="button primary directions-link" href={destination.url} target="_blank" rel="noreferrer"><Navigation size={15} />{original ? 'Petunjuk arah ke lokasi' : 'Pratinjau rute titik proyek'}<ArrowUpRight size={14} /></a> : <p>Lokasi tujuan belum tersedia.</p>}
    <p className="destination-source">{original ? `Tujuan memakai koordinat aduan ${destination.reportId}.` : destination.source === 'project' ? 'Tujuan memakai titik simulasi proyek. Koordinat laporan asli belum tersedia.' : 'Lengkapi koordinat laporan agar rute dapat ditampilkan.'}</p>
    {destination.url && !compact && <small>Rute dibuka di Google Maps. Pilih titik keberangkatan di sana.</small>}
  </section>;
}
