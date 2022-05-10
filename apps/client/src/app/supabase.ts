import { createClient } from '@supabase/supabase-js';

const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjcXZqcm5leGt5ZmNpbWRybnJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NTIyMjIxMzQsImV4cCI6MTk2Nzc5ODEzNH0.kuSVPHPQ1BC8PKWhyisHhTMUwDhKxy9MPt_Bh_u8VvI';

const SUPABASE_URL = 'https://rcqvjrnexkyfcimdrnri.supabase.co';

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
