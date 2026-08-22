import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://lhuefuonrqfjkjjvrzvh.supabase.co",
  "sb_publishable_NDK9BxpzXjw3xVo42O_TlA_pUZn1Ls4",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkTables() {
  const tables = ['users', 'properties', 'units', 'tenants', 'payments', 'notifications', 'ratings', 'complaints', 'audit_logs', 'payment_verification_codes', 'system_config', 'messages', 'uploads'];
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase.from(table).select('*', { count: 'exact', head: true });
      console.log(`${table}: exists=${!error}, count=${count ?? 'unknown'}, error=${error?.message || 'none'}`);
    } catch (e) {
      console.log(`${table}: ERROR - ${e}`);
    }
  }
}

checkTables();
