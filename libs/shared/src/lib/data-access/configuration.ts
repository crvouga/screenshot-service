import { Data } from '@screenshot-service/screenshot-service';
import { SupabaseClient } from '@supabase/supabase-js';
import { definitions } from '../supabase-types';

export type Configuration = {
  maxProjectCount: number;
  maxDailyRequests: number;
};

export const findOne =
  (supabaseClient: SupabaseClient) =>
  async (): Promise<Data.Result.Result<Data.Problem[], Configuration>> => {
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
    };

    return Data.Result.Ok(configuration);
  };

export const ConfigurationDataAccess = (supabaseClient: SupabaseClient) => {
  return {
    findOne: findOne(supabaseClient),
  };
};
