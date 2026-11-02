import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';
import { EXPERIMENT_DESCRIPTION, PROJECT_DOCUMENTATION_URL } from './content/navigation.mjs';
import './experiment-note.css';

export function ExperimentNote({ compact = false }) {
  const [hovered,setHovered] = useState(false), [focused,setFocused] = useState(false), [position,setPosition] = useState(null);
  const trigger = useRef(null), tooltip = useRef(null), id = useId();
  const open = hovered || focused;
  useLayoutEffect(() => {
    if (!open) { setPosition(null); return; }
    const anchor = trigger.current.getBoundingClientRect(), box = tooltip.current.getBoundingClientRect();
    setPosition({ left:Math.max(12,Math.min(anchor.left,window.innerWidth-box.width-12)), top:Math.max(12,Math.min(anchor.top-box.height-10,window.innerHeight-box.height-12)) });
  }, [open,compact]);
  const hide = () => { setHovered(false); setFocused(false); setPosition(null); };
  useEffect(() => {
    if (!open) return;
    const outside = event => { if (!trigger.current?.contains(event.target)) hide(); };
    window.addEventListener('resize',hide);
    window.addEventListener('scroll',hide,true);
    document.addEventListener('pointerdown',outside);
    return () => { window.removeEventListener('resize',hide); window.removeEventListener('scroll',hide,true); document.removeEventListener('pointerdown',outside); };
  }, [open]);
  return <div className={`experiment-note experiment-note-help ${compact ? 'compact' : ''}`}>
    <button ref={trigger} className="experiment-note-trigger" aria-label="Data eksperimen" aria-describedby={open ? id : undefined} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onClick={() => setFocused(true)} onKeyDown={event => { if (event.key === 'Escape' && open) { event.stopPropagation(); hide(); } }}><Info size={18} strokeWidth={1.6} /><span className="experiment-note-label">Data eksperimen</span></button>
    <div className="analysis-document-slot">
    {PROJECT_DOCUMENTATION_URL ? <a className="analysis-document-link" href={PROJECT_DOCUMENTATION_URL} target="_blank" rel="noreferrer">Document Analysis Jalanova</a> : <span className="analysis-document-link pending" aria-disabled="true" title="Tautan GitHub belum ditambahkan">Document Analysis Jalanova</span>}
  </div>{open && createPortal(<div ref={tooltip} id={id} role="tooltip" className="experiment-context-tooltip" style={{ left:position?.left || 0, top:position?.top || 0, visibility:position ? 'visible' : 'hidden' }}>{EXPERIMENT_DESCRIPTION}</div>,document.body)}</div>;
}
