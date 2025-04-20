import { SupabaseAuthApi } from './impl-supabase';
import { IAuthApi } from './interface';
import { supabaseClient } from '../../supabase-client';

export const authApi: IAuthApi = SupabaseAuthApi({
  supabaseClient,
});
