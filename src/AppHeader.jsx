import React from 'react';
import { PROJECT_NAVIGATION } from './content/navigation.mjs';
import { appHref } from './lib/app-routes.mjs';
import { dashboardHome } from './lib/app-routes.mjs';
import { useAuth } from './Auth.jsx';

export function AppHeader({ route = 'about', brand, onNavigate, workspace = false, preview = false }) {
  const { profile } = useAuth();
  const dashboardActive = workspace || ['warga','dashboard','authority','priority','budget','schedule','inbox'].includes(route);
  return <header className="site-header" onClick={event => { if (event.target.closest?.('a')) onNavigate?.(); }}><div className="site-header-inner">
    <div className="site-header-brand">{brand}</div>
    <nav className="project-navigation" aria-label="Navigasi utama proyek">{PROJECT_NAVIGATION.map(item => <a key={item.id} href={appHref(item.id,{workspace,preview})} className={route === item.id ? 'active' : ''} aria-current={route === item.id ? 'page' : undefined}>{item.label}</a>)}</nav>
    <div className="site-header-actions"><a href={dashboardHome(profile)} className={`site-dashboard-link ${dashboardActive ? 'active' : ''}`} aria-current={['dashboard','warga'].includes(route) ? 'page' : undefined}>Dashboard</a><span className="site-location">Surabaya, Jawa Timur, Indonesia</span></div>
  </div></header>;
}
