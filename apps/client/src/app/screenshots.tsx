import { Data, DataAccess } from '@screenshot-service/screenshot-service';
import { useQuery } from 'react-query';
import { supabaseClient } from './supabase';

export const useScreenshotsQuery = ({ projectId }: { projectId: string }) => {
  return useQuery(['screenshots', projectId], () =>
    DataAccess.Screenshots.findManyByProjectId(supabaseClient)({ projectId })
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
    DataAccess.Screenshots.getSrc(supabaseClient)({ screenshotId, imageType })
  );
};
