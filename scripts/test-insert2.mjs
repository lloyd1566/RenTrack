import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://lhuefuonrqfjkjjvrzvh.supabase.co",
  "sb_publishable_NDK9BxpzXjw3xVo42O_TlA_pUZn1Ls4",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function testInsert() {
  console.log("Starting insert test...");
  
  const { data, error } = await supabase.from("users").insert({
    id: `usr_test_${Date.now()}`,
    name: "Test User",
    email: "test@example.com",
    password: "testpassword",
    role: "admin",
    phone: "+63 900 000 0000",
    email_verified: true,
    created_at: new Date().toISOString(),
  });

  console.log("Insert completed");
  console.log("Error:", error);
  console.log("Data:", data);
}

testInsert().catch(e => console.error("Catch:", e));
