import { Data } from '@screenshot-service/screenshot-service';
import { SupabaseClient } from '@supabase/supabase-js';
import { definitions } from '../../supabase-types';
import { Configuration, IConfigurationDataAccess } from './interface';

export const SupabaseConfigurationDataAccess = (
  supabaseClient: SupabaseClient
): IConfigurationDataAccess => {
  return {
    findOne: async () => {
      const response = await supabaseClient
        .from<definitions['configuration']>('configuration')
        .select('*')
        .eq('id', 'singleton')
        .single();

      if (response.error) {
        return Data.Result.Err([{ message: response.error.message }]);
      }

      const row = response.data;

      const configuration: Configuration = {
        maxDailyRequests: row.max_daily_requests,
        maxProjectCount: row.max_project_count,
        clientLibraryUrl: row.client_library_url,
      };

      return Data.Result.Ok(configuration);
    },
  };
};
