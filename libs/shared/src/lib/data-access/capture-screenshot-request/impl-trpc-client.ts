/* eslint-disable @typescript-eslint/no-explicit-any */
import { Data } from '@screenshot-service/screenshot-service';
import { z } from 'zod';
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
          await trpcClient.captureScreenshotRequest.uploadScreenshot.mutate({
            requestId,
            buffer,
          });
          const got = await trpcClient.captureScreenshotRequest.findOne.query({
            requestId,
          });
          if (!got) {
            return Data.Result.Err([{ message: 'Request not found' }]);
          }
          return Data.Result.Ok(got);
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
            result ? Data.Maybe.Just(result) : Data.Maybe.Nothing
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

          // Validate that the returned value is a valid URL
          const urlSchema = z.string().refine((val) => Data.Url.is(val), {
            message: 'Invalid URL format',
          });

          const validatedUrl = urlSchema.parse(publicUrl);
          return Data.Result.Ok(
            Data.Result.unwrap(Data.Url.decode(validatedUrl))
          );
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
          return Data.Result.Ok(results.data);
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
