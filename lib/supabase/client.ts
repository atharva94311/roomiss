"use client";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) {
  // Surface this clearly so it's obvious when env vars are missing.
  // eslint-disable-next-line no-console
  console.error(
    "[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
  );
}

/**
 * Browser-side Supabase client. One instance per tab — re-used across hooks.
 * Sessions live in localStorage so the user stays signed in across reloads.
 */
export const supabase = createClient<Database>(url ?? "", anon ?? "", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "roomiss-auth",
  },
  realtime: {
    params: { eventsPerSecond: 8 },
  },
});

// Seed-account credentials used by the "Continue as fresher / admin" buttons.
// These accounts exist in the database (migration 0009_seed_users_and_profiles).
// Production builds (NEXT_PUBLIC_DEMO_MODE !== "1") ship an empty string so the
// seed-admin credentials don't sit in the public JS bundle. The login store
// actions surface a friendly error when the credential is empty.
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "1";
export const GUEST_PASSWORD = DEMO_MODE ? "roomiss2026" : "";
export const SEED_EMAIL = {
  guestUser: "aarav@iitkgp.ac.in",       // u1 Aarav Mehta · LBS · verified
  guestAdmin: "admin@roomiss.in",        // warden console
  verifier: "verifier@roomiss.in",
} as const;
