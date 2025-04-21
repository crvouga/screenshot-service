import { publicProcedure, router } from './trpc-server';

// In-memory storage for configuration
const configurationData = {
  maxDailyRequests: 100,
  maxProjectCount: 5,
  clientLibraryUrl: 'https://www.npmjs.com/package/@crvouga/screenshot-service',
};

export const configurationRouter = router({
  findOne: publicProcedure.query(async () => {
    return configurationData;
  }),
});

export type ConfigurationRouter = typeof configurationRouter;
