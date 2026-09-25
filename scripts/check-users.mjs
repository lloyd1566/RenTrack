import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: "./.env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkUsers() {
  const { data, error } = await supabase.schema("public").from("users").select("*");
  if (error) {
    console.log("Error:", error.message);
    return;
  }
  console.log("Users in database:");
  for (const u of data || []) {
    console.log(`- ID: ${u.id}, Email: ${u.email}, Role: ${u.role}, Email verified: ${u.email_verified}`);
  }
}

checkUsers();
