import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { AuthorityBadge } from './Authority.jsx';
import { DimensionSummary, RobustnessChart } from './AnalysisSummaries.jsx';

export function FeaturePreview({ feature, data }) {
  if (!data) return null;
  const dimensionSite = data.sites.find(site => site.dimensionSource === 'deteksi');
  const roads = ['national','provincial','city'].map(authority => data.roads.find(road => road.jurisdiction?.authority === authority)).filter(Boolean);
  const destination = feature === 'authority' ? '#/authority' : feature === 'weather' ? '#/evaluation' : '#/dashboard';
  return <aside className={`feature-preview feature-preview-${feature}`} aria-label="Cuplikan fitur dashboard"><header><span>CUPLIKAN DASHBOARD</span><h4>{feature === 'authority' ? 'Status dan pengelola ruas' : feature === 'weather' ? 'Hasil uji kualitas foto' : 'Ukuran pada detail titik'}</h4></header>
    <div className="feature-preview-body">{feature === 'authority' && <div className="preview-road-list">{roads.map(road => <div key={road.id}><div><strong>{road.name}</strong><AuthorityBadge jurisdiction={road.jurisdiction} /></div><p>{road.jurisdiction.owner}</p></div>)}</div>}
      {feature === 'weather' && <><RobustnessChart rows={data.evaluations.robustness} /><p className="preview-context">Skor ketepatan deteksi (mAP50) pada perubahan foto buatan. Nilai lebih tinggi berarti lebih baik pada pengujian ini.</p></>}
      {feature === 'dimensions' && dimensionSite && <><div className="preview-site-heading"><strong>{dimensionSite.road}</strong><span>{dimensionSite.id}</span></div><DimensionSummary site={dimensionSite} /><p className="preview-context">Contoh ukuran dari hasil deteksi. Kedalaman lubang belum tersedia.</p></>}
    </div><footer><a href={destination}>{feature === 'authority' ? 'Buka kewenangan jalan' : feature === 'weather' ? 'Buka hasil evaluasi' : 'Buka peta dan detail titik'}<ArrowUpRight size={14} /></a></footer></aside>;
}
