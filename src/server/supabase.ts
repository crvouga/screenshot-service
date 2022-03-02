import { createClient } from "@supabase/supabase-js";
import dotenv from "./dotenv";

export const supabaseClient = createClient(
  dotenv.SUPABASE_URL,
  dotenv.SUPABASE_SERVICE_KEY
);
