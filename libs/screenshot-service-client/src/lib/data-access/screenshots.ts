import { either } from 'fp-ts';
import * as Data from '../data';
import { definitions, supabaseClient } from '../supabase';
import { toAllLeft, toAllRight } from '../utils';

//
//
//
//
//
//

export type Screenshot = {
  screenshotId: Data.ScreenshotId.ScreenshotId;
  projectId: Data.ProjectId.ProjectId;
  imageType: Data.ImageType.ImageType;
  delaySec: Data.DelaySec.DelaySec;
  targetUrl: Data.TargetUrl.TargetUrl;
};

//
//
//
//
//
//

export const SCREENSHOT_BUCKET_NAME = 'screenshots';

export const toFilename = ({
  imageType,
  screenshotId,
}: {
  imageType: Data.ImageType.ImageType;
  screenshotId: Data.ScreenshotId.ScreenshotId;
}) => {
  return `${screenshotId}.${imageType}`;
};

const decodeRow = (
  row: definitions['screenshots']
): either.Either<Error[], Screenshot> => {
  const projectId = Data.ProjectId.decode(row.project_id);
  const screenshotId = Data.ScreenshotId.decode(row.id);
  const imageType = Data.ImageType.decode(row.image_type);
  const delaySec = Data.DelaySec.decode(row.delay_sec);
  const targetUrl = Data.TargetUrl.decode(row.target_url);

  if (
    either.isRight(projectId) &&
    either.isRight(screenshotId) &&
    either.isRight(imageType) &&
    either.isRight(delaySec) &&
    either.isRight(targetUrl)
  ) {
    return either.right({
      projectId: projectId.right,
      screenshotId: screenshotId.right,
      imageType: imageType.right,
      delaySec: delaySec.right,
      targetUrl: targetUrl.right,
    });
  }

  return either.left(
    toAllLeft([projectId, screenshotId, imageType, delaySec, targetUrl])
  );
};

export const findManyByProjectId = async ({
  projectId,
}: {
  projectId: string;
}): Promise<either.Either<Error[], Screenshot[]>> => {
  const response = await supabaseClient
    .from<definitions['screenshots']>('screenshots')
    .select('*')
    .match({ project_id: projectId })
    .order('created_at', { ascending: false });

  if (response.error) {
    return either.left([new Error(response.error.message)]);
  }

  const decodings = response.data.map(decodeRow);

  const allLeft = toAllLeft(decodings).flat();

  if (allLeft.length > 0) {
    return either.left(allLeft);
  }

  return either.right(toAllRight(decodings));
};

export const getSrc = async ({
  screenshotId,
  imageType,
}: {
  imageType: Data.ImageType.ImageType;
  screenshotId: Data.ScreenshotId.ScreenshotId;
}): Promise<either.Either<{ message: string }, { src: string }>> => {
  const filename = toFilename({ screenshotId, imageType });

  const response = await supabaseClient.storage
    .from(SCREENSHOT_BUCKET_NAME)
    .getPublicUrl(filename);

  if (response.error) {
    return either.left({ message: response.error.message });
  }

  if (response.publicURL) {
    return either.right({ src: response.publicURL });
  }

  return either.left({ message: 'Failed to get screenshot url' });
};
