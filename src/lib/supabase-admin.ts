import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

export const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

export const SUPABASE_BUCKET = 'event-images';

/** Public URL prefix for uploaded event images. Used to detect Supabase-hosted images. */
export const SUPABASE_STORAGE_PREFIX = `${supabaseUrl}/storage/v1/object/public/${SUPABASE_BUCKET}/`;
