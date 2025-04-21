import { captureScreenshotRequestRouter } from './capture-screenshot-request-router';
import { configurationRouter } from './configuration-router';
import { getBaseUrl } from './get-base-url';
import { profileRouter } from './profile-router';
import { projectRouter } from './project-router';
import { publicProcedure, router } from './trpc-server';

export const appRouter = router({
  profile: profileRouter,
  configuration: configurationRouter,
  captureScreenshotRequest: captureScreenshotRequestRouter,
  project: projectRouter,
  getBaseUrl: publicProcedure.query(({ ctx }) => {
    return getBaseUrl(ctx.req);
  }),
});

export type AppRouter = typeof appRouter;
