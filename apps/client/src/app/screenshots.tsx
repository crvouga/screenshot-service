import {
  BUCKET_NAME,
  castImageType,
  definitions,
  IImageType,
  resultToErrors,
  toFilename,
} from '@screenshot-service/shared';
import { supabaseClient } from './supabase';

export type IScreenshot = {
  screenshotId: string;
  projectId: string;
  imageType: IImageType;
  timeoutMs: number;
  targetUrl: string;
};

export const queryKeys = {
  findManyByProjectId: ({ projectId }: { projectId: string }) => [
    'screenshots',
    projectId,
  ],
  screenshotSrc: ({ screenshotId }: { screenshotId: string }) => [
    'screenshots',
    screenshotId,
  ],
};

const fromRow = (
  row: definitions['screenshots']
):
  | { type: 'success'; screenshot: IScreenshot }
  | { type: 'error'; errors: { message: string }[] } => {
  const imageTypeResult = castImageType(row.image_type);

  if (imageTypeResult.type === 'error') {
    return {
      type: 'error',
      errors: [...resultToErrors(imageTypeResult)],
    };
  }
  const screenshot: IScreenshot = {
    projectId: row.id,
    screenshotId: row.id,
    imageType: imageTypeResult.data,
    timeoutMs: row.timeout_ms,
    targetUrl: row.target_url,
  };

  return { type: 'success', screenshot };
};

export const findManyByProjectId = async ({
  projectId,
}: {
  projectId: string;
}): Promise<
  | { type: 'error'; error: string }
  | { type: 'success'; screenshots: IScreenshot[] }
> => {
  const response = await supabaseClient
    .from<definitions['screenshots']>('screenshots')
    .select('*')
    .match({ project_id: projectId })
    .order('created_at', { ascending: false });

  if (response.error) {
    return { type: 'error', error: response.error.message };
  }

  return {
    type: 'success',
    screenshots: response.data.reduce<IScreenshot[]>((screenshots, row) => {
      const result = fromRow(row);
      if (result.type === 'error') {
        return screenshots;
      }
      return [...screenshots, result.screenshot];
    }, []),
  };
};

export const getScreenshotSrc = async ({
  screenshotId,
  imageType,
}: {
  imageType: IImageType;
  screenshotId: string;
}): Promise<
  { type: 'error'; error: string } | { type: 'success'; src: string }
> => {
  const filename = toFilename({ screenshotId, imageType });

  const response = await supabaseClient.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filename);

  console.log({ filename, BUCKET_NAME });
  console.log(response);

  if (response.error) {
    return { type: 'error', error: response.error.message };
  }

  if (response.publicURL) {
    return { type: 'success', src: response.publicURL };
  }

  return { type: 'error', error: 'Failed to get screenshot url' };
};
