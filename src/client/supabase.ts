import { createClient } from "@supabase/supabase-js";

// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// if (!supabaseUrl) {
//   throw new Error("import.meta.env.VITE_SUPABASE_URL is undefined");
// }
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
// if (!supabaseAnonKey) {
//   throw new Error("import.meta.env.VITE_SUPABASE_ANON_KEY is undefined");
// }
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjcXZqcm5leGt5ZmNpbWRybnJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDYxNzg4NjQsImV4cCI6MTk2MTc1NDg2NH0.HQKhz7fmpwSGjuGIuGaVygvUQ8NuX2CAvHhDQJIIQxo";

const supabaseUrl = "https://rcqvjrnexkyfcimdrnri.supabase.co";

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
