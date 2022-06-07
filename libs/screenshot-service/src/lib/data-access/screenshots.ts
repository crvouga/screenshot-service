import { SupabaseClient } from '@supabase/supabase-js';
import { either } from 'fp-ts';
import * as Data from '../data';
import { definitions } from '../supabase';
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

type Problem = { message: string };

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
): either.Either<Problem[], Screenshot> => {
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

//
//
//
//
//
//
//
//

export const get =
  (supabaseClient: SupabaseClient) =>
  async ({
    projectId,
    delaySec,
    targetUrl,
    imageType,
  }: {
    projectId: Data.ProjectId.ProjectId;
    delaySec: Data.DelaySec.DelaySec;
    targetUrl: Data.TargetUrl.TargetUrl;
    imageType: Data.ImageType.ImageType;
  }): Promise<either.Either<Problem[], [Screenshot, Buffer]>> => {
    const findResult = await findOne(supabaseClient)({
      projectId,
      delaySec,
      targetUrl,
      imageType,
    });

    if (either.isLeft(findResult)) {
      return findResult;
    }

    const screenshot = findResult.right;

    const filename = toFilename(screenshot);

    const downloadResponse = await supabaseClient.storage
      .from(SCREENSHOT_BUCKET_NAME)
      .download(filename);

    if (downloadResponse.error) {
      return either.left([
        {
          message: `Supabase couldn't download screenshot. ${downloadResponse.error.message}`,
        },
      ]);
    }

    if (!downloadResponse.data) {
      return either.left([
        {
          message:
            'Supabase did not return any data when downloading screenshot',
        },
      ]);
    }

    const blob = downloadResponse.data;

    const arrayBuffer = await blob.arrayBuffer();

    const buffer = Buffer.from(arrayBuffer);

    return either.right([screenshot, buffer]);
  };

//
//
//
//
//
//
//

export const findManyByProjectId =
  (supabaseClient: SupabaseClient) =>
  async ({
    projectId,
  }: {
    projectId: string;
  }): Promise<either.Either<Problem[], Screenshot[]>> => {
    const response = await supabaseClient
      .from<definitions['screenshots']>('screenshots')
      .select('*')
      .match({ project_id: projectId })
      .order('created_at', { ascending: false });

    if (response.error) {
      return either.left([{ message: response.error.message }]);
    }

    const decodings = response.data.map(decodeRow);

    const allLeft = toAllLeft(decodings).flat();

    if (allLeft.length > 0) {
      return either.left(allLeft);
    }

    return either.right(toAllRight(decodings));
  };

export const getPublicUrl =
  (supabaseClient: SupabaseClient) =>
  async ({
    screenshotId,
    imageType,
  }: {
    imageType: Data.ImageType.ImageType;
    screenshotId: Data.ScreenshotId.ScreenshotId;
  }): Promise<either.Either<Problem, Data.Url.Url>> => {
    const filename = toFilename({ screenshotId, imageType });

    const response = await supabaseClient.storage
      .from(SCREENSHOT_BUCKET_NAME)
      .getPublicUrl(filename);

    if (response.error) {
      return either.left({ message: response.error.message });
    }

    const decoded = Data.Url.decode(response.publicURL);

    return decoded;
  };

export const put =
  (supabaseClient: SupabaseClient) =>
  async (
    {
      targetUrl,
      delaySec,
      projectId,
      imageType,
    }: {
      targetUrl: Data.TargetUrl.TargetUrl;
      delaySec: Data.DelaySec.DelaySec;
      projectId: Data.ProjectId.ProjectId;
      imageType: Data.ImageType.ImageType;
    },
    buffer: Buffer
  ): Promise<either.Either<Problem[], Screenshot>> => {
    const findElseInsertResult = await findOneElseInsertOne(supabaseClient)({
      targetUrl,
      delaySec,
      projectId,
      imageType,
    });

    if (either.isLeft(findElseInsertResult)) {
      return findElseInsertResult;
    }

    const screenshot = findElseInsertResult.right;

    const filename = toFilename({
      imageType: screenshot.imageType,
      screenshotId: screenshot.screenshotId,
    });

    const uploadResponse = await supabaseClient.storage
      .from(SCREENSHOT_BUCKET_NAME)
      .upload(filename, buffer, { upsert: true });

    if (uploadResponse.error) {
      return either.left([{ message: uploadResponse.error.message }]);
    }

    return either.right(screenshot);
  };

const findOne =
  (supabaseClient: SupabaseClient) =>
  async ({
    targetUrl,
    delaySec,
    projectId,
    imageType,
  }: {
    targetUrl: Data.TargetUrl.TargetUrl;
    delaySec: Data.DelaySec.DelaySec;
    projectId: Data.ProjectId.ProjectId;
    imageType: Data.ImageType.ImageType;
  }): Promise<either.Either<Problem[], Screenshot>> => {
    const response = await supabaseClient
      .from<definitions['screenshots']>('screenshots')
      .select('*')
      .match({
        project_id: projectId,
        target_url: targetUrl,
        image_type: imageType,
        delay_sec: delaySec,
      })
      .single();

    if (response.error) {
      return either.left([{ message: response.error.message }]);
    }

    const decoded = decodeRow(response.data);

    return decoded;
  };

const insertOne =
  (supabaseClient: SupabaseClient) =>
  async ({
    projectId,
    targetUrl,
    delaySec,
    imageType,
  }: {
    projectId: Data.ProjectId.ProjectId;
    targetUrl: Data.TargetUrl.TargetUrl;
    delaySec: Data.DelaySec.DelaySec;
    imageType: Data.ImageType.ImageType;
  }): Promise<either.Either<Problem[], Screenshot>> => {
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
      return either.left([{ message: response.error.message }]);
    }

    const decoded = decodeRow(response.data);

    return decoded;
  };

const findOneElseInsertOne =
  (supabaseClient: SupabaseClient) =>
  async ({
    projectId,
    targetUrl,
    delaySec,
    imageType,
  }: {
    projectId: Data.ProjectId.ProjectId;
    targetUrl: Data.TargetUrl.TargetUrl;
    delaySec: Data.DelaySec.DelaySec;
    imageType: Data.ImageType.ImageType;
  }): Promise<either.Either<Problem[], Screenshot>> => {
    const findResult = await findOne(supabaseClient)({
      projectId,
      targetUrl,
      delaySec,
      imageType,
    });

    if (either.isRight(findResult)) {
      return findResult;
    }

    const insertResult = await insertOne(supabaseClient)({
      projectId,
      targetUrl,
      delaySec,
      imageType,
    });

    if (either.isLeft(insertResult)) {
      return either.left([...findResult.left, ...insertResult.left]);
    }

    return insertResult;
  };
