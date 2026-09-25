import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: "./.env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkTables() {
  const tables = ['users', 'properties', 'units', 'tenants', 'payments', 'notifications', 'ratings', 'complaints', 'audit_logs', 'payment_verification_codes', 'system_config', 'messages', 'uploads'];
  
  for (const table of tables) {
    try {
      const { error, count } = await supabase.schema("public").from(table).select('*', { count: 'exact', head: true });
      console.log(`${table}: exists=${!error}, count=${count ?? 'unknown'}, error=${error?.message || 'none'}`);
    } catch (e) {
      console.log(`${table}: ERROR - ${e}`);
    }
  }
}

checkTables();
