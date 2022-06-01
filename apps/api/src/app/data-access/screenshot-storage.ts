import { Config, Data, toFilename, Utils } from '@crvouga/screenshot-service';
import { definitions } from '@screenshot-service/shared';
import { IScreenshot } from '../types';
import { supabaseClient } from './supabase';

/**
 *
 *
 *
 *
 *
 *
 */

type IGetResult =
  | { type: 'success'; screenshot: IScreenshot; buffer: Buffer }
  | { type: 'error'; errors: { message: string }[] };

type IPutResult =
  | { type: 'success'; screenshotId: Data.ScreenshotId.ScreenshotId }
  | { type: 'error'; errors: { message: string }[] };

/**
 *
 *
 *
 *
 *
 *
 *
 */

export const put = async (
  {
    targetUrl,
    delaySec,
    projectId,
    imageType,
  }: {
    targetUrl: ITargetUrl;
    delaySec: IDelaySec;
    projectId: IProjectId;
    imageType: IImageType;
  },
  buffer: IScreenshotBuffer
): Promise<IPutResult> => {
  const getResult = await getElseInsertRow({
    targetUrl,
    delaySec,
    projectId,
    imageType,
  });

  if (getResult.type === 'error') {
    return getResult;
  }

  const screenshot = getResult.screenshot;

  const filename = toFilename({
    imageType: screenshot.imageType,
    screenshotId: screenshot.screenshotId,
  });

  const uploadResponse = await supabaseClient.storage
    .from(BUCKET_NAME)
    .upload(filename, buffer, { upsert: true });

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
    screenshotId: getResult.screenshot.screenshotId,
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
  delaySec,
  targetUrl,
  imageType,
}: {
  projectId: string;
  delaySec: IDelaySec;
  targetUrl: ITargetUrl;
  imageType: IImageType;
}): Promise<IGetResult> => {
  const gotResult = await getOne({
    projectId,
    delaySec,
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
          message: `Supabase couldn't download screenshot. ${downloadResponse.error.message}`,
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
            'Supabase did not return any data when downloading screenshot',
        },
      ],
    };
  }

  const blob = downloadResponse.data;

  const arrayBuffer = await blob.arrayBuffer();

  const buffer = Buffer.from(arrayBuffer);

  return {
    type: 'success',
    screenshot: screenshot,
    buffer: buffer as IScreenshotBuffer,
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
  const result = Utils.Result.combine({
    delaySec: Data.DelaySec.decode(row.delay_sec),
    targetUrl: Data.TargetUrl.decode(row.target_url),
    imageType: Data.ImageType.decode(row.image_type),
    projectId: Data.ProjectId.decode(row.project_id),
    screenshotId: Data.ScreenshotId.decode(row.screenshotId),
  });

  return result;
};

const getOne = async ({
  targetUrl,
  delaySec,
  projectId,
  imageType,
}: {
  targetUrl: ITargetUrl;
  delaySec: IDelaySec;
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
      delay_sec: delaySec,
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
  delaySec,
  imageType,
}: {
  projectId: Data.ProjectId.ProjectId;
  targetUrl: Data.TargetUrl.TargetUrl;
  delaySec: Data.DelaySec.DelaySec;
  imageType: Data.ImageType.ImageType;
}): Promise<
  | { type: 'success'; screenshot: IScreenshot }
  | { type: 'error'; errors: { message: string }[] }
> => {
  const response = await supabaseClient
    .from<definitions['screenshots']>('screenshots')
    .insert({
      project_id: projectId,
      target_url: targetUrl,
      delay_sec: delaySec,
      image_type: imageType,
    })
    .single();

  if (response.error) {
    console.log('insertOne error', { delaySec });

    return { type: 'error', errors: [{ message: String(response.error) }] };
  }

  const result = rowToScreenshot(response.data);

  if (result.type === 'error') {
    return result;
  }

  return { type: 'success', screenshot: result.screenshot };
};

const getElseInsertRow = async ({
  projectId,
  targetUrl,
  delaySec,
  imageType,
}: {
  projectId: Data.ProjectId.ProjectId;
  targetUrl: Data.TargetUrl.TargetUrl;
  delaySec: Data.DelaySec.DelaySec;
  imageType: Data.ImageType.ImageType;
}): Promise<
  | {
      type: 'success';
      screenshot: IScreenshot;
    }
  | { type: 'error'; errors: { message: string }[] }
> => {
  const got = await getOne({ projectId, targetUrl, delaySec, imageType });

  if (got.type === 'success') {
    return { type: 'success', screenshot: got.screenshot };
  }

  const inserted = await insertOne({
    projectId,
    targetUrl,
    delaySec,
    imageType,
  });

  if (inserted.type === 'error') {
    return inserted;
  }

  return { type: 'success', screenshot: inserted.screenshot };
};
