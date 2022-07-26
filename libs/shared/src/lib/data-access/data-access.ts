import { SupabaseClient } from '@supabase/supabase-js';
import { ProfileDataAccess } from './profiles';
import { ProjectDataAccess } from './projects';
import { ScreenshotDataAccess } from './screenshots';

export const DataAccess = (supabaseClient: SupabaseClient) => {
  return {
    profile: ProfileDataAccess(supabaseClient),
    project: ProjectDataAccess(supabaseClient),
    screenshot: ScreenshotDataAccess(supabaseClient),
  };
};

export type DataAccess = ReturnType<typeof DataAccess>;
