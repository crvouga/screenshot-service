import { Data } from '@crvouga/screenshot-service';

export type Screenshpt = {
  screenshotId: Data.ScreenshotId.ScreenshotId;
  projectId: Data.ProjectId.ProjectId;
  targetUrl: Data.TargetUrl.TargetUrl;
  delaySec: Data.DelaySec.DelaySec;
  imageType: Data.ImageType.ImageType;
};
