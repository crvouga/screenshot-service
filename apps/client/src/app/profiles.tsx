import { definitions } from '@screenshot-service/api-interfaces';
import constate from 'constate';
import { useQuery } from 'react-query';
import { supabaseClient } from './supabase';

export type IProfile = {
  userId: string;
  avatarUrl: string;
  name: string;
};

const rowToProfile = (row: definitions['profiles']): IProfile => {
  return {
    userId: row.id,
    name: row.name,
    avatarUrl: row.avatar_url,
  };
};

export const queryFilter = 'projects';

export const queryKeys = {
  getOne: ({ userId }: { userId: string }) => [queryFilter, 'getOne', userId],
};

export const getOne = async ({
  userId,
}: {
  userId: string;
}): Promise<
  | { type: 'error'; error: string }
  | { type: 'found'; profile: IProfile }
  | { type: 'not-found' }
> => {
  const response = await supabaseClient
    .from<definitions['profiles']>('profiles')
    .select('*')
    .match({ id: userId });

  if (response.error) {
    return { type: 'error', error: response.error.message };
  }

  const [row] = response.data;

  if (row) {
    return {
      type: 'found',
      profile: rowToProfile(row),
    };
  }

  return {
    type: 'not-found',
  };
};

export const remove = async ({
  userId,
}: {
  userId: string;
}): Promise<{ type: 'error'; error: string } | { type: 'success' }> => {
  const response = await supabaseClient
    .from<definitions['profiles']>('profiles')
    .delete()
    .match({ id: userId });

  if (response.error) {
    return { type: 'error', error: response.error.message };
  }

  return {
    type: 'success',
  };
};

export const create = async ({
  userId,
  name,
  avatarUrl,
}: {
  userId: string;
  name: string;
  avatarUrl: string;
}): Promise<
  { type: 'error'; error: string } | { type: 'success'; userId: string }
> => {
  const response = await supabaseClient
    .from<definitions['profiles']>('profiles')
    .insert({ id: userId, name, avatar_url: avatarUrl })
    .single();

  if (response.error) {
    return { type: 'error', error: response.error.message };
  }

  return {
    type: 'success',
    userId: response.data.id,
  };
};

export const update = async ({
  userId,
  ...updates
}: Partial<IProfile> & { userId: string }): Promise<
  { type: 'error'; error: string } | { type: 'success' }
> => {
  const response = await supabaseClient
    .from<definitions['profiles']>('profiles')
    .update({
      name: updates.name,
      avatar_url: updates.avatarUrl,
    })
    .match({
      id: userId,
    });

  if (response.error) {
    return { type: 'error', error: response.error.message };
  }

  return {
    type: 'success',
  };
};

/**
 *
 *
 *
 *
 * state
 *
 *
 *
 */

export const useProfileQuery = ({ userId }: { userId: string }) => {
  return useQuery(queryKeys.getOne({ userId }), () => getOne({ userId }));
};

export const [ProfileContext, useProfile] = constate(
  ({ profile }: { profile: IProfile }) => {
    return {
      profile,
    };
  }
);
