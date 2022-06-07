import { SupabaseClient } from '@supabase/supabase-js';
import { definitions } from '../supabase-types';

export type Profile = {
  userId: string;
  avatarSeed: string;
  name: string;
  themeMode: ThemeMode;
};

type ThemeMode = 'light' | 'dark' | 'system';

const rowToProfile = (row: definitions['profiles']): Profile => {
  return {
    userId: row.id,
    name: row.name,
    avatarSeed: row.avatar_seed,
    themeMode: row.theme_mode,
  };
};

export const getOne =
  (supabaseClient: SupabaseClient) =>
  async ({
    userId,
  }: {
    userId: string;
  }): Promise<
    | { type: 'error'; error: string }
    | { type: 'found'; profile: Profile }
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

export const deleteForever =
  (supabaseClient: SupabaseClient) =>
  async ({
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

export const create =
  (supabaseClient: SupabaseClient) =>
  async ({
    userId,
    name,
    avatarSeed,
    themeMode,
  }: {
    userId: string;
    name: string;
    avatarSeed: string;
    themeMode: ThemeMode;
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

export const update =
  (supabaseClient: SupabaseClient) =>
  async ({
    userId,
    ...updates
  }: Partial<Profile> & { userId: string }): Promise<
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
