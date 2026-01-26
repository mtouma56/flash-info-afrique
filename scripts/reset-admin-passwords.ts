/**
 * Script to reset all admin user passwords in Supabase Auth
 * Usage: npx tsx scripts/reset-admin-passwords.ts "new_password"
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function resetAllAdminPasswords(newPassword: string) {
  console.log("\n🔐 Starting admin password reset...\n");

  // 1. Get all admin profiles
  const { data: profiles, error: profilesError } = await supabase
    .from("admin_profiles")
    .select("id, username, role");

  if (profilesError) {
    console.error("❌ Error fetching admin profiles:", profilesError.message);
    process.exit(1);
  }

  if (!profiles || profiles.length === 0) {
    console.log("⚠️  No admin profiles found in database");
    process.exit(0);
  }

  console.log(`📋 Found ${profiles.length} admin users to reset:\n`);

  const results: { username: string; success: boolean; error?: string }[] = [];

  // 2. Reset password for each user
  for (const profile of profiles) {
    console.log(`   Processing: ${profile.username} (${profile.role})...`);

    try {
      // Get the auth user to find their email
      const { data: authData, error: authError } = await supabase.auth.admin.getUserById(profile.id);

      if (authError || !authData?.user) {
        console.log(`   ⚠️  ${profile.username}: Auth user not found`);
        results.push({ username: profile.username, success: false, error: "Auth user not found" });
        continue;
      }

      // Update the password
      const { error: updateError } = await supabase.auth.admin.updateUserById(profile.id, {
        password: newPassword,
      });

      if (updateError) {
        console.log(`   ❌ ${profile.username}: Failed - ${updateError.message}`);
        results.push({ username: profile.username, success: false, error: updateError.message });
      } else {
        console.log(`   ✅ ${profile.username}: Password reset successfully`);
        results.push({ username: profile.username, success: true });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.log(`   ❌ ${profile.username}: Error - ${errorMessage}`);
      results.push({ username: profile.username, success: false, error: errorMessage });
    }
  }

  // 3. Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 SUMMARY");
  console.log("=".repeat(50));

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  console.log(`\n   ✅ Successfully reset: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);

  if (successCount > 0) {
    console.log(`\n   🔑 New password for all reset accounts: ${newPassword}`);
    console.log("\n   ⚠️  IMPORTANT: Change these passwords after logging in!");
  }

  if (failCount > 0) {
    console.log("\n   Failed accounts:");
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`      - ${r.username}: ${r.error}`);
      });
  }

  console.log("\n");
}

// Main
const newPassword = process.argv[2];

if (!newPassword) {
  console.error("❌ Usage: npx tsx scripts/reset-admin-passwords.ts <new_password>");
  console.error("   Example: npx tsx scripts/reset-admin-passwords.ts admin123");
  process.exit(1);
}

if (newPassword.length < 6) {
  console.error("❌ Password must be at least 6 characters");
  process.exit(1);
}

resetAllAdminPasswords(newPassword);
