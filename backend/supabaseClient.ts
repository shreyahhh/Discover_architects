import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Copy backend/.env.example to ' +
    'backend/.env and fill in your Supabase project credentials.'
  );
}

// Server-side client using the service role key. This bypasses Row Level
// Security, so this client must never be exposed to the browser — it is
// only ever imported from backend code.
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export const GALLERY_BUCKET = 'gallery';
export const RESUMES_BUCKET = 'resumes';
