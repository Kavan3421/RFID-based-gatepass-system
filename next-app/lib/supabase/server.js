import { createClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase client utilizing SUPABASE_SECRET_KEY.
 * MUST NEVER be exposed or executed on the client browser.
 */
export function getSupabaseServerClient() {
  if (typeof window !== 'undefined') {
    throw new Error('CRITICAL SECURITY ERROR: SUPABASE_SECRET_KEY client cannot be initialized in the browser.');
  }

  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  let supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || '';

  // Fallback to valid URL format if placeholder is supplied during build-time evaluation
  if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
    supabaseUrl = 'https://placeholder.supabase.co';
  }
  if (!supabaseSecretKey) {
    supabaseSecretKey = 'placeholder-secret-key';
  }

  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export const supabaseServer = getSupabaseServerClient();
