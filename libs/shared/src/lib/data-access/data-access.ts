import { SupabaseClient } from '@supabase/supabase-js';
import { CaptureScreenshotRequestDataAccess } from './capture-screenshot-request';
import { ConfigurationDataAccess } from './configuration';
import { ProfileDataAccess } from './profiles';
import { ProjectDataAccess } from './projects';

export const DataAccess = (supabaseClient: SupabaseClient) => {
  return {
    profile: ProfileDataAccess(supabaseClient),
    project: ProjectDataAccess(supabaseClient),
    captureScreenshotRequest:
      CaptureScreenshotRequestDataAccess(supabaseClient),
    configuration: ConfigurationDataAccess(supabaseClient),
  };
};

export type DataAccess = ReturnType<typeof DataAccess>;
