import { Data } from '@screenshot-service/screenshot-service';
import { SupabaseClient } from '@supabase/supabase-js';
import { definitions } from '../supabase-types';

export type CaptureScreenshotRequest = {
  createdAt: string;
  requestId: Data.RequestId.RequestId;
  projectId: Data.ProjectId.ProjectId;
  imageType: Data.ImageType.ImageType;
  delaySec: Data.DelaySec.DelaySec;
  targetUrl: Data.TargetUrl.TargetUrl;
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

export const BUCKET_NAME = 'screenshots';

export const toFilename = ({
  imageType,
  requestId,
}: {
  imageType: Data.ImageType.ImageType;
  requestId: Data.RequestId.RequestId;
}) => {
  return `${requestId}.${imageType}`;
};

const decodeRow = (
  row: definitions['capture_screenshot_requests']
): Data.Result.Result<Data.Problem[], CaptureScreenshotRequest> => {
  const projectId = Data.ProjectId.decode(row.project_id);
  const requestId = Data.RequestId.decode(row.id);
  const targetUrl = Data.TargetUrl.decode(row.target_url);
  const originUrl = Data.TargetUrl.decode(row.origin_url);

  if (
    Data.Result.isOk(projectId) &&
    Data.Result.isOk(requestId) &&
    Data.Result.isOk(targetUrl) &&
    Data.Result.isOk(originUrl)
  ) {
    return Data.Result.Ok({
      requestId: requestId.value,
      createdAt: row.created_at,
      projectId: projectId.value,
      targetUrl: targetUrl.value,
      originUrl: originUrl.value,
      delaySec: Data.DelaySec.fromNumber(row.delay_sec),
      imageType: row.image_type,
      status: row.status,
      strategy: row.strategy,
    });
  }

  return Data.Result.Err(
    Data.Result.toErrors([targetUrl, projectId, requestId, originUrl])
  );
};

export const insertNew =
  (supabaseClient: SupabaseClient) =>
  async ({
    requestId,
    targetUrl,
    projectId,
    imageType,
    delaySec,
    originUrl,
    strategy,
  }: {
    requestId: Data.RequestId.RequestId;
    projectId: Data.ProjectId.ProjectId;
    imageType: Data.ImageType.ImageType;
    delaySec: Data.DelaySec.DelaySec;
    targetUrl: Data.TargetUrl.TargetUrl;
    originUrl: Data.Url.Url;
    strategy: Data.Strategy.Strategy;
  }): Promise<Data.Result.Result<Data.Problem[], CaptureScreenshotRequest>> => {
    const response = await supabaseClient
      .from<definitions['capture_screenshot_requests']>(
        'capture_screenshot_requests'
      )
      .insert({
        id: requestId,
        project_id: projectId,
        delay_sec: delaySec,
        image_type: imageType,
        origin_url: originUrl,
        strategy: strategy,
        target_url: targetUrl,
        created_at: undefined,
        status: 'Loading',
      })
      .single();

    if (response.error) {
      return Data.Result.Err([{ message: response.error.message }]);
    }

    const row = response.data;

    return decodeRow(row);
  };

export const updateStatus =
  (supabaseClient: SupabaseClient) =>
  async ({
    requestId,
    status,
  }: {
    requestId: Data.RequestId.RequestId;
    status: FinalStatus;
  }): Promise<Data.Result.Result<Data.Problem, Data.Unit>> => {
    const response = await supabaseClient
      .from<definitions['capture_screenshot_requests']>(
        'capture_screenshot_requests'
      )
      .update({ status: status })
      .eq('id', requestId);

    if (response.error) {
      return Data.Result.Err({ message: response.error.message });
    }

    return Data.Result.Ok(Data.Unit);
  };

export const uploadScreenshot =
  (supabaseClient: SupabaseClient) =>
  async (
    requestId: Data.RequestId.RequestId,
    buffer: Buffer
  ): Promise<Data.Result.Result<Data.Problem[], CaptureScreenshotRequest>> => {
    const findResult = await supabaseClient
      .from<definitions['capture_screenshot_requests']>(
        'capture_screenshot_requests'
      )
      .select('*')
      .eq('id', requestId)
      .single();

    if (findResult.error) {
      return Data.Result.Err([
        {
          message:
            'Failed to upload screenshot because there is no request associated with provided request id',
        },
        {
          message: findResult.error.message,
        },
      ]);
    }

    const decoded = decodeRow(findResult.data);

    if (decoded.type === 'Err') {
      return decoded;
    }

    const captureScreenshotRequest = decoded.value;

    const filename = toFilename(captureScreenshotRequest);

    const uploadResponse = await supabaseClient.storage
      .from(BUCKET_NAME)
      .upload(filename, buffer, { upsert: true });

    if (uploadResponse.error) {
      return Data.Result.Err([{ message: uploadResponse.error.message }]);
    }

    return Data.Result.Ok(captureScreenshotRequest);
  };

export const findSucceededRequest =
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
  }): Promise<
    Data.Result.Result<
      Data.Problem[],
      Data.Maybe.Maybe<CaptureScreenshotRequest>
    >
  > => {
    const targetStatus: Status = 'Succeeded_Network';

    const response = await supabaseClient
      .from<definitions['capture_screenshot_requests']>(
        'capture_screenshot_requests'
      )
      .select('*')
      .eq('project_id', projectId)
      .eq('target_url', targetUrl)
      .eq('image_type', imageType)
      .eq('delay_sec', delaySec)
      .eq('status', targetStatus);

    if (response.error) {
      return Data.Result.Err([{ message: response.error.message }]);
    }

    const row = response.data[0];

    if (!row) {
      return Data.Result.Ok(Data.Maybe.Nothing);
    }

    return Data.Result.mapOk(Data.Maybe.Just, decodeRow(row));
  };

