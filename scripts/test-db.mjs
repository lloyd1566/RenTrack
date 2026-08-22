import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lhuefuonrqfjkjjvrzvh.supabase.co";
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_NDK9BxpzXjw3xVo42O_TlA_pUZn1Ls4";

const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  try {
    const { data, error } = await supabase.from("users").select("*").limit(1);
    if (error) throw error;
    console.log("Supabase connection successful");
    console.log("Sample query result:", data);
  } catch (err) {
    console.error("Connection failed:", err.message || err);
    console.error("Code:", err.code || "unknown");
  }
}

main();
