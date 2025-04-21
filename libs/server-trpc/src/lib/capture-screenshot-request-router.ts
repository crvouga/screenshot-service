import { Data } from '@screenshot-service/screenshot-service';
import { getServerBaseUrl } from '@screenshot-service/shared-core';
import { Express } from 'express';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { FileSystemMap } from './file-system-map';
import { publicProcedure, router } from './trpc-server';

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
export const screenshotRequests = new FileSystemMap<
  string,
  CaptureScreenshotRequest
>('./data', 'screenshot-requests');

// Zod schemas for validation
const requestIdSchema = z.string().refine((val) => Data.RequestId.is(val), {
  message: 'Invalid RequestId format',
});

const projectIdSchema = z.string().refine((val) => Data.ProjectId.is(val), {
  message: 'Invalid ProjectId format',
});

const imageTypeSchema = z.string().refine((val) => Data.ImageType.is(val), {
  message: 'Invalid ImageType format',
});

const delaySecSchema = z.number().refine((val) => Data.DelaySec.is(val), {
  message: 'Invalid DelaySec value',
});

const urlSchema = z
  .string()
  .refine((val) => Data.Url.is(val), { message: 'Invalid URL format' });

const strategySchema = z.string().refine((val) => Data.Strategy.is(val), {
  message: 'Invalid Strategy value',
});

export const toFilename = ({
  imageType,
  requestId,
  projectId,
}: {
  imageType: Data.ImageType.ImageType;
  requestId: Data.RequestId.RequestId;
  projectId: Data.ProjectId.ProjectId;
}) => {
  return `${projectId}/${requestId}.${imageType}`;
};

export const BUCKET_NAME = `screenshots`;

// Helper function to get screenshot file path
const getScreenshotPath = (
  projectId: string,
  requestId: string,
  imageType: string
) => {
  const dir = path.join('./data', BUCKET_NAME, projectId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, `${requestId}.${imageType.toLowerCase()}`);
};

