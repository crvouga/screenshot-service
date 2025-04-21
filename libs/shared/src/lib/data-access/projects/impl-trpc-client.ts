/* eslint-disable @typescript-eslint/no-explicit-any */
import { Data } from '@screenshot-service/screenshot-service';
import { z } from 'zod';
import { TrpcClient } from '../../trpc-client';
import { IProjectDataAccess } from './interface';

// Zod schemas for validation
const projectIdSchema = z.string().refine((val) => Data.ProjectId.is(val), {
  message: 'Invalid ProjectId format',
});

const userIdSchema = z
  .string()
  .refine((val) => Data.UserId.is(val), { message: 'Invalid UserId format' });

const projectNameSchema = z.string().refine((val) => Data.ProjectName.is(val), {
  message: 'Invalid ProjectName format',
});

const urlSchema = z
  .string()
  .refine((val) => Data.Url.is(val), { message: 'Invalid URL format' });

export const TrpcClientProjectDataAccess = ({
  trpcClient,
}: {
  trpcClient: TrpcClient;
}): IProjectDataAccess => {
  return {
    findManyOwnerId: async ({ ownerId }) => {
      try {
        const projects = await trpcClient.project.findMany.query({ ownerId });
        return Data.Result.Ok(projects);
      } catch (error) {
        return Data.Result.Err([
          {
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        ]);
      }
    },

    findManyById: async ({ projectId }) => {
      try {
        const projects = await trpcClient.project.findManyById.query({
          projectId,
        });
        return Data.Result.Ok(projects);
      } catch (error) {
        return Data.Result.Err([
          {
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        ]);
      }
    },

    deleteForever: async ({ projectId }) => {
      try {
        const project = await trpcClient.project.delete.mutate({ projectId });
        return Data.Result.Ok(project);
      } catch (error) {
        return Data.Result.Err([
          {
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        ]);
      }
    },

    insert: async ({ ownerId, projectName, whilelistedUrls }) => {
      try {
        // Validate inputs with Zod
        userIdSchema.parse(ownerId);
        projectNameSchema.parse(projectName);
        const validatedUrls = whilelistedUrls.map((url) =>
          urlSchema.parse(url)
        );

        const project = await trpcClient.project.create.mutate({
          ownerId,
          projectName,
          whitelistedUrls: validatedUrls,
        });
        return Data.Result.Ok(project);
      } catch (error) {
        return Data.Result.Err([
          {
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        ]);
      }
    },

    update: async ({ projectId, projectName, whitelistedUrls }) => {
      try {
        // Validate inputs with Zod
        projectIdSchema.parse(projectId);

        // Only validate projectName if it's provided
        if (projectName !== undefined && projectName !== null) {
          projectNameSchema.parse(projectName);
        }

        // Only validate whitelistedUrls if it's provided
        let validatedUrls;
        if (whitelistedUrls !== undefined && whitelistedUrls !== null) {
          validatedUrls = whitelistedUrls.map((url) => urlSchema.parse(url));
        }

        const project = await trpcClient.project.update.mutate({
          projectId,
          projectName,
          whitelistedUrls: validatedUrls,
        });
        return Data.Result.Ok(project);
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
