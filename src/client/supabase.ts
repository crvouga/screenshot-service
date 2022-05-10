import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

if (!supabaseUrl) {
  throw new Error("import.meta.env.VITE_SUPABASE_URL is undefined");
}

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  throw new Error("import.meta.env.VITE_SUPABASE_ANON_KEY is undefined");
}

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
