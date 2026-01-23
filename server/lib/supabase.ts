// Supabase client for server-side operations
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Validate Supabase credentials
function validateSupabaseConfig() {
  const isProduction = process.env.NODE_ENV === "production";
  const missing: string[] = [];

  if (!supabaseUrl) missing.push("SUPABASE_URL");
  if (!supabaseAnonKey) missing.push("SUPABASE_ANON_KEY");
  if (!supabaseServiceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");

  if (missing.length > 0) {
    const message = `Missing required Supabase environment variables: ${missing.join(", ")}`;
    
    if (isProduction) {
      // In production, fail hard
      console.error(`❌ ${message}`);
      console.error("Application cannot start without Supabase configuration.");
      process.exit(1);
    } else {
      // In development, warn but continue
      console.warn(`⚠️  ${message}`);
      console.warn("Some features may not work correctly.");
    }
  }
}

// Validate on module load
validateSupabaseConfig();

// Public client (respects RLS policies)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client (bypasses RLS, use with caution)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export default supabase;
