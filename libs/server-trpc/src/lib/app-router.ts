import { createCaptureScreenshotRequestRouter } from './capture-screenshot-request-router';
import { configurationRouter } from './configuration-router';
import { getServerBaseUrl } from '@screenshot-service/shared-core';
import { profileRouter } from './profile-router';
import { projectRouter } from './project-router';
import { publicProcedure, router } from './trpc-server';

export const createAppRouter = ({ env }: { env: { PROD: boolean } }) => {
  return router({
    profile: profileRouter,
    configuration: configurationRouter,
    captureScreenshotRequest: createCaptureScreenshotRequestRouter({
      env,
    }),
    project: projectRouter,
    getBaseUrl: publicProcedure.query(() => {
      return getServerBaseUrl({ prod: env.PROD });
    }),
  });
};

export type AppRouter = ReturnType<typeof createAppRouter>;
