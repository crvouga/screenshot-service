import {
  IDelaySec,
  IImageType,
  IProjectId,
  IScreenshotId,
  ITargetUrl,
} from '@crvouga/screenshot-service';

export type IScreenshot = {
  screenshotId: IScreenshotId;
  imageType: IImageType;
  delaySec: IDelaySec;
  targetUrl: ITargetUrl;
  projectId: IProjectId;
};

export type IScreenshotBuffer = Buffer & { _tag: 'ScreenshotBuffer' };

export type IProject = {
  projectId: string;
  ownerId: string;
  name: string;
  whitelistedUrls: string[];
};
