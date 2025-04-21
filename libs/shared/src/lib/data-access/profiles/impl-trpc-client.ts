import { Data } from '@screenshot-service/screenshot-service';
import { trpcClient } from '../../trpc-client';
import { IProfileDataAccess } from './interface';
import { z } from 'zod';
import { Problem } from '../shared';

// Zod schema for validating UserId
const userIdSchema = z
  .string()
  .refine((val) => Data.UserId.is(val), { message: 'Invalid UserId format' });

export const TrpcClientProfileDataAccess = (): IProfileDataAccess => {
  return {
    findOne: async ({ userId }) => {
      try {
        const profile = await trpcClient.profile.findOne.query({ userId });
        return Data.Result.Ok(profile);
      } catch (error) {
        return Data.Result.Err([
          {
            message: error instanceof Error ? error.message : 'Unknown error',
          },
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
        const validatedUserId = userIdSchema.parse(result.userId);
        return Data.Result.Ok(
          Data.Result.unwrap(Data.UserId.decode(validatedUserId))
        );
      } catch (error) {
        const problem: Problem = {
          message: error instanceof Error ? error.message : 'Unknown error',
        };
        return Data.Result.Err(problem);
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
