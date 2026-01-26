// Supabase client for client-side operations
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Warning: Supabase credentials not found in environment variables");
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/a1d61db1-cb31-40e2-8e3d-081974469abb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabase.ts:8',message:'Supabase config missing',data:{hasUrl:!!supabaseUrl,hasKey:!!supabaseAnonKey},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  }
  // #endregion
}

// #region agent log
if (typeof window !== 'undefined') {
  fetch('http://127.0.0.1:7242/ingest/a1d61db1-cb31-40e2-8e3d-081974469abb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabase.ts:11',message:'Supabase client created',data:{hasUrl:!!supabaseUrl,urlLength:supabaseUrl.length,hasKey:!!supabaseAnonKey,keyLength:supabaseAnonKey.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
}
// #endregion

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
