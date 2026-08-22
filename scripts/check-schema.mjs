import https from 'https';

const options = {
  hostname: 'lhuefuonrqfjkjjvrzvh.supabase.co',
  path: '/rest/v1/rpc/exec_sql',
  method: 'POST',
  headers: {
    'apikey': 'sb_publishable_NDK9BxpzXjw3xVo42O_TlA_pUZn1Ls4',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  }
};

const sql = "SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_name = 'uploads' ORDER BY ordinal_position";

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(data));
});
req.on('error', (e) => console.error('Error:', e.message));
req.write(JSON.stringify({ sql }));
req.end();
