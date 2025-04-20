import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseCaptureScreenshotRequestDataAccess } from '../capture-screenshot-request/impl-supabase';
import { SupabaseConfigurationDataAccess } from '../configuration/impl-supabase';
import { SupabaseProfileDataAccess } from '../profiles/impl-supabase';
import { ProjectDataAccess } from '../projects/impl-supabase';
import { IDataAccess } from './interface';

export const SupabaseDataAccess = (
  supabaseClient: SupabaseClient
): IDataAccess => {
  const configurationDataAccess =
    SupabaseConfigurationDataAccess(supabaseClient);

  return {
    profile: SupabaseProfileDataAccess(supabaseClient),
    project: ProjectDataAccess({
      supabaseClient,
      configurationDataAccess,
    }),
    captureScreenshotRequest: SupabaseCaptureScreenshotRequestDataAccess({
      supabaseClient,
      configurationDataAccess,
    }),
    configuration: SupabaseConfigurationDataAccess(supabaseClient),
  };
};
