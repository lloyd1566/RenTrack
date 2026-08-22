import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabase = createClient(
  "https://lhuefuonrqfjkjjvrzvh.supabase.co",
  "sb_publishable_NDK9BxpzXjw3xVo42O_TlA_pUZn1Ls4",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function testInsert() {
  const hashed = await bcrypt.hash("test123", 10);
  const { data, error } = await supabase.from("users").insert({
    id: `usr_test_${Date.now()}`,
    name: "Test User",
    email: "test@example.com",
    password: hashed,
    role: "admin",
    phone: "+63 900 000 0000",
    email_verified: true,
    verification_token: null,
    verification_expires_at: null,
    created_at: new Date().toISOString(),
  }).select().single();

  console.log("Insert result:", error ? "FAILED" : "OK");
  if (error) {
    console.log("Error:", error.message);
    console.log("Code:", error.code);
    console.log("Details:", error.details);
    console.log("Hint:", error.hint);
  } else {
    console.log("Inserted user:", data);
  }
}

testInsert();
