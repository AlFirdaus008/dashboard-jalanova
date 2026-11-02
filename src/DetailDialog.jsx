import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export function DetailDialog({ title, subtitle, onClose, children, className = '' }) {
  const panel = useRef(null), headingId = useId();
  const close = useRef(onClose); close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement, overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.querySelector('button')?.focus();
    const key = event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); close.current(); return; }
      if (event.key !== 'Tab') return;
      const items = [...panel.current.querySelectorAll('button:not([disabled]),a[href],input,select,textarea,[tabindex="0"]')];
      const first = items[0], last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown',key,true);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown',key,true); if (previous?.isConnected) previous.focus({ preventScroll:true }); };
  }, []);
  return createPortal(<div className={`record-dialog-backdrop ${className}`} onClick={event => { event.stopPropagation(); onClose(); }}><section ref={panel} role="dialog" aria-modal="true" aria-labelledby={headingId} className="record-dialog" onClick={event => event.stopPropagation()}><header><div>{subtitle && <p>{subtitle}</p>}<h2 id={headingId}>{title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Tutup detail"><X size={20} /></button></header><div className="record-dialog-body">{children}</div></section></div>, document.body);
}
