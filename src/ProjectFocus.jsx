import React from 'react';
import { ArrowUpRight, Camera, Route, ScanLine } from 'lucide-react';
import { PROJECT_FOCUS } from './content/project.mjs';
import { FeaturePreview } from './FeaturePreview.jsx';

const icons = { authority: Route, weather: Camera, dimensions: ScanLine };

export function ProjectFocus({ detailed = false, data }) {
  return <div className={`purpose-list focus-list ${detailed ? 'focus-detailed' : ''}`}>
    {PROJECT_FOCUS.map(focus => {
      const Icon = icons[focus.id];
      const external = !focus.reference.url.startsWith('#');
      return <article key={focus.id}>
        <span>{focus.number}</span>
        <div className="focus-copy">
          <div className="focus-text">
          <div className="focus-heading"><h3>{focus.title}</h3><span className="focus-phase">{focus.phase}</span></div>
          <p className="focus-problem">{focus.problem}</p>
          <div className="focus-direction"><span>Yang ingin dicapai</span><p>{focus.direction}</p></div>
          <p className="focus-current"><strong>Sudah tersedia.</strong> {focus.current}</p>
          {detailed && <div className="focus-next"><h4>Pengembangan berikutnya</h4><p>{focus.next}</p><a href={focus.reference.url} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined}>{focus.reference.title}<ArrowUpRight size={14} /></a></div>}
          </div>{detailed && <FeaturePreview feature={focus.id} data={data} />}
        </div>
        {!detailed && <Icon size={24} strokeWidth={1.3} />}
      </article>;
    })}
  </div>;
}
