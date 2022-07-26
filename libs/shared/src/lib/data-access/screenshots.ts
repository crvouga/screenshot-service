import { Data } from '@screenshot-service/screenshot-service';
import { SupabaseClient } from '@supabase/supabase-js';
import { definitions } from '../supabase-types';

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
): Data.Result.Result<Problem[], Screenshot> => {
  const projectId = Data.ProjectId.decode(row.project_id);
  const screenshotId = Data.ScreenshotId.decode(row.id);
  const imageType = Data.ImageType.decode(row.image_type);
  const delaySec = Data.DelaySec.decode(row.delay_sec);
  const targetUrl = Data.TargetUrl.decode(row.target_url);

  if (
    Data.Result.isOk(projectId) &&
    Data.Result.isOk(screenshotId) &&
    Data.Result.isOk(imageType) &&
    Data.Result.isOk(delaySec) &&
    Data.Result.isOk(targetUrl)
  ) {
    return Data.Result.Ok({
      projectId: projectId.value,
      screenshotId: screenshotId.value,
      imageType: imageType.value,
      delaySec: delaySec.value,
      targetUrl: targetUrl.value,
    });
  }

  return Data.Result.Err(
    Data.Result.toErrors([
      projectId,
      screenshotId,
      imageType,
      delaySec,
      targetUrl,
    ])
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
  }): Promise<Data.Result.Result<Problem[], [Screenshot, Buffer]>> => {
    const findResult = await findOne(supabaseClient)({
      projectId,
      delaySec,
      targetUrl,
      imageType,
    });

    if (Data.Result.isErr(findResult)) {
      return findResult;
    }

    const screenshot = findResult.value;

    const filename = toFilename(screenshot);

    const downloadResponse = await supabaseClient.storage
      .from(SCREENSHOT_BUCKET_NAME)
      .download(filename);

    if (downloadResponse.error) {
      return Data.Result.Err([
        {
          message: `Supabase couldn't download screenshot. ${downloadResponse.error.message}`,
        },
      ]);
    }

    if (!downloadResponse.data) {
      return Data.Result.Err([
        {
          message:
            'Supabase did not return any data when downloading screenshot',
        },
      ]);
    }

    const blob = downloadResponse.data;

    const arrayBuffer = await blob.arrayBuffer();

    const buffer = Buffer.from(arrayBuffer);

    return Data.Result.Ok([screenshot, buffer]);
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
  }): Promise<Data.Result.Result<Problem[], Screenshot[]>> => {
    const response = await supabaseClient
      .from<definitions['screenshots']>('screenshots')
      .select('*')
      .match({ project_id: projectId })
      .order('created_at', { ascending: false });

    if (response.error) {
      return Data.Result.Err([{ message: response.error.message }]);
    }

    const decodings = response.data.map(decodeRow);

    const problems = Data.Result.toErrors(decodings).flat();

    if (problems.length > 0) {
      return Data.Result.Err(problems);
    }

    return Data.Result.Ok(Data.Result.toValues(decodings));
  };

export const getPublicUrl =
  (supabaseClient: SupabaseClient) =>
  async ({
    screenshotId,
    imageType,
  }: {
    imageType: Data.ImageType.ImageType;
    screenshotId: Data.ScreenshotId.ScreenshotId;
  }): Promise<Data.Result.Result<Problem, Data.Url.Url>> => {
    const filename = toFilename({ screenshotId, imageType });

    const response = await supabaseClient.storage
      .from(SCREENSHOT_BUCKET_NAME)
      .getPublicUrl(filename);

    if (response.error) {
      return Data.Result.Err({ message: response.error.message });
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
  ): Promise<Data.Result.Result<Problem[], Screenshot>> => {
    const findElseInsertResult = await findOneElseInsertOne(supabaseClient)({
      targetUrl,
      delaySec,
      projectId,
      imageType,
    });

    if (Data.Result.isErr(findElseInsertResult)) {
      return findElseInsertResult;
    }

    const screenshot = findElseInsertResult.value;

    const filename = toFilename({
      imageType: screenshot.imageType,
      screenshotId: screenshot.screenshotId,
    });

    const uploadResponse = await supabaseClient.storage
      .from(SCREENSHOT_BUCKET_NAME)
      .upload(filename, buffer, { upsert: true });

    if (uploadResponse.error) {
      return Data.Result.Err([{ message: uploadResponse.error.message }]);
    }

    return Data.Result.Ok(screenshot);
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
  }): Promise<Data.Result.Result<Problem[], Screenshot>> => {
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
      return Data.Result.Err([{ message: response.error.message }]);
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
  }): Promise<Data.Result.Result<Problem[], Screenshot>> => {
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
      return Data.Result.Err([{ message: response.error.message }]);
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
  }): Promise<Data.Result.Result<Problem[], Screenshot>> => {
    const findResult = await findOne(supabaseClient)({
      projectId,
      targetUrl,
      delaySec,
      imageType,
    });

    if (Data.Result.isOk(findResult)) {
      return findResult;
    }

    const insertResult = await insertOne(supabaseClient)({
      projectId,
      targetUrl,
      delaySec,
      imageType,
    });

    if (Data.Result.isErr(insertResult)) {
      return Data.Result.Err([...findResult.error, ...insertResult.error]);
    }

    return insertResult;
  };

export const ScreenshotDataAccess = (supabaseClient: SupabaseClient) => {
  return {
    put: put(supabaseClient),
    get: get(supabaseClient),
    findManyByProjectId: findManyByProjectId(supabaseClient),
    getPublicUrl: getPublicUrl(supabaseClient),
  };
};
