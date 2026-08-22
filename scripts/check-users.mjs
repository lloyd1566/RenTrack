import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://lhuefuonrqfjkjjvrzvh.supabase.co",
  "sb_publishable_NDK9BxpzXjw3xVo42O_TlA_pUZn1Ls4",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkUsers() {
  const { data, error } = await supabase.from("users").select("*");
  if (error) {
    console.log("Error:", error.message);
    return;
  }
  console.log("Users in database:");
  for (const u of data || []) {
    console.log(`- ID: ${u.id}, Email: ${u.email}, Role: ${u.role}, Password starts with: ${u.password?.substring(0, 10)}...`);
  }
}

checkUsers();
