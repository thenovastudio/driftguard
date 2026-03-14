import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

// Lazy initialization — only creates client when first accessed
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!url || !key) {
      throw new Error("Missing Supabase env vars. Copy .env.example to .env.local and fill in your values.");
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
}

// SQL to run in Supabase SQL Editor:
export const SUPABASE_SETUP_SQL = `
CREATE TABLE IF NOT EXISTS services (
  id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  api_key TEXT DEFAULT '',
  connected BOOLEAN DEFAULT FALSE,
  enabled BOOLEAN DEFAULT TRUE,
  last_polled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, user_id)
);

CREATE TABLE IF NOT EXISTS changes (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  service_id TEXT NOT NULL,
  diff JSONB NOT NULL,
  acknowledged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_user ON services(user_id);
CREATE INDEX IF NOT EXISTS idx_changes_user ON changes(user_id, service_id, created_at DESC);
`;
