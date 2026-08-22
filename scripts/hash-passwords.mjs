import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

dotenv.config({ path: "./.env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lhuefuonrqfjkjjvrzvh.supabase.co";
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_NDK9BxpzXjw3xVo42O_TlA_pUZn1Ls4";

const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function looksHashed(pw) {
  return typeof pw === "string" && (pw.startsWith("$2a$") || pw.startsWith("$2b$") || pw.startsWith("$2y$"));
}

async function run() {
  console.log("Fetching users...");
  const { data: users, error } = await supabase.from("users").select("id, email, password");
  if (error) {
    console.error("Failed to fetch users:", error.message);
    process.exit(1);
  }

  let updated = 0;
  for (const u of users || []) {
    if (!u.password) continue;
    if (looksHashed(u.password)) continue;
    const newHash = await bcrypt.hash(String(u.password), 10);
    const { error: updateError } = await supabase.from("users").update({ password: newHash }).eq("id", u.id);
    if (updateError) {
      console.error(`Failed to update password for ${u.email}:`, updateError.message);
      continue;
    }
    console.log(`Hashed password for ${u.email}`);
    updated++;
  }
  console.log(`Done. Updated ${updated} users.`);
  process.exit(0);
}

run().catch((err) => { console.error(err); process.exit(2); });
