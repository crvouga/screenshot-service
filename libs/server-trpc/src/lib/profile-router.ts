import { z } from 'zod';
import { publicProcedure, router } from './trpc-server';

// In-memory storage for profiles
const profilesMap = new Map();

export const profileRouter = router({
  findOne: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const profile = profilesMap.get(input.userId);
      return profile || null;
    }),

  deleteForever: publicProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input }) => {
      profilesMap.delete(input.userId);
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
      const profile = {
        userId: input.userId,
        name: input.name,
        avatarSeed: input.avatarSeed,
        themeMode: input.themeMode,
      };

      profilesMap.set(input.userId, profile);
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
      const existingProfile = profilesMap.get(input.userId);

      if (!existingProfile) {
        throw new Error(`Profile with userId ${input.userId} not found`);
      }

      const updatedProfile = {
        ...existingProfile,
        ...(input.name !== undefined && { name: input.name }),
        ...(input.avatarSeed !== undefined && { avatarSeed: input.avatarSeed }),
        ...(input.themeMode !== undefined && { themeMode: input.themeMode }),
      };

      profilesMap.set(input.userId, updatedProfile);
      return true;
    }),
});

export type ProfileRouter = typeof profileRouter;
