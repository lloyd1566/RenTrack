import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://lhuefuonrqfjkjjvrzvh.supabase.co",
  "sb_publishable_NDK9BxpzXjw3xVo42O_TlA_pUZn1Ls4",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function testInsert() {
  const testBuffer = Buffer.from("Hello, this is a test image data!");
  const base64 = Buffer.from(testBuffer).toString("base64");

  console.log("Base64 string:", base64);
  console.log("Base64 length:", base64.length);
  console.log("Has backslash-x:", base64.includes("\\x"));

  const id = `test_upload_${Date.now()}`;
  const { data: insert, error: insertError } = await supabase
    .from("uploads")
    .insert({
      id,
      user_id: "usr_owner_1787198758948",
      type: "avatar",
      data: base64,
      mime_type: "text/plain",
      size: testBuffer.length,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  console.log("Insert:", insertError ? "FAILED: " + insertError.message : "OK");
  if (insertError) return;

  const { data: select, error: selectError } = await supabase
    .from("uploads")
    .select("*")
    .eq("id", id)
    .single();

  console.log("Select:", selectError ? "FAILED: " + selectError.message : "OK");
  if (selectError) return;

  const raw = select.data || "";
  console.log("Retrieved data type:", typeof raw);
  console.log("Retrieved data length:", raw.length);
  console.log("Retrieved data first 100 chars:", raw.slice(0, 100));
  console.log("Has backslash-x:", raw.includes("\\x"));

  const retrieved = Buffer.from(raw, "base64");
  console.log("Match:", retrieved.toString() === testBuffer.toString() ? "YES" : "NO");

  await supabase.from("uploads").delete().eq("id", id);
  console.log("Cleaned up test record");
}

testInsert();
