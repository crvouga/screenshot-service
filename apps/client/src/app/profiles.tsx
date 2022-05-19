import { definitions } from '@screenshot-service/shared';
import constate from 'constate';
import { useEffect } from 'react';
import { useQuery } from 'react-query';
import { appEventEmitter } from './app-event-emitter';
import { supabaseClient } from './supabase';
import { IThemeMode } from './theme';

export type IProfile = {
  userId: string;
  avatarSeed: string;
  name: string;
  themeMode: IThemeMode;
};

const rowToProfile = (row: definitions['profiles']): IProfile => {
  return {
    userId: row.id,
    name: row.name,
    avatarSeed: row.avatar_seed,
    themeMode: row.theme_mode,
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
  avatarSeed,
  themeMode,
}: {
  userId: string;
  name: string;
  avatarSeed: string;
  themeMode: IThemeMode;
}): Promise<
  { type: 'error'; error: string } | { type: 'success'; userId: string }
> => {
  const response = await supabaseClient
    .from<definitions['profiles']>('profiles')
    .insert({
      id: userId,
      name,
      avatar_seed: avatarSeed,
      theme_mode: themeMode,
    })
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
      avatar_seed: updates.avatarSeed,
      theme_mode: updates.themeMode,
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

export const [ProfileContext, useProfileContext] = constate(
  ({ profile }: { profile: IProfile }) => {
    useEffect(() => {
      appEventEmitter.emit('Profile', { profile });
    }, [profile]);

    return {
      profile,
    };
  }
);
