import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

dotenv.config({ path: "./.env.local" });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set in environment or .env.local");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

function looksHashed(pw) {
  return typeof pw === "string" && (pw.startsWith("$2a$") || pw.startsWith("$2b$") || pw.startsWith("$2y$"));
}

async function run() {
  console.log("Fetching users...");
  const users = await sql`SELECT id, email, password FROM users`;
  let updated = 0;
  for (const u of users) {
    if (!u.password) continue;
    if (looksHashed(u.password)) continue;
    // Hash and update
    const newHash = await bcrypt.hash(String(u.password), 10);
    await sql`UPDATE users SET password = ${newHash} WHERE id = ${u.id}`;
    console.log(`Hashed password for ${u.email}`);
    updated++;
  }
  console.log(`Done. Updated ${updated} users.`);
  process.exit(0);
}

run().catch((err) => { console.error(err); process.exit(2); });
