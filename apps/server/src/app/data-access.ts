import * as Shared from '@screenshot-service/shared';
import { supabaseClient } from './supabase-client';

const USE_SUPABASE_CLIENT = false;

export const dataAccess: Shared.IDataAccess = USE_SUPABASE_CLIENT
  ? Shared.SupabaseDataAccess(supabaseClient)
  : Shared.TrpcClientDataAccess();
