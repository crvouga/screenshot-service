import { captureScreenshotRequestRouter } from './capture-screenshot-request-router';
import { configurationRouter } from './configuration-router';
import { profileRouter } from './profile-router';
import { projectRouter } from './project-router';
import { publicProcedure, router } from './trpc-server';

export const appRouter = router({
  profile: profileRouter,
  configuration: configurationRouter,
  captureScreenshotRequest: captureScreenshotRequestRouter,
  project: projectRouter,
  getBaseUrl: publicProcedure.query(({ ctx }) => {
    const origin = ctx.req?.headers.origin || ctx.req?.headers.host;

    if (!origin) {
      throw new Error('Could not determine request origin');
    }

    const baseUrl = `http://${origin}`;
    return baseUrl;
  }),
});

export type AppRouter = typeof appRouter;
