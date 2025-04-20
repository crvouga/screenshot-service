import * as Shared from '@screenshot-service/shared';
import { supabaseClient } from './supabase-client';

export const dataAccess: Shared.IDataAccess =
  Shared.SupabaseDataAccess(supabaseClient);
