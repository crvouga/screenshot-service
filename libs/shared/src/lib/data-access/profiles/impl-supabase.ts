import { Data } from '@screenshot-service/screenshot-service';
import { SupabaseClient } from '@supabase/supabase-js';
import { definitions } from '../../supabase-types';
import { IProfileDataAccess, Profile } from './interface';
import { Problem } from '../shared';

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

export const SupabaseProfileDataAccess = (
  supabaseClient: SupabaseClient
): IProfileDataAccess => {
  return {
    findOne: async ({ userId }) => {
      const response = await supabaseClient
        .from<definitions['profiles']>('profiles')
        .select('*')
        .match({ id: userId });

      if (response.error) {
        return Data.Result.Err([{ message: response.error.message }]);
      }

      const rows = response.data;

      if (rows.length === 0) {
        return Data.Result.Ok(null);
      }

      const decoded = decodeRow(rows[0]);

      return decoded;
    },

    deleteForever: async ({ userId }) => {
      const response = await supabaseClient
        .from<definitions['profiles']>('profiles')
        .delete()
        .match({ id: userId });

      if (response.error) {
        return Data.Result.Err({ message: response.error.message });
      }

      return Data.Result.Ok(Data.Unit);
    },

    create: async ({ userId, name, avatarSeed, themeMode }) => {
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
    },

    update: async ({ userId, ...updates }) => {
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
    },
  };
};
