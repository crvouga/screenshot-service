import { z } from 'zod';
import { publicProcedure, router } from './trpc-server';
import { FileSystemMap } from './file-system-map';
import { Data } from '@screenshot-service/screenshot-service';

export type Profile = {
  userId: Data.UserId.UserId;
  avatarSeed: string;
  name: string;
  themeMode: ThemeMode;
};

export type ThemeMode = 'light' | 'dark' | 'system';

const profilesMap = new FileSystemMap<string, Profile>('./data', 'profiles');

export const profileRouter = router({
  findOne: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      console.log(`findOne: Looking for profile with userId ${input.userId}`);
      const profile = profilesMap.get(input.userId);
      console.log(
        profile
          ? `findOne: Found profile for userId ${input.userId}`
          : `findOne: No profile found for userId ${input.userId}`
      );
      return profile || null;
    }),

  deleteForever: publicProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input }) => {
      console.log(`deleteForever: Deleting profile for userId ${input.userId}`);
      const existed = profilesMap.has(input.userId);
      profilesMap.delete(input.userId);
      console.log(
        existed
          ? `deleteForever: Successfully deleted profile for userId ${input.userId}`
          : `deleteForever: No profile found to delete for userId ${input.userId}`
      );
      return true;
    }),

  create: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        name: z.string(),
        avatarSeed: z.string(),
        themeMode: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      console.log(`create: Creating new profile for userId ${input.userId}`);
      const profile: Profile = {
        userId: input.userId as unknown as Data.UserId.UserId,
        name: input.name,
        avatarSeed: input.avatarSeed,
        themeMode: input.themeMode as unknown as ThemeMode,
      };

      profilesMap.set(input.userId, profile);
      console.log(
        `create: Successfully created profile for userId ${input.userId}`
      );
      return profile;
    }),

  update: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        name: z.string().optional(),
        avatarSeed: z.string().optional(),
        themeMode: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      console.log(`update: Updating profile for userId ${input.userId}`);
      const existingProfile = profilesMap.get(input.userId);

      if (!existingProfile) {
        console.error(`update: Profile with userId ${input.userId} not found`);
        throw new Error(`Profile with userId ${input.userId} not found`);
      }

      const updatedProfile = {
        ...existingProfile,
        ...(input.name !== undefined && { name: input.name }),
        ...(input.avatarSeed !== undefined && { avatarSeed: input.avatarSeed }),
        ...(input.themeMode !== undefined && {
          themeMode: input.themeMode as unknown as ThemeMode,
        }),
      };

      profilesMap.set(input.userId, updatedProfile as Profile);
      console.log(
        `update: Successfully updated profile for userId ${input.userId}`
      );
      return true;
    }),
});

export type ProfileRouter = typeof profileRouter;
