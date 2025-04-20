import { Data } from '@screenshot-service/screenshot-service';
import { DateRange } from '../../date';

export type CaptureScreenshotRequest = {
  createdAt: string;
  requestId: Data.RequestId.RequestId;
  projectId: Data.ProjectId.ProjectId;
  imageType: Data.ImageType.ImageType;
  delaySec: Data.DelaySec.DelaySec;
  targetUrl: Data.Url.Url;
  originUrl: Data.Url.Url;
  strategy: Data.Strategy.Strategy;
  status: Status;
};

export type Status = InitialStatus | FinalStatus;

export type InitialStatus = 'Loading';

export type FinalStatus =
  | 'Cancelled'
  | 'Failed'
  | 'Succeeded_Cached'
  | 'Succeeded_Network';

export interface ICaptureScreenshotRequestDataAccess {
  insertNew: (params: {
    requestId: Data.RequestId.RequestId;
    projectId: Data.ProjectId.ProjectId;
    imageType: Data.ImageType.ImageType;
    delaySec: Data.DelaySec.DelaySec;
    targetUrl: Data.Url.Url;
    originUrl: Data.Url.Url;
    strategy: Data.Strategy.Strategy;
  }) => Promise<Data.Result.Result<Data.Problem[], CaptureScreenshotRequest>>;

  updateStatus: (params: {
    requestId: Data.RequestId.RequestId;
    status: FinalStatus;
  }) => Promise<Data.Result.Result<Data.Problem, Data.Unit>>;

  uploadScreenshot: (
    params: {
      requestId: Data.RequestId.RequestId;
    },
    buffer: Buffer
  ) => Promise<Data.Result.Result<Data.Problem[], CaptureScreenshotRequest>>;

  findSucceededRequest: (params: {
    targetUrl: Data.Url.Url;
    delaySec: Data.DelaySec.DelaySec;
    projectId: Data.ProjectId.ProjectId;
    imageType: Data.ImageType.ImageType;
  }) => Promise<
    Data.Result.Result<
      Data.Problem[],
      Data.Maybe.Maybe<CaptureScreenshotRequest>
    >
  >;

  findOneElseInsert: (params: {
    requestId: Data.RequestId.RequestId;
    projectId: Data.ProjectId.ProjectId;
    imageType: Data.ImageType.ImageType;
    delaySec: Data.DelaySec.DelaySec;
    targetUrl: Data.Url.Url;
    originUrl: Data.Url.Url;
    strategy: Data.Strategy.Strategy;
  }) => Promise<Data.Result.Result<Data.Problem[], CaptureScreenshotRequest>>;

  getPublicUrl: (params: {
    imageType: Data.ImageType.ImageType;
    requestId: Data.RequestId.RequestId;
    projectId: Data.ProjectId.ProjectId;
  }) => Promise<Data.Result.Result<Data.Problem[], Data.Url.Url>>;

  findMany: (params: {
    projectId: Data.ProjectId.ProjectId;
    order: 'OldestFirst' | 'NewestFirst';
    pageSize: number;
    page: number;
  }) => Promise<Data.Result.Result<Data.Problem[], CaptureScreenshotRequest[]>>;

  countCreatedBetween: (params: {
    dateRange: DateRange;
    projectId: Data.ProjectId.ProjectId;
  }) => Promise<Data.Result.Result<Data.Problem[], number>>;

  countAll: (params: {
    projectId: Data.ProjectId.ProjectId;
  }) => Promise<Data.Result.Result<Data.Problem[], number>>;
}
