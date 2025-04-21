import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('process.env.SUPABASE_SERVICE_ROLE_KEY is undefined');
}

if (!SUPABASE_URL) {
  console.error('process.env.SUPABASE_URL is undefined');
}

export const supabaseClient = createClient(
  SUPABASE_URL ?? 'noop',
  SUPABASE_SERVICE_ROLE_KEY ?? 'noop'
);