export const captureScreenshotRequestRouterExpress = (app: Express) => {
  // Upload screenshot endpoint
  app.post('/api/screenshots/upload', async (req, res) => {
    try {
      if (!req.is('multipart/form-data')) {
        return res
          .status(400)
          .json({ error: 'Content-Type must be multipart/form-data' });
      }

      const form = formidable({});
      const [fields, files] = await form.parse(req);

      const requestId = fields?.['requestId']?.[0];
      const buffer = files?.['buffer']?.[0];

      if (!requestId || !buffer) {
        return res.status(400).json({ error: 'Missing requestId or buffer' });
      }

      // Get the request to get projectId and imageType
      const request = screenshotRequests.get(requestId);
      if (!request) {
        return res
          .status(404)
          .json({ error: `Request ${requestId} not found` });
      }

      // Save the screenshot to filesystem
      const filePath = getScreenshotPath(
        request.projectId,
        request.requestId,
        request.imageType
      );
      fs.writeFileSync(filePath, fs.readFileSync(buffer.filepath));

      console.log(
        `uploadScreenshot: Successfully stored screenshot for ${requestId} at ${filePath}`
      );
      return res.json({ success: true });
    } catch (error) {
      console.error('Error uploading screenshot:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Serve screenshot files from filesystem
  app.get('/api/screenshots/:projectId/:requestId.:imageType', (req, res) => {
    const { projectId, requestId, imageType } = req.params;
    const filePath = path.join(
      './data',
      BUCKET_NAME,
      projectId,
      `${requestId}.${imageType}`
    );

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`Screenshot not found: ${filePath}`);
      return res.status(404).send('Screenshot not found');
    }

    // Determine content type based on file extension
    const extension = `.${imageType.toLowerCase()}`;
    let contentType = 'image/png'; // default
    if (extension === '.jpg' || extension === '.jpeg') {
      contentType = 'image/jpeg';
    } else if (extension === '.webp') {
      contentType = 'image/webp';
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    fs.createReadStream(filePath).pipe(res);
    return;
  });
};

export const createCaptureScreenshotRequestRouter = ({
  env,
}: {
  env: { PROD: boolean };
}) =>
  router({
    insertNew: publicProcedure
      .input(
        z.object({
          requestId: requestIdSchema,
          targetUrl: urlSchema,
          projectId: projectIdSchema,
          imageType: imageTypeSchema,
          delaySec: delaySecSchema,
          originUrl: urlSchema,
          strategy: strategySchema,
        })
      )
      .mutation(async ({ input }) => {
        console.log(
          `insertNew: Creating new request with ID ${input.requestId}`
        );
        // Store the request in our hash map
        const request: CaptureScreenshotRequest = {
          requestId: Data.Result.unwrap(Data.RequestId.decode(input.requestId)),
          projectId: Data.Result.unwrap(Data.ProjectId.decode(input.projectId)),
          imageType: Data.Result.unwrap(Data.ImageType.decode(input.imageType)),
          delaySec: Data.Result.unwrap(Data.DelaySec.decode(input.delaySec)),
          targetUrl: Data.Result.unwrap(Data.Url.decode(input.targetUrl)),
          originUrl: Data.Result.unwrap(Data.Url.decode(input.originUrl)),
          strategy: Data.Result.unwrap(Data.Strategy.decode(input.strategy)),
          createdAt: new Date().toISOString(),
          status: 'Loading' as InitialStatus,
        };
        screenshotRequests.set(input.requestId, request);
        console.log(
          `insertNew: Successfully created request ${input.requestId}`
        );
        return request;
      }),

    findOne: publicProcedure
      .input(z.object({ requestId: requestIdSchema }))
      .query(async ({ input }) => {
        return screenshotRequests.get(input.requestId);
      }),

    updateStatus: publicProcedure
      .input(
        z.object({
          requestId: requestIdSchema,
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
        console.log(
          `updateStatus: Updating request ${input.requestId} to status ${input.status}`
        );
        // Update status directly on the request object
        const request = screenshotRequests.get(input.requestId);
        if (request) {
          request.status = input.status as Status;
          screenshotRequests.set(input.requestId, request);
          console.log(
            `updateStatus: Successfully updated status for ${input.requestId}`
          );
        } else {
          console.error(`updateStatus: Request ${input.requestId} not found`);
        }
        return;
      }),

    findSucceededRequest: publicProcedure
      .input(
        z.object({
          targetUrl: urlSchema,
          delaySec: delaySecSchema,
          projectId: projectIdSchema,
          imageType: imageTypeSchema,
        })
      )
      .query(async ({ input }) => {
        console.log(
          `findSucceededRequest: Searching for succeeded request with targetUrl ${input.targetUrl}`
        );
        // Find a succeeded request from our hash map
        for (const request of screenshotRequests.values()) {
          if (
            request.targetUrl === input.targetUrl &&
            request.delaySec === input.delaySec &&
            request.projectId === input.projectId &&
            request.imageType === input.imageType &&
            request.status === 'Succeeded_Cached'
          ) {
            console.log(
              `findSucceededRequest: Found matching request ${request.requestId}`
            );
            return request;
          }
        }
        console.log(`findSucceededRequest: No matching request found`);
        return null;
      }),

    findOneElseInsert: publicProcedure
      .input(
        z.object({
          requestId: requestIdSchema,
          targetUrl: urlSchema,
          projectId: projectIdSchema,
          imageType: imageTypeSchema,
          delaySec: delaySecSchema,
          originUrl: urlSchema,
          strategy: strategySchema,
        })
      )
      .mutation(async ({ input }) => {
        console.log(
          `findOneElseInsert: Looking for request ${input.requestId}`
        );
        // Check if request exists, otherwise insert
        const existingRequest = screenshotRequests.get(input.requestId);
        if (!existingRequest) {
          console.log(
            `findOneElseInsert: Request ${input.requestId} not found, creating new one`
          );
          const request: CaptureScreenshotRequest = {
            requestId: Data.Result.unwrap(
              Data.RequestId.decode(input.requestId)
            ),
            projectId: Data.Result.unwrap(
              Data.ProjectId.decode(input.projectId)
            ),
            imageType: Data.Result.unwrap(
              Data.ImageType.decode(input.imageType)
            ),
            delaySec: Data.Result.unwrap(Data.DelaySec.decode(input.delaySec)),
            targetUrl: Data.Result.unwrap(Data.Url.decode(input.targetUrl)),
            originUrl: Data.Result.unwrap(Data.Url.decode(input.originUrl)),
            strategy: Data.Result.unwrap(Data.Strategy.decode(input.strategy)),
            createdAt: new Date().toISOString(),
            status: 'Loading' as InitialStatus,
          };
          screenshotRequests.set(input.requestId, request);
          console.log(
            `findOneElseInsert: Successfully created request ${input.requestId}`
          );
          return request;
        }
        console.log(
          `findOneElseInsert: Found existing request ${input.requestId}`
        );
        return existingRequest;
      }),

    getPublicUrl: publicProcedure
      .input(
        z.object({
          requestId: requestIdSchema,
          imageType: imageTypeSchema,
          projectId: projectIdSchema,
        })
      )
      .query(async ({ input }) => {
        const filename = toFilename({
          projectId: Data.Result.unwrap(Data.ProjectId.decode(input.projectId)),
          requestId: Data.Result.unwrap(Data.RequestId.decode(input.requestId)),
          imageType: Data.Result.unwrap(Data.ImageType.decode(input.imageType)),
        });

        const baseUrl = getServerBaseUrl({
          prod: env.PROD,
        });

        return `${baseUrl}/api/screenshots/${filename}`;
      }),

    findMany: publicProcedure
      .input(
        z.object({
          projectId: projectIdSchema,
          order: z
            .object({ column: z.string(), direction: z.string() })
            .optional(),
          pageSize: z.number().optional(),
          page: z.number().optional(),
        })
      )
      .query(async ({ input }) => {
        console.log(
          `findMany: Searching for requests with projectId ${input.projectId}`
        );
        // Filter requests by project ID
        const projectRequests = Array.from(screenshotRequests.values()).filter(
          (request) => request.projectId === input.projectId
        );

        // Apply pagination
        const pageSize = input.pageSize || 10;
        const page = input.page || 1;
        const start = (page - 1) * pageSize;
        const end = start + pageSize;

        console.log(
          `findMany: Found ${projectRequests?.length} requests, returning page ${page} with size ${pageSize}`
        );
        return {
          data: projectRequests.slice(start, end),
          total: projectRequests?.length,
        };
      }),

    countCreatedBetween: publicProcedure
      .input(
        z.object({
          dateRange: z.object({ start: z.string(), end: z.string() }),
          projectId: projectIdSchema,
        })
      )
      .query(async ({ input }) => {
        console.log(
          `countCreatedBetween: Counting requests for project ${input.projectId} between ${input.dateRange.start} and ${input.dateRange.end}`
        );
        // Calculate count dynamically from the requests
        const count = Array.from(screenshotRequests.values()).filter(
          (request) =>
            request.projectId === input.projectId &&
            request.createdAt >= input.dateRange.start &&
            request.createdAt <= input.dateRange.end
        )?.length;
        console.log(`countCreatedBetween: Found ${count} requests`);
        return count;
      }),

    countAll: publicProcedure
      .input(
        z.object({
          projectId: projectIdSchema,
        })
      )
      .query(async ({ input }) => {
        console.log(
          `countAll: Counting all requests for project ${input.projectId}`
        );
        // Count all requests for the project
        const count = Array.from(screenshotRequests.values()).filter(
          (request) => request.projectId === input.projectId
        )?.length;
        console.log(
          `countAll: Found ${count} requests for project ${input.projectId}`
        );
        return count;
      }),
  });

export type CaptureScreenshotRequestRouter =
  typeof createCaptureScreenshotRequestRouter;
