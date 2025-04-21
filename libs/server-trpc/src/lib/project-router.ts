import { Data } from '@screenshot-service/screenshot-service';
import { z } from 'zod';
import { publicProcedure, router } from './trpc-server';

export type Project = {
  projectId: Data.ProjectId.ProjectId;
  ownerId: Data.UserId.UserId;
  projectName: Data.ProjectName.ProjectName;
  whitelistedUrls: Data.Url.Url[];
};

const projectsData: Project[] = [];

export const projectRouter = router({
  findMany: publicProcedure
    .input(z.object({ ownerId: z.string() }))
    .query(async ({ input }) => {
      return projectsData.filter(
        (project) => project.ownerId === input.ownerId
      );
    }),

  findManyById: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      return projectsData.filter(
        (project) => project.projectId === input.projectId
      );
    }),

  delete: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ input }) => {
      const index = projectsData.findIndex(
        (project) => project.projectId === input.projectId
      );
      if (index !== -1) {
        const project = projectsData[index];
        projectsData.splice(index, 1);
        return project;
      }
      throw new Error('Project not found');
    }),

  create: publicProcedure
    .input(
      z.object({
        ownerId: z.string(),
        projectName: z.string(),
        whitelistedUrls: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      const newProject = {
        projectId:
          `project-${Date.now()}` as unknown as Data.ProjectId.ProjectId,
        ownerId: input.ownerId as unknown as Data.UserId.UserId,
        projectName:
          input.projectName as unknown as Data.ProjectName.ProjectName,
        whitelistedUrls: input.whitelistedUrls.map(
          (url) => url as unknown as Data.Url.Url
        ),
      };
      projectsData.push(newProject);
      return newProject;
    }),

  update: publicProcedure
    .input(
      z.object({
        projectId: z.string(),
        projectName: z.string().nullish(),
        whitelistedUrls: z.array(z.string()).nullish(),
      })
    )
    .mutation(async ({ input }) => {
      const index = projectsData.findIndex(
        (project) => project.projectId === input.projectId
      );
      if (index !== -1) {
        const updatedProject = { ...projectsData[index] };

        if (input.projectName !== null && input.projectName !== undefined) {
          updatedProject.projectName =
            input.projectName as unknown as Data.ProjectName.ProjectName;
        }

        if (
          input.whitelistedUrls !== null &&
          input.whitelistedUrls !== undefined
        ) {
          updatedProject.whitelistedUrls = input.whitelistedUrls.map(
            (url) => url as unknown as Data.Url.Url
          );
        }

        projectsData[index] = updatedProject;
        return projectsData[index];
      }
      throw new Error('Project not found');
    }),
});

export type ProjectRouter = typeof projectRouter;
