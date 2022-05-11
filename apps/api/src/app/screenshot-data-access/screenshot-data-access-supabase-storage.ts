import {
  castImageType,
  castTargetUrl,
  castTimeoutMs,
  definitions,
  IImageType,
  ITargetUrl,
  ITimeoutMs,
  resultToErrors,
} from '@screenshot-service/shared';
import { supabaseClient } from '../supabase';
import { IScreenshot, IScreenshotData } from './types';

/**
 *
 *
 *
 *
 *
 *
 */

type IGetResult =
  | { type: 'success'; screenshot: IScreenshot; data: IScreenshotData }
  | { type: 'error'; errors: { message: string }[] };

type IPutResult =
  | { type: 'success' }
  | { type: 'error'; errors: { message: string }[] };

/**
 *
 *
 *
 *
 */

const BUCKET_NAME = 'screenshots';

/**
 *
 *
 *
 *
 *
 *
 *
 */

const toFilename = ({
  imageType,
  screenshotId,
}: {
  imageType: IImageType;
  screenshotId: string;
}) => {
  return `${screenshotId}.${imageType}`;
};

export const put = async (
  {
    targetUrl,
    timeoutMs,
    projectId,
    imageType,
  }: {
    targetUrl: ITargetUrl;
    timeoutMs: ITimeoutMs;
    projectId: string;
    imageType: IImageType;
  },
  screenshotData: IScreenshotData
): Promise<IPutResult> => {
  const getResult = await getElseInsertRow({
    targetUrl,
    timeoutMs,
    projectId,
    imageType,
  });

  if (getResult.type === 'error') {
    return { type: 'error', errors: [{ message: getResult.error }] };
  }

  const screenshot = getResult.screenshot;

  const filename = toFilename({
    imageType: screenshot.imageType,
    screenshotId: screenshot.screenshotId,
  });

  const uploadResponse = await supabaseClient.storage
    .from(BUCKET_NAME)
    .upload(filename, screenshotData, { upsert: true });

  if (uploadResponse.error) {
    return {
      type: 'error',
      errors: [
        {
          message: uploadResponse.error.message,
        },
      ],
    };
  }

  return {
    type: 'success',
  };
};

/**
 *
 *
 *
 *
 *
 *
 *
 */

export const get = async ({
  projectId,
  timeoutMs,
  targetUrl,
  imageType,
}: {
  projectId: string;
  timeoutMs: ITimeoutMs;
  targetUrl: ITargetUrl;
  imageType: IImageType;
}): Promise<IGetResult> => {
  const gotResult = await getOne({
    projectId,
    timeoutMs,
    targetUrl,
    imageType,
  });

  if (gotResult.type === 'error') {
    return { type: 'error', errors: [...gotResult.errors] };
  }

  const screenshot = gotResult.screenshot;

  const filename = toFilename(screenshot);

  const downloadResponse = await supabaseClient.storage
    .from(BUCKET_NAME)
    .download(filename);

  if (downloadResponse.error) {
    return {
      type: 'error',
      errors: [
        {
          message: `Supbase couldn't download screenshot. ${downloadResponse.error.message}`,
        },
      ],
    };
  }

  if (!downloadResponse.data) {
    return {
      type: 'error',
      errors: [
        {
          message:
            'supabase did not return any data when downloading screenshot',
        },
      ],
    };
  }

  const blob = downloadResponse.data;

  const arrayBuffer = await blob.arrayBuffer();

  const screenshotData = Buffer.from(arrayBuffer);

  return {
    type: 'success',
    screenshot: screenshot,
    data: screenshotData,
  };
};

/**
 *
 *
 *
 *
 *
 *
 *
 */

const rowToScreenshot = (
  row: definitions['screenshots']
):
  | { type: 'success'; screenshot: IScreenshot }
  | { type: 'error'; errors: { message: string }[] } => {
  const timeoutMsResult = castTimeoutMs(row.timeout_ms);
  const targetUrlResult = castTargetUrl(row.target_url);
  const imageTypeResult = castImageType(row.image_type);

  if (
    timeoutMsResult.type === 'success' &&
    targetUrlResult.type === 'success' &&
    imageTypeResult.type === 'success'
  ) {
    const screenshot: IScreenshot = {
      screenshotId: row.id,
      projectId: row.project_id,
      targetUrl: targetUrlResult.data,
      timeoutMs: timeoutMsResult.data,
      imageType: imageTypeResult.data,
    };
    return { type: 'success', screenshot };
  }

  return {
    type: 'error',
    errors: [
      ...resultToErrors(imageTypeResult),
      ...resultToErrors(timeoutMsResult),
      ...resultToErrors(targetUrlResult),
    ],
  };
};

const getOne = async ({
  targetUrl,
  timeoutMs,
  projectId,
  imageType,
}: {
  targetUrl: ITargetUrl;
  timeoutMs: ITimeoutMs;
  projectId: string;
  imageType: IImageType;
}): Promise<
  | { type: 'success'; screenshot: IScreenshot }
  | { type: 'error'; errors: { message: string }[] }
> => {
  const got = await supabaseClient
    .from<definitions['screenshots']>('screenshots')
    .select('*')
    .match({
      project_id: projectId,
      target_url: targetUrl,
      image_type: imageType,
      timeout_ms: timeoutMs,
    })
    .single();

  if (got.data) {
    const rowResult = rowToScreenshot(got.data);

    if (rowResult.type === 'success') {
      return {
        type: 'success',
        screenshot: rowResult.screenshot,
      };
    }

    return {
      type: 'error',
      errors: rowResult.errors,
    };
  }

  return {
    type: 'error',
    errors: [
      got.error
        ? { message: got.error.message }
        : { message: 'Did not find screenshot' },
    ],
  };
};

const insertOne = async ({
  projectId,
  targetUrl,
  timeoutMs,
  imageType,
}: {
  projectId: string;
  targetUrl: ITargetUrl;
  timeoutMs: ITimeoutMs;
  imageType: IImageType;
}): Promise<{ type: 'success' } | { type: 'error'; error: string }> => {
  const result = await supabaseClient
    .from<definitions['screenshots']>('screenshots')
    .insert({
      project_id: projectId,
      target_url: targetUrl,
      timeout_ms: timeoutMs,
      image_type: imageType,
    });

  if (result.error) {
    return { type: 'error', error: String(result.error) };
  }

  return { type: 'success' };
};

const getElseInsertRow = async ({
  projectId,
  targetUrl,
  timeoutMs,
  imageType,
}: {
  projectId: string;
  targetUrl: ITargetUrl;
  timeoutMs: ITimeoutMs;
  imageType: IImageType;
}): Promise<
  | {
      type: 'success';
      screenshot: IScreenshot;
    }
  | { type: 'error'; error: string }
> => {
  const got = await getOne({ projectId, targetUrl, timeoutMs, imageType });

  if (got.type === 'success') {
    return { type: 'success', screenshot: got.screenshot };
  }

  await insertOne({ projectId, targetUrl, timeoutMs, imageType });

  const gotAfterCreated = await getOne({
    projectId,
    targetUrl,
    timeoutMs,
    imageType,
  });

  if (gotAfterCreated.type === 'error') {
    return {
      type: 'error',
      error: `Supabase is not working. Gettting a screenshot record after just creating one does not return any data.`,
    };
  }

  return { type: 'success', screenshot: gotAfterCreated.screenshot };
};