export const findOneElseInsert =
  (supabaseClient: SupabaseClient) =>
  async ({
    requestId,
    targetUrl,
    projectId,
    imageType,
    delaySec,
    originUrl,
    strategy,
  }: {
    requestId: Data.RequestId.RequestId;
    projectId: Data.ProjectId.ProjectId;
    imageType: Data.ImageType.ImageType;
    delaySec: Data.DelaySec.DelaySec;
    targetUrl: Data.TargetUrl.TargetUrl;
    originUrl: Data.Url.Url;
    strategy: Data.Strategy.Strategy;
  }): Promise<Data.Result.Result<Data.Problem[], CaptureScreenshotRequest>> => {
    const findResult = await findSucceededRequest(supabaseClient)({
      targetUrl,
      delaySec,
      projectId,
      imageType,
    });

    if (findResult.type === 'Err') {
      return findResult;
    }

    const found = findResult.value;

    if (found.type === 'Just') {
      return Data.Result.Ok(found.value);
    }

    const insertResult = await insertNew(supabaseClient)({
      requestId,
      targetUrl,
      projectId,
      imageType,
      delaySec,
      originUrl,
      strategy,
    });

    return insertResult;
  };

export const getPublicUrl =
  (supabaseClient: SupabaseClient) =>
  async ({
    requestId,
    imageType,
  }: {
    imageType: Data.ImageType.ImageType;
    requestId: Data.RequestId.RequestId;
  }): Promise<Data.Result.Result<Data.Problem[], Data.Url.Url>> => {
    const filename = toFilename({ requestId, imageType });

    const response = await supabaseClient.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filename);

    if (response.error) {
      return Data.Result.Err([{ message: response.error.message }]);
    }

    const decoded = Data.Url.decode(response.publicURL);

    return Data.Result.mapErr(Array.of, decoded);
  };

const findManyWhere =
  (supabaseClient: SupabaseClient) =>
  async ({
    projectId,
    order,
  }: {
    projectId: Data.ProjectId.ProjectId;
    order: 'OldestFirst' | 'NewestFirst';
  }): Promise<
    Data.Result.Result<Data.Problem[], CaptureScreenshotRequest[]>
  > => {
    const response = await supabaseClient
      .from<definitions['capture_screenshot_requests']>(
        'capture_screenshot_requests'
      )
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: order === 'NewestFirst' });

    if (response.error) {
      return Data.Result.Err([{ message: response.error.message }]);
    }

    const results = response.data.map(decodeRow);

    const errors = Data.Result.toErrors(results).flat();

    if (errors.length > 0) {
      return Data.Result.Err(errors);
    }

    return Data.Result.Ok(Data.Result.toValues(results));
  };

export const CaptureScreenshotRequestDataAccess = (
  supabaseClient: SupabaseClient
) => {
  return {
    insertNew: insertNew(supabaseClient),
    getPublicUrl: getPublicUrl(supabaseClient),
    uploadScreenshot: uploadScreenshot(supabaseClient),
    findSucceededRequest: findSucceededRequest(supabaseClient),
    updateStatus: updateStatus(supabaseClient),
    findMany: findManyWhere(supabaseClient),
  };
};
