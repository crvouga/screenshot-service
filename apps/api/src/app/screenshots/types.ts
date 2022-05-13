import { IImageType, ITargetUrl, ITimeoutMs } from '@screenshot-service/shared';

export type IScreenshot = {
  screenshotId: string;
  imageType: IImageType;
  timeoutMs: ITimeoutMs;
  targetUrl: ITargetUrl;
  projectId: string;
};

export type IScreenshotData = Buffer | string;
