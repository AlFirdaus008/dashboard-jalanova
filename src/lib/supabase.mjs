import { createClient } from '@supabase/supabase-js';

// The project URL and publishable key are browser-safe. Deployment-specific
// environment variables can override them when both are provided.
const projectSupabaseEnvironment = {
  VITE_SUPABASE_URL: 'https://kfevjvfmbsudfgahxmuj.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_A0fKSGq7rSTADVWphSzo5w_Fe6WF4JA',
};

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
export function projectSupabaseConfiguration(environment = {}) {
  const hasDeploymentConfig = Boolean(environment?.VITE_SUPABASE_URL?.trim() || environment?.VITE_SUPABASE_PUBLISHABLE_KEY?.trim());
  return supabaseConfiguration(hasDeploymentConfig ? environment : projectSupabaseEnvironment);
}
export const supabaseConfig = projectSupabaseConfiguration(import.meta.env);
export const supabase = supabaseConfig.configured ? createClient(supabaseConfig.url,supabaseConfig.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}) : null;
