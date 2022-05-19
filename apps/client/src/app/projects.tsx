import { IProjectId } from '@crvouga/screenshot-service';
import { definitions } from '@screenshot-service/shared';
import { useQuery } from 'react-query';
import { supabaseClient } from './supabase';

export type IProject = {
  projectId: IProjectId;
  ownerId: string;
  name: string;
  whitelistedUrls: string[];
};

const rowToProject = (row: definitions['projects']): IProject => {
  return {
    // todo validate
    projectId: row.id as IProjectId,
    ownerId: row.owner_id,
    name: row.name,
    whitelistedUrls: (row.whitelisted_urls ?? []).filter(
      (url) => typeof url === 'string'
    ) as string[],
  };
};

export const getAll = async ({
  ownerId,
}: {
  ownerId: string;
}): Promise<
  { type: 'error'; error: string } | { type: 'success'; data: IProject[] }
> => {
  const response = await supabaseClient
    .from<definitions['projects']>('projects')
    .select('*')
    .match({ owner_id: ownerId });

  if (response.error) {
    return { type: 'error', error: response.error.message };
  }

  return {
    type: 'success',
    data: response.data.map(rowToProject),
  };
};

export const getOne = async ({
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

export const remove = async ({
  projectId,
}: {
  projectId: string;
}): Promise<{ type: 'error'; error: string } | { type: 'success' }> => {
  const response = await supabaseClient
    .from<definitions['projects']>('projects')
    .delete()
    .match({ id: projectId });

  if (response.error) {
    return { type: 'error', error: response.error.message };
  }

  return {
    type: 'success',
  };
};

export const create = async ({
  ownerId,
  projectName,
}: {
  ownerId: string;
  projectName: string;
}): Promise<
  { type: 'error'; error: string } | { type: 'success'; projectId: string }
> => {
  const response = await supabaseClient
    .from<definitions['projects']>('projects')
    .insert({ owner_id: ownerId, name: projectName })
    .single();

  if (response.error) {
    return { type: 'error', error: response.error.message };
  }

  return {
    type: 'success',
    projectId: response.data.id,
  };
};

export const update = async ({
  projectId,
  ...updates
}: Partial<IProject> & { projectId: string }): Promise<
  { type: 'error'; error: string } | { type: 'success' }
> => {
  const response = await supabaseClient
    .from<definitions['projects']>('projects')
    .update({
      name: updates.name,
      whitelisted_urls: updates.whitelistedUrls,
    })
    .match({
      id: projectId,
    });

  if (response.error) {
    return { type: 'error', error: response.error.message };
  }

  return {
    type: 'success',
  };
};

/* 


query


*/

export const queryFilter = 'projects';

export const queryKeys = {
  getOne: ({ projectId }: { projectId: string }) => [
    queryFilter,
    'getOne',
    projectId,
  ],
  getAll: ({ ownerId }: { ownerId: string }) => [
    queryFilter,
    'getAll',
    ownerId,
  ],
};

export const useProjectsQuery = ({ ownerId }: { ownerId: string }) => {
  return useQuery(queryKeys.getAll({ ownerId }), () => getAll({ ownerId }));
};
