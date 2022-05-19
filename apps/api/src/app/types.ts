import { IDelaySec, IImageType, ITargetUrl } from '@crvouga/screenshot-service';

export type IScreenshot = {
  screenshotId: string;
  imageType: IImageType;
  delaySec: IDelaySec;
  targetUrl: ITargetUrl;
  projectId: string;
};

export type IScreenshotData = Buffer | string;

export type IProject = {
  projectId: string;
  ownerId: string;
  name: string;
  whitelistedUrls: string[];
};
