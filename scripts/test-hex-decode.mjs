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
    console.log("Retrieved length:", raw.length);
    
    // Try hex decoding
    if (raw.startsWith("\\x")) {
      const hex = raw.slice(2);
      console.log("Hex length:", hex.length);
      const decodedBase64 = Buffer.from(hex, "hex").toString("utf-8");
      console.log("Decoded base64:", decodedBase64);
      console.log("Match original:", decodedBase64 === testBase64);
      
      const imageBytes = Buffer.from(decodedBase64, "base64");
      console.log("Image bytes length:", imageBytes.length);
      console.log("First 8 bytes hex:", imageBytes.slice(0, 8).toString("hex"));
      console.log("Is PNG:", imageBytes.slice(0, 8).toString("hex") === "89504e470d0a1a0a");
    }
  }

  await supabase.from("uploads").delete().eq("id", id);
  console.log("Cleaned up");
}

test();
