import { supabaseClient } from '../../supabase-client';
import { FakeAuthApi } from './impl-fake';
import { SupabaseAuthApi } from './impl-supabase';
import { IAuthApi } from './interface';

const USE_FAKE = true;

export const authApi: IAuthApi = USE_FAKE
  ? FakeAuthApi()
  : SupabaseAuthApi({
      supabaseClient,
    });
