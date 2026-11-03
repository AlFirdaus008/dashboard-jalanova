import React from 'react';
import { number } from './lib/data.mjs';

const qualityNames = { asli:'Foto asli', gerak:'Buram karena gerakan', gelap:'Gelap', terang:'Terlalu terang', blur:'Buram', resolusi:'Foto beresolusi rendah', jpeg:'Berkas foto diperkecil', noise:'Bintik pada foto', warna:'Perubahan warna', kabut:'Kabut' };

export function RobustnessChart({ rows = [] }) {
  const max = Math.max(1,...rows.map(row => row.mAP50));
  return <div className="horizontal-bars">{rows.map(row => <div key={row.degradasi}><div><span>{qualityNames[row.degradasi] || row.degradasi}</span><strong>{number(row.mAP50,3)}</strong></div><div className="bar-rail"><i style={{width:`${row.mAP50 / max * 100}%`,background:row.degradasi === 'gerak' ? '#F7941D' : '#00BFA5'}} /></div></div>)}</div>;
}

export function DimensionSummary({ site }) {
  return <div className="detail-section"><div className="section-mini-title">DIMENSI ESTIMASI <span className={`source-chip ${site.dimensionSource === 'deteksi' ? 'detected' : ''}`}>{site.dimensionSource === 'deteksi' ? 'Deteksi' : 'Imputasi'}</span></div><div className="dimensions-grid"><div><span>Lebar</span><strong>{number(site.width,2)}<small>m</small></strong></div><div><span>Panjang</span><strong>{number(site.length,2)}<small>m</small></strong></div><div><span>Luas</span><strong>{number(site.area,2)}<small>m²</small></strong></div></div></div>;
}
