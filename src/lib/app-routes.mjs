export const WORKSPACE_PAGES = ['dashboard','authority','priority','budget','schedule','inbox'];
export const DASHBOARD_MODE_KEY = 'jalanova.dashboard-mode';
export function dashboardHome(profile) {
  return profile?.role === 'stakeholder' ? '#/dashboard' : profile?.role === 'citizen' ? '#/warga' : '#/account';
}
export function parseAppRoute(value = 'about') {
  const [page,query = ''] = value.replace(/^#\/?/,'').split('?');
  if (/^(access_token|error|refresh_token)=/.test(page)) return {page:'about',workspace:false,preview:false};
  const parameters = new URLSearchParams(query);
  return {page:page || 'about',workspace:WORKSPACE_PAGES.includes(page) || (['method','evaluation'].includes(page) && parameters.get('from') === 'dashboard'),preview:parameters.get('preview') === '1'};
}
export function appHref(page,{workspace = false,preview = false} = {}) {
  const parameters = new URLSearchParams();
  if (workspace && ['method','evaluation'].includes(page)) parameters.set('from','dashboard');
  if (preview && page !== 'inbox' && (WORKSPACE_PAGES.includes(page) || parameters.has('from'))) parameters.set('preview','1');
  return `#/${page}${parameters.size ? '?' + parameters : ''}`;
}
