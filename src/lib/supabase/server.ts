import { createClient } from "@supabase/supabase-js"

/**
 * Server-side Supabase client with service role.
 * Use only in API routes / server code (e.g. cron). Never expose to the client.
 */
export function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for server Supabase client")
  }
  return createClient(url, serviceRoleKey)
}
