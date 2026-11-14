// Usage: node --env-file=.env.local scripts/create-admin.mjs you@example.com 'StrongPassword'
// Creates (or finds) the Supabase Auth user and grants admin access. Run from a trusted machine only.
import { createClient } from "@supabase/supabase-js";

const [email, password] = process.argv.slice(2);
if (!email) {
  console.error("Usage: node --env-file=.env.local scripts/create-admin.mjs <email> [password]");
  process.exit(1);
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

async function findUser(e) {
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const u = data.users.find((x) => x.email?.toLowerCase() === e.toLowerCase());
    if (u || data.users.length < 200) return u;
  }
}

let user = await findUser(email);
if (!user) {
  if (!password || password.length < 8) {
    console.error("User does not exist yet — pass a password (min 8 chars) to create it.");
    process.exit(1);
  }
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  user = data.user;
  console.log(`Created user ${email}`);
}
const { error } = await db.from("admin_users").upsert({ user_id: user.id });
if (error) throw error;
console.log(`✔ ${email} is now an admin. Sign in at /account/login then open /admin`);
