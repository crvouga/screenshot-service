import { captureScreenshotRequestRouter } from './capture-screenshot-request-router';
import { configurationRouter } from './configuration-router';
import { profileRouter } from './profile-router';
import { projectRouter } from './project-router';
import { router } from './trpc-server';

export const appRouter = router({
  profile: profileRouter,
  configuration: configurationRouter,
  captureScreenshotRequest: captureScreenshotRequestRouter,
  project: projectRouter,
});

export type AppRouter = typeof appRouter;
