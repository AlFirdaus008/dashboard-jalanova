import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Camera, ShieldCheck } from 'lucide-react';
import { AuthPage } from './AccessPages.jsx';
import { useAuth } from './Auth.jsx';
import { dashboardHome } from './lib/app-routes.mjs';
import './role-gateway.css';

const roles = [
  {id:'citizen',number:'01',title:'Masyarakat',description:'Kirim foto jalan rusak dan lihat perkembangan laporan Anda.',Icon:Camera},
  {id:'staff',number:'02',title:'Petugas dan instansi',description:'Periksa laporan, tentukan tindak lanjut, dan perbarui statusnya.',Icon:ShieldCheck},
];

export function RoleGateway({initialRole = 'citizen',initialMode = 'login',afterLogin}) {
  const {session,profile} = useAuth();
  const [selected,setSelected] = useState(initialRole === 'staff' ? 'staff' : 'citizen');
  useEffect(()=>setSelected(initialRole === 'staff' ? 'staff' : 'citizen'),[initialRole]);
  useEffect(()=>{if(session && profile)location.hash=profile.role==='citizen' && afterLogin ? afterLogin : dashboardHome(profile);},[session?.user.id,profile?.id,profile?.role,afterLogin]);
  return <div className="role-gateway">
    <header className="role-gateway-heading"><span className="eyebrow">AKUN JALANOVA</span><h1>Masuk sesuai kebutuhan Anda.</h1><p>Pilih ruang masyarakat untuk melapor, atau ruang petugas untuk meninjau laporan.</p></header>
    <div className={`role-gateway-grid selected-${selected}`}>
      {roles.map(({id,number,title,description,Icon})=>{
        const active=selected===id;
        return <section key={id} className={`role-panel ${active ? 'active' : 'inactive'}`} aria-label={`Masuk sebagai ${title}`}>
          <button type="button" className="role-panel-toggle" onClick={()=>setSelected(id)} aria-pressed={active} aria-controls={`role-form-${id}`}>
            <span className="role-panel-number">{number}</span><span className="role-panel-title"><Icon size={21} strokeWidth={1.6} /><strong>{title}</strong><small>{description}</small></span><ArrowUpRight size={19} className="role-panel-arrow" />
          </button>
          <div id={`role-form-${id}`} className="role-panel-form" hidden={!active}>
            {active && <AuthPage key={`${id}-${initialMode}`} stakeholder={id==='staff'} initialMode={id==='citizen' ? initialMode : 'login'} />}
          </div>
        </section>;
      })}
    </div>
  </div>;
}
