import React, { useState } from 'react';
import { ChevronDown, Download, Expand } from 'lucide-react';
import { DetailDialog } from './DetailDialog.jsx';
import { PIPELINE_STEPS } from './content/method.mjs';

const wideFigures = new Set(['contoh_degradasi_kamera.png','kurva_pelatihan.png','bpid_sebelum_sesudah.png','overlay_dimensi.png','komposisi_dan_rab_per_ruas.png','pembobotan_dan_prioritas.png','evaluasi_penjadwalan.png','matriks_kelayakan_jadwal.png']);

export function NotebookFigure({ figure }) {
  const [expanded,setExpanded] = useState(false);
  const src = `/figures/${figure.file}`;
  return <><figure className={`notebook-figure ${wideFigures.has(figure.file) ? 'wide' : ''}`}><header><h4>{figure.title}</h4><span>Output notebook</span></header><button className="notebook-figure-image" onClick={() => setExpanded(true)} aria-label={`Perbesar: ${figure.title}`} aria-haspopup="dialog"><img src={src} alt={figure.title} loading="lazy" /><span><Expand size={14} />Perbesar</span></button><figcaption><p>{figure.caption}</p><div><code>{figure.file}</code><a href={src} download><Download size={13} />Unduh gambar</a></div></figcaption></figure>{expanded && <DetailDialog title={figure.title} onClose={() => setExpanded(false)} className="notebook-image-dialog"><img src={src} alt={figure.title} /><p>{figure.caption}</p><a className="button secondary" href={src} download><Download size={14} />Unduh gambar asli</a></DetailDialog>}</>;
}

export function NotebookOutputGallery({ step }) {
  return <div className="notebook-step-body"><p className="notebook-step-method">{step.method}</p><div className="notebook-output-grid">{step.figures.map(figure => <NotebookFigure key={figure.file} figure={figure} />)}</div><p className="notebook-step-note">{step.note}</p></div>;
}

function NotebookStep({ step }) {
  const [open,setOpen] = useState(false);
  return <details className="notebook-step" onToggle={event => setOpen(event.currentTarget.open)}><summary><span className="notebook-step-number">{step.number}</span><div><h3>{step.title}</h3><p>{step.description}</p></div><ChevronDown size={19} /></summary>{open && <NotebookOutputGallery step={step} />}</details>;
}

export function AnalysisPipeline() {
  return <div className="method-content"><div className="method-intro"><span className="eyebrow">DARI FOTO KE RENCANA PERBAIKAN</span><h2>Enam tahap analisis</h2><p>Buka setiap tahap untuk melihat hasil yang disimpan notebook. Gambar dapat diperbesar atau diunduh.</p></div><div className="notebook-pipeline">{PIPELINE_STEPS.map(step => <NotebookStep key={step.id} step={step} />)}</div><p className="method-data-note">Hasil ini berasal dari eksperimen proyek. Petugas tetap memeriksa lokasi, ukuran kerusakan, harga, dan waktu pelaksanaan sebelum pekerjaan dimulai.</p></div>;
}
