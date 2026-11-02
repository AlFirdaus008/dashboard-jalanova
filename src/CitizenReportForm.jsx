import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Camera, LocateFixed, MapPin, Send } from 'lucide-react';
import { useAuth } from './Auth.jsx';
import { AuthPage, ServiceNotice } from './AccessPages.jsx';
import { supabase } from './lib/supabase.mjs';
import { validateCitizenReport } from './lib/citizen-reports.mjs';
import { friendlyReportError, submitCitizenReport } from './lib/citizen-api.mjs';

function LocationPicker({latitude,longitude,onChange,disabled}) {
  const element = useRef(null), map = useRef(null), marker = useRef(null), change = useRef(onChange);
  change.current = onChange;
  useEffect(() => {
    const instance = L.map(element.current,{scrollWheelZoom:false}).setView([-7.276,112.733],12);map.current=instance;
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{attribution:'&copy; OpenStreetMap &copy; CARTO',maxZoom:19}).addTo(instance);
    const click = event => {if(!disabled)change.current(event.latlng.lat.toFixed(6),event.latlng.lng.toFixed(6));};
    instance.on('click',click);
    return () => {instance.remove();map.current=null;marker.current=null;};
  }, [disabled]);
  useEffect(() => {
    if(!map.current)return;
    const lat=Number(latitude),lng=Number(longitude);
    if(latitude === '' || longitude === '' || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat)>90 || Math.abs(lng)>180){marker.current?.remove();marker.current=null;return;}
    if(!marker.current)marker.current=L.circleMarker([lat,lng],{radius:8,color:'#156553',fillOpacity:.8}).addTo(map.current);
    else marker.current.setLatLng([lat,lng]);
    if(!map.current.getBounds().contains([lat,lng]))map.current.setView([lat,lng],15);
  }, [latitude,longitude,disabled]);
  return <div className="citizen-location-picker"><div className="citizen-location-map" ref={element} role="region" aria-label="Pilih lokasi kerusakan pada peta Surabaya" /><button type="button" disabled={disabled} onClick={() => {const center=map.current.getCenter();onChange(center.lat.toFixed(6),center.lng.toFixed(6));}}><MapPin size={14} />Gunakan titik tengah peta</button></div>;
}

