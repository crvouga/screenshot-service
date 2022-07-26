import { DataAccess } from '@screenshot-service/shared';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('process.env.SUPABASE_SERVICE_ROLE_KEY is undefined');
}

if (!SUPABASE_URL) {
  throw new Error('process.env.SUPABASE_URL is undefined');
}

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

//
//
//
// Data Access
//
//
//

export const dataAccess = DataAccess(supabaseClient);
