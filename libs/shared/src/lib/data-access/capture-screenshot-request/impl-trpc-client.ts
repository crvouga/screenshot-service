/* eslint-disable @typescript-eslint/no-explicit-any */
import { Data } from '@screenshot-service/screenshot-service';
import { trpcClient } from '../../trpc-client';
import { ICaptureScreenshotRequestDataAccess } from './interface';

export const TrpcClientCaptureScreenshotRequestDataAccess =
  (): ICaptureScreenshotRequestDataAccess => {
    return {
      insertNew: async ({
        requestId,
        targetUrl,
        projectId,
        imageType,
        delaySec,
        originUrl,
        strategy,
      }) => {
        try {
          const result =
            await trpcClient.captureScreenshotRequest.insertNew.mutate({
              requestId,
              targetUrl,
              projectId,
              imageType,
              delaySec,
              originUrl,
              strategy,
            });
          return Data.Result.Ok(result);
        } catch (error) {
          return Data.Result.Err([
            {
              message: error instanceof Error ? error.message : 'Unknown error',
            },
          ]);
        }
      },

      updateStatus: async ({ requestId, status }) => {
        try {
          await trpcClient.captureScreenshotRequest.updateStatus.mutate({
            requestId,
            status,
          });
          return Data.Result.Ok(Data.Unit);
        } catch (error) {
          return Data.Result.Err({
            message: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      },

      uploadScreenshot: async ({ requestId }, buffer) => {
        try {
          const result =
            await trpcClient.captureScreenshotRequest.uploadScreenshot.mutate({
              requestId,
              buffer,
            });
          return Data.Result.Ok(result as unknown as any);
        } catch (error) {
          return Data.Result.Err([
            {
              message: error instanceof Error ? error.message : 'Unknown error',
            },
          ]);
        }
      },

      findSucceededRequest: async ({
        targetUrl,
        delaySec,
        projectId,
        imageType,
      }) => {
        try {
          const result =
            await trpcClient.captureScreenshotRequest.findSucceededRequest.query(
              {
                targetUrl,
                delaySec,
                projectId,
                imageType,
              }
            );
          return Data.Result.Ok(
            result
              ? Data.Maybe.Just(result as unknown as any)
              : Data.Maybe.Nothing
          );
        } catch (error) {
          return Data.Result.Err([
            {
              message: error instanceof Error ? error.message : 'Unknown error',
            },
          ]);
        }
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
        try {
          const result =
            await trpcClient.captureScreenshotRequest.findOneElseInsert.mutate({
              requestId,
              targetUrl,
              projectId,
              imageType,
              delaySec,
              originUrl,
              strategy,
            });
          return Data.Result.Ok(result);
        } catch (error) {
          return Data.Result.Err([
            {
              message: error instanceof Error ? error.message : 'Unknown error',
            },
          ]);
        }
      },

      getPublicUrl: async ({ requestId, imageType, projectId }) => {
        try {
          const publicUrl =
            await trpcClient.captureScreenshotRequest.getPublicUrl.query({
              requestId,
              imageType,
              projectId,
            });
          return Data.Result.Ok(publicUrl as unknown as Data.Url.Url);
        } catch (error) {
          return Data.Result.Err([
            {
              message: error instanceof Error ? error.message : 'Unknown error',
            },
          ]);
        }
      },

      findMany: async ({ projectId, order, pageSize, page }) => {
        try {
          const results =
            await trpcClient.captureScreenshotRequest.findMany.query({
              projectId,
              order: order
                ? {
                    column: 'createdAt',
                    direction: order === 'OldestFirst' ? 'asc' : 'desc',
                  }
                : undefined,
              pageSize,
              page,
            });
          return Data.Result.Ok(results.data as unknown as any[]);
        } catch (error) {
          return Data.Result.Err([
            {
              message: error instanceof Error ? error.message : 'Unknown error',
            },
          ]);
        }
      },

      countCreatedBetween: async ({ dateRange, projectId }) => {
        try {
          const count =
            await trpcClient.captureScreenshotRequest.countCreatedBetween.query(
              {
                dateRange,
                projectId,
              }
            );
          return Data.Result.Ok(count);
        } catch (error) {
          return Data.Result.Err([
            {
              message: error instanceof Error ? error.message : 'Unknown error',
            },
          ]);
        }
      },

      countAll: async ({ projectId }) => {
        try {
          const count =
            await trpcClient.captureScreenshotRequest.countAll.query({
              projectId,
            });
          return Data.Result.Ok(count);
        } catch (error) {
          return Data.Result.Err([
            {
              message: error instanceof Error ? error.message : 'Unknown error',
            },
          ]);
        }
      },
    };
  };
