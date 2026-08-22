import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://lhuefuonrqfjkjjvrzvh.supabase.co",
  "sb_publishable_NDK9BxpzXjw3xVo42O_TlA_pUZn1Ls4",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function testBytea() {
  const testBuffer = Buffer.from("Hello, this is a test!");
  const base64 = testBuffer.toString('base64');
  
  const { data: insert, error: insertError } = await supabase
    .from('uploads')
    .insert({
      id: `test_${Date.now()}`,
      user_id: 'test_user',
      type: 'avatar',
      data: base64,
      mime_type: 'text/plain',
      size: testBuffer.length,
      created_at: new Date().toISOString()
    })
    .select()
    .single();
  
  console.log('Insert:', insertError ? 'FAILED' : 'OK');
  if (insertError) {
    console.log('Error:', insertError.message);
    return;
  }
  
  const { data: select, error: selectError } = await supabase
    .from('uploads')
    .select('*')
    .eq('id', insert.id)
    .single();
  
  console.log('Select:', selectError ? 'FAILED' : 'OK');
  if (selectError) {
    console.log('Error:', selectError.message);
    return;
  }
  
  const retrieved = Buffer.from(select.data, 'base64');
  console.log('Match:', retrieved.toString() === testBuffer.toString() ? 'YES' : 'NO');
  
  await supabase.from('uploads').delete().eq('id', insert.id);
}

testBytea();
