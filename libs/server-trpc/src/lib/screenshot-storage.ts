import { FileSystemMap } from './file-system-map';
import { Data } from '@screenshot-service/screenshot-service';

export type CaptureScreenshotRequest = {
  createdAt: string;
  requestId: Data.RequestId.RequestId;
  projectId: Data.ProjectId.ProjectId;
  imageType: Data.ImageType.ImageType;
  delaySec: Data.DelaySec.DelaySec;
  targetUrl: Data.Url.Url;
  originUrl: Data.Url.Url;
  strategy: Data.Strategy.Strategy;
  status:
    | 'Loading'
    | 'Cancelled'
    | 'Failed'
    | 'Succeeded_Cached'
    | 'Succeeded_Network';
};

// Shared storage instances
export const screenshotRequests = new FileSystemMap<
  string,
  CaptureScreenshotRequest
>('./data', 'screenshot-requests');

export const screenshotBuffers = new Map<string, Buffer>();
