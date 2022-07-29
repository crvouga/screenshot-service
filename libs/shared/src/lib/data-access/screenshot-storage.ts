import { Data } from '@screenshot-service/screenshot-service';

export const toFilename = ({
  imageType,
  requestId,
  projectId,
}: {
  imageType: Data.ImageType.ImageType;
  requestId: Data.RequestId.RequestId;
  projectId: Data.ProjectId.ProjectId;
}) => {
  return `${projectId}/${requestId}.${imageType}`;
};

export const BUCKET_NAME = `screenshots`;
