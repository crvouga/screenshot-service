import { SupabaseClient } from '@supabase/supabase-js';
import { definitions } from '../supabase-types';
import { Data } from '@screenshot-service/screenshot-service';

export type Profile = {
  userId: Data.UserId.UserId;
  avatarSeed: string;
  name: string;
  themeMode: ThemeMode;
};

type ThemeMode = 'light' | 'dark' | 'system';

type Problem = { message: string };

const decodeRow = (
  row: definitions['profiles']
): Data.Result.Result<Problem[], Profile> => {
  const userId = Data.UserId.decode(row.id);

  if (Data.Result.isOk(userId)) {
    return Data.Result.Ok({
      userId: userId.value,
      name: row.name,
      avatarSeed: row.avatar_seed,
      themeMode: row.theme_mode,
    });
  }

  return Data.Result.Err(Data.Result.toErrors([userId]));
};

export const findOne =
  (supabaseClient: SupabaseClient) =>
  async ({
    userId,
  }: {
    userId: string;
  }): Promise<Data.Result.Result<Problem[], Profile | null>> => {
    const response = await supabaseClient
      .from<definitions['profiles']>('profiles')
      .select('*')
      .match({ id: userId })
      .single();

    if (response.error) {
      return Data.Result.Err([{ message: response.error.message }]);
    }

    const row = response.data;

    if (!row) {
      return Data.Result.Ok(null);
    }

    const decoded = decodeRow(row);

    return decoded;
  };

export const deleteForever =
  (supabaseClient: SupabaseClient) =>
  async ({
    userId,
  }: {
    userId: string;
  }): Promise<Data.Result.Result<Problem, Data.Unit>> => {
    const response = await supabaseClient
      .from<definitions['profiles']>('profiles')
      .delete()
      .match({ id: userId });

    if (response.error) {
      return Data.Result.Err({ message: response.error.message });
    }

    return Data.Result.Ok(Data.Unit);
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
  }): Promise<Data.Result.Result<Problem, Data.UserId.UserId>> => {
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
      return Data.Result.Err({ message: response.error.message });
    }

    const decoded = Data.UserId.decode(response.data.id);

    return decoded;
  };

export const update =
  (supabaseClient: SupabaseClient) =>
  async ({
    userId,
    ...updates
  }: Partial<Profile> & { userId: string }): Promise<
    Data.Result.Result<Problem, Data.Unit>
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
      return Data.Result.Err({ message: response.error.message });
    }

    return Data.Result.Ok(Data.Unit);
  };

export const ProfileDataAccess = (supabaseClient: SupabaseClient) => {
  return {
    update: update(supabaseClient),
    create: create(supabaseClient),
    deleteForever: deleteForever(supabaseClient),
    findOne: findOne(supabaseClient),
  };
};
