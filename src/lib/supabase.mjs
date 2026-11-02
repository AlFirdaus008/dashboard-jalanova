import { createClient } from '@supabase/supabase-js';

export function supabaseConfiguration(environment = {}) {
  const url = environment.VITE_SUPABASE_URL?.trim(), key = environment.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key) return {configured:false,error:null};
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.pathname !== '/' || parsed.username || parsed.password) throw Error();
    if (!key.startsWith('sb_publishable_')) throw Error();
    return {configured:true,url:parsed.origin,key,error:null};
  } catch { return {configured:false,error:'Konfigurasi Supabase belum sesuai. Gunakan Project URL dan publishable key.'}; }
}
export const supabaseConfig = supabaseConfiguration(import.meta.env);
export const supabase = supabaseConfig.configured ? createClient(supabaseConfig.url,supabaseConfig.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}) : null;
