/* eslint-disable @typescript-eslint/no-unused-vars */
import { z } from 'zod';
import { publicProcedure, router } from './trpc-server';
import { Data } from '@screenshot-service/screenshot-service';

export type CaptureScreenshotRequest = {
  createdAt: string;
  requestId: Data.RequestId.RequestId;
  projectId: Data.ProjectId.ProjectId;
  imageType: Data.ImageType.ImageType;
  delaySec: Data.DelaySec.DelaySec;
  targetUrl: Data.Url.Url;
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

// In-memory storage using hash maps
const screenshotRequests = new Map<string, CaptureScreenshotRequest>();
const screenshotBuffers = new Map<string, Buffer>();

export const captureScreenshotRequestRouter = router({
  insertNew: publicProcedure
    .input(
      z.object({
        requestId: z.string(),
        targetUrl: z.string(),
        projectId: z.string(),
        imageType: z.string(),
        delaySec: z.number(),
        originUrl: z.string(),
        strategy: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Store the request in our hash map
      const request: CaptureScreenshotRequest = {
        requestId: input.requestId as unknown as Data.RequestId.RequestId,
        projectId: input.projectId as unknown as Data.ProjectId.ProjectId,
        imageType: input.imageType as unknown as Data.ImageType.ImageType,
        delaySec: input.delaySec as unknown as Data.DelaySec.DelaySec,
        targetUrl: input.targetUrl as unknown as Data.Url.Url,
        originUrl: input.originUrl as unknown as Data.Url.Url,
        strategy: input.strategy as unknown as Data.Strategy.Strategy,
        createdAt: new Date().toISOString(),
        status: 'Loading' as InitialStatus,
      };
      screenshotRequests.set(input.requestId, request);
      return request;
    }),

  updateStatus: publicProcedure
    .input(
      z.object({
        requestId: z.string(),
        status: z.enum([
          'Loading',
          'Cancelled',
          'Failed',
          'Succeeded_Cached',
          'Succeeded_Network',
        ]),
      })
    )
    .mutation(async ({ input }) => {
      // Update status directly on the request object
      const request = screenshotRequests.get(input.requestId);
      if (request) {
        request.status = input.status as Status;
        screenshotRequests.set(input.requestId, request);
      }
      return;
    }),

  uploadScreenshot: publicProcedure
    .input(
      z.object({
        requestId: z.string(),
        buffer: z.any(), // In a real implementation, you'd validate this is a Buffer
      })
    )
    .mutation(async ({ input }) => {
      // Store the screenshot buffer in our hash map
      screenshotBuffers.set(input.requestId, input.buffer);
      return { success: true };
    }),

  findSucceededRequest: publicProcedure
    .input(
      z.object({
        targetUrl: z.string(),
        delaySec: z.number(),
        projectId: z.string(),
        imageType: z.string(),
      })
    )
    .query(async ({ input }) => {
      // Find a succeeded request from our hash map
      for (const [_, request] of screenshotRequests.entries()) {
        if (
          request.targetUrl === input.targetUrl &&
          request.delaySec === input.delaySec &&
          request.projectId === input.projectId &&
          request.imageType === input.imageType &&
          request.status === 'Succeeded_Cached'
        ) {
          return request;
        }
      }
      return null;
    }),

  findOneElseInsert: publicProcedure
    .input(
      z.object({
        requestId: z.string(),
        targetUrl: z.string(),
        projectId: z.string(),
        imageType: z.string(),
        delaySec: z.number(),
        originUrl: z.string(),
        strategy: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Check if request exists, otherwise insert
      const existingRequest = screenshotRequests.get(input.requestId);
      if (!existingRequest) {
        const request: CaptureScreenshotRequest = {
          requestId: input.requestId as unknown as Data.RequestId.RequestId,
          projectId: input.projectId as unknown as Data.ProjectId.ProjectId,
          imageType: input.imageType as unknown as Data.ImageType.ImageType,
          delaySec: input.delaySec as unknown as Data.DelaySec.DelaySec,
          targetUrl: input.targetUrl as unknown as Data.Url.Url,
          originUrl: input.originUrl as unknown as Data.Url.Url,
          strategy: input.strategy as unknown as Data.Strategy.Strategy,
          createdAt: new Date().toISOString(),
          status: 'Loading' as InitialStatus,
        };
        screenshotRequests.set(input.requestId, request);
        return request;
      }
      return existingRequest;
    }),

  getPublicUrl: publicProcedure
    .input(
      z.object({
        requestId: z.string(),
        imageType: z.string(),
        projectId: z.string(),
      })
    )
    .query(async ({ input }) => {
      // Generate a URL based on the request ID
      return `https://example.com/screenshots/${input.requestId}.${input.imageType}`;
    }),

  findMany: publicProcedure
    .input(
      z.object({
        projectId: z.string(),
        order: z
          .object({ column: z.string(), direction: z.string() })
          .optional(),
        pageSize: z.number().optional(),
        page: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      // Filter requests by project ID
      const projectRequests = Array.from(screenshotRequests.values()).filter(
        (request) => request.projectId === input.projectId
      );

      // Apply pagination
      const pageSize = input.pageSize || 10;
      const page = input.page || 1;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;

      return {
        data: projectRequests.slice(start, end),
        total: projectRequests.length,
      };
    }),

  countCreatedBetween: publicProcedure
    .input(
      z.object({
        dateRange: z.object({ start: z.string(), end: z.string() }),
        projectId: z.string(),
      })
    )
    .query(async ({ input }) => {
      // Calculate count dynamically from the requests
      return Array.from(screenshotRequests.values()).filter(
        (request) =>
          request.projectId === input.projectId &&
          request.createdAt >= input.dateRange.start &&
          request.createdAt <= input.dateRange.end
      ).length;
    }),

  countAll: publicProcedure
    .input(
      z.object({
        projectId: z.string(),
      })
    )
    .query(async ({ input }) => {
      // Count all requests for the project
      return Array.from(screenshotRequests.values()).filter(
        (request) => request.projectId === input.projectId
      ).length;
    }),
});

export type CaptureScreenshotRequestRouter =
  typeof captureScreenshotRequestRouter;
