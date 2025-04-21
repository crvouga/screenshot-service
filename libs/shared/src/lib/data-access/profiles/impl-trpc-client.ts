import { Data } from '@screenshot-service/screenshot-service';
import { trpcClient } from '../../trpc-client';
import { IProfileDataAccess } from './interface';

export const TrpcClientProfileDataAccess = (): IProfileDataAccess => {
  return {
    findOne: async ({ userId }) => {
      try {
        const profile = await trpcClient.profile.findOne.query({ userId });

        if (!profile) {
          return Data.Result.Ok(null);
        }

        return Data.Result.Ok(profile);
      } catch (error) {
        return Data.Result.Err([
          { message: error instanceof Error ? error.message : 'Unknown error' },
        ]);
      }
    },

    deleteForever: async ({ userId }) => {
      try {
        await trpcClient.profile.deleteForever.mutate({ userId });
        return Data.Result.Ok(Data.Unit);
      } catch (error) {
        return Data.Result.Err({
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },

    create: async ({ userId, name, avatarSeed, themeMode }) => {
      try {
        const result = await trpcClient.profile.create.mutate({
          userId,
          name,
          avatarSeed,
          themeMode,
        });

        return Data.Result.Ok(result.userId as unknown as Data.UserId.UserId);
      } catch (error) {
        return Data.Result.Err({
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },

    update: async ({ userId, ...updates }) => {
      try {
        await trpcClient.profile.update.mutate({
          userId,
          name: updates.name,
          avatarSeed: updates.avatarSeed,
          themeMode: updates.themeMode,
        });

        return Data.Result.Ok(Data.Unit);
      } catch (error) {
        return Data.Result.Err({
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
  };
};
