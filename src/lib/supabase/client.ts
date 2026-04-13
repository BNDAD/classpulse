// src/lib/supabase/client.ts — 브라우저용 Supabase 클라이언트
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

type TypedClient = SupabaseClient<Database>;

export function createClient(): TypedClient {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ) as unknown as TypedClient;
}
