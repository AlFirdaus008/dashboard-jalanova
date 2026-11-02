import React, { useEffect, useRef, useState } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { CompetitionBadge } from './Competition.jsx';
import { ExperimentNote } from './ExperimentNote.jsx';

export function Sidebar({ items, route, open, close, onNavigate, onToggle, showContext = true, hrefFor = id => `#/${id}` }) {
  const panel = useRef(null);
  const ToggleIcon = open ? PanelLeftClose : PanelLeftOpen;
  const [mobile,setMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width:700px)').matches);
  useEffect(() => {
    const media = window.matchMedia('(max-width:700px)');
    const change = () => setMobile(media.matches);
    media.addEventListener('change',change);
    return () => media.removeEventListener('change',change);
  }, []);
  useEffect(() => {
    if (!open || !mobile) return;
    const previousFocus = document.activeElement, previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.querySelector('button')?.focus();
    const trap = event => {
      if (event.key !== 'Tab') return;
      const elements = [...panel.current.querySelectorAll('a[href],button:not([disabled])')];
      const first = elements[0], last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown',trap);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown',trap); if (previousFocus?.isConnected) previousFocus.focus({preventScroll:true}); };
  }, [open,mobile]);
  const link = ([id,label,Icon]) => <a key={id} href={hrefFor(id)} onClick={onNavigate} className={route === id ? 'active' : ''} aria-label={label} aria-current={route === id ? 'page' : undefined} title={!open ? label : undefined}><Icon size={18} strokeWidth={1.6} /><span className="sidebar-link-label">{label}</span></a>;
  return <><div className={`sidebar-scrim ${open ? 'visible' : ''}`} onClick={close} aria-hidden="true" /><aside ref={panel} className={`sidebar ${open ? 'open' : ''}`} aria-label="Navigasi dashboard"><div className="sidebar-controls"><button id="navigation-toggle" className="navigation-toggle" onClick={onToggle} aria-expanded={open} aria-controls="dashboard-navigation" aria-label={open ? 'Ringkas navigasi' : 'Perluas navigasi'} title={open ? 'Ringkas navigasi' : 'Perluas navigasi'}><ToggleIcon size={18} strokeWidth={1.6} /></button></div><div id="dashboard-navigation" className="sidebar-menu-content"><nav aria-label="Navigasi dashboard">{items.filter(([id]) => id !== 'evaluation').map(link)}</nav>{showContext && <div className="sidebar-bottom"><ExperimentNote compact={!open} /><CompetitionBadge compact={!open} /></div>}</div></aside></>;
}
