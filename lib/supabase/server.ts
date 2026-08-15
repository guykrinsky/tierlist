import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Server-side client for route handlers. No cookies or session: the bot route
// acts on behalf of the game, not a signed-in user.
export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}
