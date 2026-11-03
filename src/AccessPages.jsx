import React, { useId, useState } from 'react';
import { ArrowUpRight, Eye, EyeOff, LogOut } from 'lucide-react';
import { useAuth } from './Auth.jsx';
import { supabase } from './lib/supabase.mjs';
import { loginEmail } from './lib/citizen-reports.mjs';
import { DASHBOARD_MODE_KEY } from './lib/app-routes.mjs';
import './access.css';

async function awaitAccountResponse(request) {
  let timer;
  try {
    return await Promise.race([
      request,
      new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('auth-timeout')),15000);}),
    ]);
  } finally { clearTimeout(timer); }
}

export function ServiceNotice() {
  return <div className="access-notice"><h2>Pelaporan belum diaktifkan</h2><p>Pengelola sedang menyiapkan layanan akun dan penyimpanan laporan. Informasi proyek dan pratinjau hasil eksperimen tetap bisa dibuka.</p></div>;
}
export function AccountStrip({preview = false, brand}) {
  const {profile,signOut} = useAuth(), [error,setError] = useState('');
  if (preview && !profile) return <div className="workspace-account"><div className="workspace-account-brand">{brand}</div><div className="workspace-account-actions"><a href="#/account?role=staff" onClick={() => sessionStorage.removeItem(DASHBOARD_MODE_KEY)}>Masuk sebagai petugas<ArrowUpRight size={14} /></a><a href="#/about" onClick={() => sessionStorage.removeItem(DASHBOARD_MODE_KEY)}><LogOut size={14} />Keluar dari dashboard</a></div></div>;
  return <div className="workspace-account"><div className="workspace-account-brand">{brand}</div><div className="workspace-account-actions"><div className="workspace-account-user"><strong>{profile?.role === 'citizen' ? 'Warga' : profile?.role === 'stakeholder' ? 'Petugas' : profile?.full_name}</strong></div><button onClick={async () => {try{await signOut();location.hash='/about';}catch{setError('Belum berhasil keluar. Coba lagi.');}}}><LogOut size={14} />Keluar</button>{error && <p role="alert">{error}</p>}</div></div>;
}
function PasswordInput({label,name,autoComplete,minLength,maxLength = 128,children}) {
  const id=useId(), [visible,setVisible]=useState(false);
  return <div className="access-password-label"><label htmlFor={id}>{label}</label><div className="password-field"><input id={id} type={visible ? 'text' : 'password'} name={name} autoComplete={autoComplete} minLength={minLength} maxLength={maxLength} required /><button type="button" onClick={()=>setVisible(value=>!value)} aria-label={visible ? `Sembunyikan ${label.toLowerCase()}` : `Tampilkan ${label.toLowerCase()}`} aria-pressed={visible} title={visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}>{visible ? <EyeOff size={18} strokeWidth={1.7} /> : <Eye size={18} strokeWidth={1.7} />}</button></div>{children}</div>;
}
export function AuthPage({stakeholder = false, initialMode = 'login'}) {
  const {configured,configError,session,profile,loading,error:profileError,signOut} = useAuth();
  const [mode,setMode] = useState(stakeholder ? 'login' : initialMode), [busy,setBusy] = useState(false), [message,setMessage] = useState(''), [error,setError] = useState('');
  const submit = async event => {
    event.preventDefault();
    if (!configured || busy) { if (!configured) setError('Layanan akun belum terhubung. Periksa konfigurasi Supabase.'); return; }
    setBusy(true);setError('');setMessage('');
    const values = new FormData(event.currentTarget), email = mode === 'login' ? loginEmail(values.get('email')) : values.get('email').trim(), password = values.get('password');
    try {
      const redirect = new URL(location.href);redirect.hash='';redirect.search='';
      if (mode === 'reset') {
        redirect.search='flow=recovery';
        const {error}=await awaitAccountResponse(supabase.auth.resetPasswordForEmail(email,{redirectTo:redirect.href}));if(error)throw error;
        setMessage('Jika email terdaftar, petunjuk penggantian kata sandi akan dikirim. Periksa kotak masuk dan spam.');
      } else if (mode === 'register') {
        const {data,error}=await awaitAccountResponse(supabase.auth.signUp({email,password,options:{data:{full_name:values.get('name').trim()},emailRedirectTo:redirect.href}}));if(error)throw error;
        setMessage(data.session ? 'Akun berhasil dibuat.' : 'Periksa email untuk konfirmasi akun, lalu masuk kembali ke Jalanova.');
      } else {
        const {error}=await awaitAccountResponse(supabase.auth.signInWithPassword({email,password}));if(error)throw error;
      }
    } catch (failure) {setError(failure?.message === 'auth-timeout' ? 'Layanan akun belum merespons. Periksa koneksi lalu coba lagi.' : mode === 'login' ? 'Belum berhasil masuk. Periksa email, kata sandi, dan konfirmasi email Anda.' : 'Permintaan belum berhasil. Periksa koneksi atau coba lagi nanti.');}
    finally {setBusy(false);}
  };
  if (loading) return <div className="access-card"><p>Memeriksa akun…</p></div>;
  if (session && profile) return <section className="access-card"><span className="eyebrow">AKUN JALANOVA</span><h1>{profile.full_name}</h1><p>{profile.role === 'stakeholder' ? (profile.agency && profile.agency !== 'Petugas demonstrasi Jalanova' ? profile.agency : 'Pemangku kepentingan') : 'Masyarakat'}</p><div className="access-actions"><a className="button primary" href={profile.role === 'stakeholder' ? '#/dashboard' : '#/warga'}>Buka dashboard</a>{profile.role === 'citizen' && <a className="button secondary" href="#/report">Buat laporan</a>}<button className="text-link" onClick={() => signOut().catch(() => setError('Belum berhasil keluar. Coba lagi.'))}>Keluar dari akun</button></div>{error && <p role="alert">{error}</p>}</section>;
  return <section className="access-card"><span className="eyebrow">{stakeholder ? 'UNTUK PEMANGKU KEPENTINGAN' : 'AKUN MASYARAKAT'}</span><h1>{mode === 'register' ? 'Daftar untuk melaporkan jalan rusak' : mode === 'reset' ? 'Atur ulang kata sandi' : stakeholder ? 'Masuk ke ruang petugas' : 'Masuk ke Jalanova'}</h1><p>{stakeholder ? 'Masuk untuk memeriksa laporan warga dan mencatat tindak lanjutnya.' : 'Gunakan akun untuk mengirim foto, menyimpan nomor laporan, dan melihat perkembangannya.'}</p>
    {!configured && <ServiceNotice />}{(configError || profileError) && <p className="form-error" role="alert">{configError || profileError}</p>}
    <form className="access-form" onSubmit={submit} aria-busy={busy}><fieldset>
      {mode === 'register' && <label>Nama lengkap<input name="name" autoComplete="name" required maxLength={120} /></label>}
      <label>{mode === 'login' ? 'Email atau nama pengguna' : 'Email'}<input type={mode === 'login' ? 'text' : 'email'} name="email" autoComplete={mode === 'login' ? 'username' : 'email'} required maxLength={254} /></label>
      {mode !== 'reset' && <PasswordInput label="Kata sandi" name="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} minLength={mode === 'register' ? 10 : undefined}>{mode === 'register' && <small>Minimal 10 karakter. Gunakan kata sandi yang berbeda dari akun lain.</small>}</PasswordInput>}
      <button className="button primary" type="submit" disabled={!configured || busy}>{busy ? 'Memproses…' : mode === 'register' ? 'Daftar' : mode === 'reset' ? 'Kirim petunjuk' : 'Masuk'}</button>
    </fieldset></form>{message && <p className="form-success" role="status">{message}</p>}{error && <p className="form-error" role="alert">{error}</p>}
    <div className="access-links">{!stakeholder && <button onClick={() => {setMode(mode === 'register' ? 'login' : 'register');setError('');setMessage('');}}>{mode === 'register' ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar'}</button>}<button onClick={() => {setMode(mode === 'reset' ? 'login' : 'reset');setError('');setMessage('');}}>{mode === 'reset' ? 'Kembali ke masuk' : 'Lupa kata sandi?'}</button></div>
    {session && !profile && <button className="preview-entry" onClick={()=>signOut().catch(()=>setError('Belum berhasil keluar. Coba lagi.'))}>Keluar dan masuk kembali</button>}
    {stakeholder && <a className="preview-entry" href="#/dashboard?preview=1">Lihat pratinjau hasil eksperimen<ArrowUpRight size={14} /></a>}
  </section>;
}
export function ResetPasswordPage() {
  const {configured,session,loading} = useAuth(), [busy,setBusy] = useState(false), [message,setMessage] = useState('');
  return <section className="access-card"><h1>Kata sandi baru</h1><p>Buka tautan dari email pemulihan untuk melanjutkan.</p><form className="access-form" onSubmit={async event => {event.preventDefault();const fields=new FormData(event.currentTarget);if(fields.get('password') !== fields.get('confirm')){setMessage('Kedua kata sandi belum sama.');return;}setBusy(true);try{const {error}=await supabase.auth.updateUser({password:fields.get('password')});if(error)throw error;setMessage('Kata sandi sudah diperbarui. Anda dapat melanjutkan melalui halaman akun.');}catch{setMessage('Belum berhasil mengganti kata sandi. Buka kembali tautan pemulihan yang terbaru.');}finally{setBusy(false);}}}><fieldset disabled={!configured || !session || loading || busy}><PasswordInput label="Kata sandi baru" name="password" minLength={10} autoComplete="new-password" /><PasswordInput label="Ulangi kata sandi" name="confirm" minLength={10} autoComplete="new-password" /><button className="button primary">Simpan kata sandi</button></fieldset></form>{message && <p role="status">{message}</p>}<a className="text-link" href="#/account">Buka halaman akun</a></section>;
}
