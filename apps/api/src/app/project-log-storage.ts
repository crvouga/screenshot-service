import { definitions, IProjectLog } from '@screenshot-service/shared';
import { supabaseClient } from './supabase';

export type IAppend = (
  log: Pick<IProjectLog, 'message' | 'logLevel' | 'projectId' | 'requestId'>
) => Promise<void>;

export const append: IAppend = async (log) => {
  const repsonse = await supabaseClient
    .from<definitions['project_logs']>('project_logs')
    .insert({
      message: log.message,
      project_id: log.projectId,
      request_id: log.requestId,
      log_level: log.logLevel,
    });
};
