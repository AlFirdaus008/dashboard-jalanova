import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, supabaseConfig } from './lib/supabase.mjs';
import { DASHBOARD_MODE_KEY } from './lib/app-routes.mjs';

export const AuthContext = createContext({configured:false,loading:false,session:null,profile:null});
export function AuthProvider({children}) {
  const [session,setSession] = useState(null), [profile,setProfile] = useState(null);
  const [initializing,setInitializing] = useState(Boolean(supabase)), [profileLoading,setProfileLoading] = useState(false), [error,setError] = useState('');
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const {data:{subscription}} = supabase.auth.onAuthStateChange((event,next) => {if(active){setSession(next);setInitializing(false);if(event === 'PASSWORD_RECOVERY') location.hash='/reset-password';}});
    supabase.auth.getSession().then(({data,error}) => {if(active){if(error)setError('Sesi akun belum dapat dibaca. Silakan masuk kembali.');setSession(data.session);setInitializing(false);}}).catch(() => {if(active){setError('Layanan akun belum dapat dihubungi.');setInitializing(false);}});
    return () => {active=false;subscription.unsubscribe();};
  }, []);
  useEffect(() => {
    setProfile(null); setError('');
    if (!session || !supabase) {setProfileLoading(false);return;}
    let active = true; setProfileLoading(true);
    supabase.from('profiles').select('id,full_name,role,agency,is_demo').eq('id',session.user.id).single().then(({data,error}) => {if(active){setProfile(data);setError(error ? 'Profil belum dapat dibaca. Coba masuk kembali atau hubungi pengelola.' : '');setProfileLoading(false);}}).catch(() => {if(active){setError('Profil belum dapat dimuat.');setProfileLoading(false);}});
    return () => {active=false;};
  }, [session?.user.id,session?.access_token]);
  const activeProfile=profile?.id === session?.user.id ? profile : null;
  return <AuthContext.Provider value={{configured:supabaseConfig.configured,configError:supabaseConfig.error,session,profile:activeProfile,error,loading:initializing || profileLoading || Boolean(session && !activeProfile && !error),signOut:async () => {const {error}=await supabase.auth.signOut();if(error)throw error;sessionStorage.removeItem(DASHBOARD_MODE_KEY);}}}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
