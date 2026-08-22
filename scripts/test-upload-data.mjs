import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://lhuefuonrqfjkjjvrzvh.supabase.co",
  "sb_publishable_NDK9BxpzXjw3xVo42O_TlA_pUZn1Ls4",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

(async () => {
  const { data, error } = await supabase.from('uploads').select('data').eq('id', 'upload_1787213574029_nxpn');
  if (error || !data || !data[0]) { console.log('No data'); return; }
  const raw = data[0].data || '';

  console.log('Raw length:', raw.length);
  console.log('First 50 chars:', raw.slice(0, 50));
  console.log('Char codes first 20:', Array.from(raw.slice(0, 20)).map(c => c.charCodeAt(0)));

  // Check for actual backslash characters
  let backslashCount = 0;
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === '\\') backslashCount++;
  }
  console.log('Actual backslash count:', backslashCount);

  // Manual unescape
  let unescaped = '';
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === '\\' && raw[i + 1] === 'x' && i + 3 < raw.length) {
      const hex = raw.substring(i + 2, i + 4);
      unescaped += String.fromCharCode(parseInt(hex, 16));
      i += 3;
    } else {
      unescaped += raw[i];
    }
  }
  console.log('Unescaped length:', unescaped.length);
  console.log('Unescaped first 50:', unescaped.slice(0, 50));

  const decoded = Buffer.from(unescaped, 'base64');
  console.log('Decoded length:', decoded.length);
  console.log('First 8 bytes hex:', decoded.slice(0, 8).toString('hex'));
  console.log('Is PNG:', decoded.slice(0, 8).toString('hex') === '89504e470d0a1a0a');
  console.log('Is JPEG:', decoded[0] === 0xff && decoded[1] === 0xd8);
})();
