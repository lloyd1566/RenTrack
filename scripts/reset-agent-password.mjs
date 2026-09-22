// Run this with: node scripts/reset-agent-password.mjs
// Usage: node scripts/reset-agent-password.mjs <email> <new-password>

import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qddnqdhvwmkbsqmzcfnw.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkZG5xZGh2d21rYnNxbXpjZm53Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTQ2MDIwMiwiZXhwIjoyMTA1MDM2MjAyfQ.hHGt6wPA23eumX1P4DtsMDx8NXvnnfaZuMFjCnBaV04";

const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.log("Usage: node scripts/reset-agent-password.mjs <email> <new-password>");
  console.log("Example: node scripts/reset-agent-password.mjs kurtyancy4@gmail.com MyNewPass123");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const hashed = await bcrypt.hash(newPassword, 10);

const { data, error } = await supabase
  .from("users")
  .update({ password: hashed })
  .eq("email", email.toLowerCase())
  .select("id, name, email, role, email_verified");

if (error) {
  console.error("Error:", error.message);
  process.exit(1);
}

if (!data || data.length === 0) {
  console.error(`No user found with email: ${email}`);
  process.exit(1);
}

console.log("✅ Password updated successfully!");
console.log(`   Email: ${data[0].email}`);
console.log(`   Name: ${data[0].name}`);
console.log(`   Role: ${data[0].role}`);
console.log(`   Verified: ${data[0].email_verified}`);
console.log(`\n   You can now login with: ${email} / ${newPassword}`);
