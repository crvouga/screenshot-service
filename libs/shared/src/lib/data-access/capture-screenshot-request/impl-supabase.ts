import { Data } from '@screenshot-service/screenshot-service';
import { SupabaseClient } from '@supabase/supabase-js';
import { toRateLimitErrorMessage } from '../../configuration';
import { getToday } from '../../date';
import { definitions } from '../../supabase-types';
import { IConfigurationDataAccess } from '../configuration/interface';
import { BUCKET_NAME, toFilename } from '../screenshot-storage';
import {
  CaptureScreenshotRequest,
  ICaptureScreenshotRequestDataAccess,
} from './interface';

const decodeRow = (
  row: definitions['capture_screenshot_requests']
): Data.Result.Result<Data.Problem[], CaptureScreenshotRequest> => {
  const projectId = Data.ProjectId.decode(row.project_id);
  const requestId = Data.RequestId.decode(row.id);
  const targetUrl = Data.Url.decode(row.target_url);
  const originUrl = Data.Url.decode(row.origin_url);

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

export const SupabaseCaptureScreenshotRequestDataAccess = ({
  supabaseClient,
  configurationDataAccess,
}: {
  supabaseClient: SupabaseClient;
  configurationDataAccess: IConfigurationDataAccess;
}): ICaptureScreenshotRequestDataAccess => {
  const insertNew: ICaptureScreenshotRequestDataAccess['insertNew'] = async ({
    requestId,
    targetUrl,
    projectId,
    imageType,
    delaySec,
    originUrl,
    strategy,
  }) => {
    const countResult = await (async ({ dateRange, projectId }) => {
      const response = await supabaseClient
        .from<definitions['capture_screenshot_requests']>(
          'capture_screenshot_requests'
        )
        .select('*', { count: 'exact' })
        .eq('project_id', projectId)
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);

      if (response.error) {
        return Data.Result.Err([{ message: response.error.message }]);
      }

      const count = response.count ?? response.data.length;

      return Data.Result.Ok(count);
    })({
      dateRange: getToday(),
      projectId,
    });

    if (countResult.type === 'Err') {
      return countResult;
    }

    const count = countResult.value;

    const configurationResult = await configurationDataAccess.findOne();

    if (configurationResult.type === 'Err') {
      return configurationResult;
    }

    const configuration = configurationResult.value;

    if (count >= configuration.maxDailyRequests) {
      return Data.Result.Err([
        { message: toRateLimitErrorMessage(configuration) },
      ]);
    }

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

  return {
    insertNew,

    updateStatus: async ({ requestId, status }) => {
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
    },

    uploadScreenshot: async ({ requestId }, buffer) => {
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
    },

    findSucceededRequest: async ({
      targetUrl,
      delaySec,
      projectId,
      imageType,
    }) => {
      const targetStatus = 'Succeeded_Network';

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
    },

    findOneElseInsert: async ({
      requestId,
      targetUrl,
      projectId,
      imageType,
      delaySec,
      originUrl,
      strategy,
    }) => {
      const findResult = await (async ({
        targetUrl,
        delaySec,
        projectId,
        imageType,
      }) => {
        const targetStatus = 'Succeeded_Network';

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
      })({
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

      return insertNew({
        requestId,
        targetUrl,
        projectId,
        imageType,
        delaySec,
        originUrl,
        strategy,
      });
    },

    getPublicUrl: async ({ requestId, imageType, projectId }) => {
      const filename = toFilename({ projectId, requestId, imageType });

      const response = await supabaseClient.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filename);

      if (response.error) {
        return Data.Result.Err([{ message: response.error.message }]);
      }

      const decoded = Data.Url.decode(response.publicURL);

      return Data.Result.mapErr(Array.of, decoded);
    },

    findMany: async ({ projectId, order, pageSize, page }) => {
      const from = page * pageSize;
      const to = from + pageSize;
      const response = await supabaseClient
        .from<definitions['capture_screenshot_requests']>(
          'capture_screenshot_requests'
        )
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: order === 'OldestFirst' })
        .range(from, to);

      if (response.error) {
        return Data.Result.Err([{ message: response.error.message }]);
      }

      const results = response.data.map(decodeRow);

      const errors = Data.Result.toErrors(results).flat();

      if (errors.length > 0) {
        return Data.Result.Err(errors);
      }

      return Data.Result.Ok(Data.Result.toValues(results));
    },

    countCreatedBetween: async ({ dateRange, projectId }) => {
      const response = await supabaseClient
        .from<definitions['capture_screenshot_requests']>(
          'capture_screenshot_requests'
        )
        .select('*', { count: 'exact' })
        .eq('project_id', projectId)
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);

      if (response.error) {
        return Data.Result.Err([{ message: response.error.message }]);
      }

      const count = response.count ?? response.data.length;

      return Data.Result.Ok(count);
    },

    countAll: async ({ projectId }) => {
      const response = await supabaseClient
        .from<definitions['capture_screenshot_requests']>(
          'capture_screenshot_requests'
        )
        .select('*', { count: 'exact' })
        .eq('project_id', projectId);

      if (response.error) {
        return Data.Result.Err([{ message: response.error.message }]);
      }

      const count = response.count ?? response.data.length;

      return Data.Result.Ok(count);
    },
  };
};
