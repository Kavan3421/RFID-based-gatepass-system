import { createClient } from '@supabase/supabase-js';

// Browser / Client-side Supabase helper using modern Publishable Key
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
let supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

// Fallback to valid placeholder URL during build/SSR if placeholders are used
if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
  supabaseUrl = 'https://placeholder.supabase.co';
}
if (!supabasePublishableKey) {
  supabasePublishableKey = 'placeholder-key';
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
