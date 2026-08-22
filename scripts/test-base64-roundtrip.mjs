import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://lhuefuonrqfjkjjvrzvh.supabase.co",
  "sb_publishable_NDK9BxpzXjw3xVo42O_TlA_pUZn1Ls4",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function test() {
  const testBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  console.log("Original base64:", testBase64);
  console.log("Original length:", testBase64.length);

  const id = `test_${Date.now()}`;
  const { error: insertError } = await supabase
    .from("uploads")
    .insert({
      id,
      user_id: "usr_owner_1787198758948",
      type: "avatar",
      data: testBase64,
      mime_type: "image/png",
      size: Buffer.from(testBase64, "base64").length,
      created_at: new Date().toISOString()
    });

  console.log("Insert:", insertError ? "FAILED: " + insertError.message : "OK");

  const { data, error: selectError } = await supabase
    .from("uploads")
    .select("data")
    .eq("id", id)
    .single();

  console.log("Select:", selectError ? "FAILED: " + selectError.message : "OK");

  if (data) {
    const raw = data.data || "";
    console.log("Retrieved type:", typeof raw);
    console.log("Retrieved length:", raw.length);
    console.log("Retrieved first 50:", raw.slice(0, 50));
    console.log("Same as original:", raw === testBase64);
    console.log("Has backslash-x:", raw.includes("\\x"));
    console.log("Backslash count:", [...raw].filter(c => c === '\\').length);
  }

  await supabase.from("uploads").delete().eq("id", id);
  console.log("Cleaned up");
}

test();
