import { definitions } from '@screenshot-service/shared';
import { supabaseClient } from '../supabase';
import { IProject } from './types';

const rowToProject = (row: definitions['projects']): IProject => {
  return {
    projectId: row.id,
    ownerId: row.owner_id,
    name: row.name,
    whitelistedUrls: (row.whitelisted_urls ?? []).filter(
      (url) => typeof url === 'string'
    ) as string[],
  };
};

export const getOneById = async ({
  projectId,
}: {
  projectId: string;
}): Promise<
  { type: 'error'; error: string } | { type: 'success'; project: IProject }
> => {
  const response = await supabaseClient
    .from<definitions['projects']>('projects')
    .select('*')
    .match({ id: projectId })
    .single();

  if (response.error) {
    return { type: 'error', error: response.error.message };
  }

  return {
    type: 'success',
    project: rowToProject(response.data),
  };
};
