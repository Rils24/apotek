import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';

// Admin client with service_role key - SERVER ONLY
// Used for user management (create/delete users) that bypass RLS
// NEVER import this from client components

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY. This function can only be used on the server.'
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