export function CitizenReportForm() {
  const auth = useAuth(), [values,setValues] = useState({roadName:'',address:'',description:'',latitude:'',longitude:'',contact:'',consent:false});
  const [photo,setPhoto] = useState(null), [preview,setPreview] = useState(''), [errors,setErrors] = useState({}), [busy,setBusy] = useState(false), [stage,setStage] = useState(''), [result,setResult] = useState(null), [error,setError] = useState('');
  const submissionId=useRef(null);
  const disabled=!auth.configured || busy;
  useEffect(() => {if(!photo){setPreview('');return;}const url=URL.createObjectURL(photo);setPreview(url);return()=>URL.revokeObjectURL(url);}, [photo]);
  if(auth.loading)return <p>Memeriksa akun…</p>;
  if(auth.configured && (!auth.session || !auth.profile))return <AuthPage />;
  if(auth.profile?.is_demo)return <section className="access-card"><span className="eyebrow">AKUN DEMO</span><h1>Pelaporan menggunakan akun masyarakat</h1><p>Akun contoh ini dipakai untuk meninjau hasil eksperimen. Masuk dengan akun masyarakat untuk mengirim laporan dan memantau penanganannya.</p><a className="button secondary" href="#/account">Buka akun</a></section>;
  const field = (key,value) => setValues(current=>({...current,[key]:value}));
  const position = (lat,lng) => setValues(current=>({...current,latitude:lat,longitude:lng}));
  const gps = () => {
    if(!navigator.geolocation){setError('Lokasi perangkat tidak tersedia. Pilih titik pada peta.');return;}
    navigator.geolocation.getCurrentPosition(result=>position(result.coords.latitude.toFixed(6),result.coords.longitude.toFixed(6)),()=>setError('Lokasi belum dapat dibaca. Pilih titik pada peta atau isi koordinat.'),{enableHighAccuracy:true,timeout:10000,maximumAge:0});
  };
  if(result)return <section className="access-card report-receipt"><span className="eyebrow">LAPORAN DITERIMA JALANOVA</span><h1>Terima kasih sudah melapor.</h1><p>Simpan nomor berikut untuk melihat perkembangan laporan Anda.</p><strong className="report-code">{result.report_code}</strong><p>Laporan masuk ke antrean petugas Jalanova untuk pemeriksaan lokasi dan penanganan. Laporan belum diteruskan otomatis ke layanan pemerintah lain.</p><a className="button primary" href="#/warga">Lihat dashboard saya</a><button className="text-link" onClick={()=>{setResult(null);setPhoto(null);setValues({roadName:'',address:'',description:'',latitude:'',longitude:'',contact:'',consent:false});submissionId.current=null;}}>Buat laporan lain</button></section>;
  return <div className="citizen-report-page"><div className="page-heading"><div><span className="eyebrow">LAPORAN MASYARAKAT</span><h1>Laporkan jalan rusak</h1><p>Foto kerusakan, pastikan titik lokasinya, lalu ceritakan kondisi yang Anda temui.</p></div><a href="#/my-reports" className="button secondary">Laporan saya</a></div>{!auth.configured && <ServiceNotice />}
    <form className="citizen-report-form" onSubmit={async event=>{event.preventDefault();setError('');const validation=validateCitizenReport(values,photo);setErrors(validation);if(Object.keys(validation).length)return;setBusy(true);submissionId.current ||= crypto.randomUUID();try{const report=await submitCitizenReport(supabase,{id:submissionId.current,userId:auth.session.user.id,values,photo,onStage:setStage});setResult(report);}catch(error){setError(friendlyReportError(error));}finally{setBusy(false);setStage('');}}}>
      <fieldset disabled={disabled}><section className="report-form-section"><header><span>01</span><div><h2>Foto kerusakan</h2><p>Ambil foto saat berada di tempat yang aman. Hindari wajah dan nomor kendaraan.</p></div></header><label className="citizen-photo-input"><Camera size={22} /><span>{photo ? photo.name : 'Ambil atau pilih foto'}</span><small>JPG, PNG, atau WebP. Maksimal 5 MB.</small><input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={event=>{setPhoto(event.target.files?.[0] || null);setErrors(current=>({...current,photo:null}));}} aria-label="Foto kerusakan jalan" />{preview && <img src={preview} alt="Pratinjau foto yang akan dilaporkan" />}</label>{errors.photo && <p className="form-error" role="alert">{errors.photo}</p>}</section>
      <section className="report-form-section"><header><span>02</span><div><h2>Lokasi jalan</h2><p>Pilih titik kerusakan pada peta. Lokasi perangkat hanya digunakan saat Anda menekan tombol di bawah.</p></div></header><div className="report-input-grid"><label>Nama jalan<input required maxLength={160} value={values.roadName} onChange={event=>field('roadName',event.target.value)} />{errors.roadName && <small className="form-error">{errors.roadName}</small>}</label><label>Alamat atau patokan<input required minLength={5} maxLength={500} placeholder="Contoh: depan halte, arah menuju…" value={values.address} onChange={event=>field('address',event.target.value)} />{errors.address && <small className="form-error">{errors.address}</small>}</label></div><button type="button" className="button secondary" onClick={gps}><LocateFixed size={15} />Gunakan lokasi perangkat</button><LocationPicker latitude={values.latitude} longitude={values.longitude} onChange={position} disabled={disabled} /><div className="report-input-grid coordinate-inputs"><label>Lintang (latitude)<input inputMode="decimal" placeholder="-7.276000" value={values.latitude} onChange={event=>field('latitude',event.target.value)} required /></label><label>Bujur (longitude)<input inputMode="decimal" placeholder="112.733000" value={values.longitude} onChange={event=>field('longitude',event.target.value)} required /></label></div>{errors.location && <p className="form-error" role="alert">{errors.location}</p>}</section>
      <section className="report-form-section"><header><span>03</span><div><h2>Ceritakan kondisinya</h2><p>Jelaskan bagian yang rusak dan dampaknya bagi pengguna jalan.</p></div></header><label>Keterangan kerusakan<textarea rows={5} required minLength={20} maxLength={2000} value={values.description} onChange={event=>field('description',event.target.value)} />{errors.description && <small className="form-error">{errors.description}</small>}</label><label>Kontak yang bisa dihubungi (opsional)<input maxLength={160} autoComplete="tel" value={values.contact} onChange={event=>field('contact',event.target.value)} /><small>Hanya dapat dilihat oleh Anda dan petugas yang memiliki akses laporan.</small></label><label className="report-consent"><input type="checkbox" checked={values.consent} onChange={event=>field('consent',event.target.checked)} required /><span>Saya menyetujui penggunaan foto, lokasi, dan keterangan ini untuk memeriksa serta menindaklanjuti laporan.</span></label>{errors.consent && <p className="form-error">{errors.consent}</p>}<button className="button primary" type="submit"><Send size={16} />{busy ? stage || 'Mengirim…' : 'Kirim laporan'}</button><p className="report-submission-note">Laporan diperiksa petugas sebelum ditentukan prioritas dan penanganannya.</p></section></fieldset>{error && <p className="form-error" role="alert">{error}</p>}
    </form></div>;
}
