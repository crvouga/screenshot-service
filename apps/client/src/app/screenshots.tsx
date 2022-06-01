import { Data, DataAccess } from '@crvouga/screenshot-service';
import { useQuery } from 'react-query';

export const useScreenshotsQuery = ({ projectId }: { projectId: string }) => {
  return useQuery(['screenshots', projectId], () =>
    DataAccess.Screenshots.findManyByProjectId({ projectId })
  );
};

export const useScreenshotSrcQuery = ({
  screenshotId,
  imageType,
}: {
  screenshotId: Data.ScreenshotId.ScreenshotId;
  imageType: Data.ImageType.ImageType;
}) => {
  return useQuery(['screenshots', screenshotId], () =>
    DataAccess.Screenshots.getSrc({ screenshotId, imageType })
  );
};
