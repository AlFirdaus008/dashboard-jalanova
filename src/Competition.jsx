import React from 'react';
import './competition.css';

export const COMPETITION_URL = 'https://brida.surabaya.go.id/program/inovboyo';
const identities = [
  { id:'city', src:'/pemkotsurabaya.svg', name:'Pemerintah Kota Surabaya', alt:'Lambang Pemerintah Kota Surabaya', url:'https://www.surabaya.go.id/' },
  { id:'brida', src:'/bridasby.svg', name:'BRIDA Kota Surabaya', alt:'Logo Badan Riset dan Inovasi Daerah Kota Surabaya', url:'https://brida.surabaya.go.id/' },
  { id:'inovboyo', src:'/inovboyo.svg', name:'INOVBOYO 2.0', alt:'Maskot INOVBOYO 2.0', url:COMPETITION_URL },
];

export function CompetitionSection() {
  return <section className="competition-section" id="keikutsertaan-kompetisi" aria-labelledby="competition-heading"><div className="competition-copy"><span className="eyebrow">KEIKUTSERTAAN KOMPETISI</span><h2 id="competition-heading">Jalanova untuk<br />INOVBOYO 2.0.</h2><p>Jalanova dikembangkan untuk diikutsertakan dalam INOVBOYO 2.0, kompetisi inovasi yang diselenggarakan Pemerintah Kota Surabaya melalui BRIDA Kota Surabaya.</p><p>Proyek ini mengangkat pengolahan aduan dan citra jalan untuk membantu perencanaan perbaikan di Surabaya.</p><a href={COMPETITION_URL} target="_blank" rel="noreferrer">INOVBOYO 2.0</a></div><div className="competition-identities" aria-label="Identitas penyelenggara dan kompetisi">{identities.map(identity => <a key={identity.id} className={`competition-identity competition-${identity.id}`} href={identity.url} target="_blank" rel="noreferrer"><div className="competition-mark"><img src={identity.src} width="1080" height="1080" alt={identity.alt} loading="lazy" /></div><span>{identity.name}</span></a>)}</div></section>;
}

export function CompetitionBadge({ compact = false }) {
  return <a className={`sidebar-competition ${compact ? 'compact' : ''}`} href={COMPETITION_URL} target="_blank" rel="noreferrer" aria-label="Informasi kompetisi INOVBOYO 2.0" title="Proyek untuk keikutsertaan INOVBOYO 2.0"><span className="sidebar-competition-mark"><img src="/inovboyo.svg" width="1080" height="1080" alt="" /></span><span className="sidebar-competition-copy"><strong>INOVBOYO 2.0</strong><small>Keikutsertaan kompetisi</small></span></a>;
}
