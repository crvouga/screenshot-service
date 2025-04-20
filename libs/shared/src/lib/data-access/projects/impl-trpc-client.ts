/* eslint-disable @typescript-eslint/no-explicit-any */
import { Data } from '@screenshot-service/screenshot-service';
import { trpc } from '../../trpc-client';
import { IProjectDataAccess } from './interface';

export const TrpcClientProjectDataAccess = (): IProjectDataAccess => {
  return {
    findManyOwnerId: async ({ ownerId }) => {
      try {
        const projects = await trpc.project.findMany.query({ ownerId });
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
        const projects = await trpc.project.findManyById.query({ projectId });
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
        const project = await trpc.project.delete.mutate({ projectId });
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
        const project = await trpc.project.create.mutate({
          ownerId,
          projectName,
          whitelistedUrls: whilelistedUrls,
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
        const project = await trpc.project.update.mutate({
          projectId,
          projectName: projectName as unknown as Data.ProjectName.ProjectName,
          whitelistedUrls: whitelistedUrls as unknown as Data.Url.Url[],
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
