import { Data } from '@screenshot-service/screenshot-service';
import { z } from 'zod';
import { publicProcedure, router } from './trpc-server';
import { FileSystemMap } from './file-system-map';

export type Project = {
  projectId: Data.ProjectId.ProjectId;
  ownerId: Data.UserId.UserId;
  projectName: Data.ProjectName.ProjectName;
  whitelistedUrls: Data.Url.Url[];
};

const projectsData = new FileSystemMap<string, Project>('./data', 'projects');

export const projectRouter = router({
  findMany: publicProcedure
    .input(z.object({ ownerId: z.string() }))
    .query(async ({ input }) => {
      console.log(
        `findMany: Looking for projects with ownerId ${input.ownerId}`
      );
      const projects = Array.from(projectsData.values()).filter(
        (project) => project.ownerId === input.ownerId
      );
      console.log(
        `findMany: Found ${projects?.length} projects for ownerId ${input.ownerId}`
      );
      return projects;
    }),

  findManyById: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      console.log(
        `findManyById: Looking for projects with projectId ${input.projectId}`
      );
      const projects = Array.from(projectsData.values()).filter(
        (project) =>
          project &&
          typeof project.projectId === 'string' &&
          project.projectId === input.projectId
      );
      console.log(
        `findManyById: Found ${projects?.length} projects with projectId ${input.projectId}`
      );
      return projects;
    }),

  delete: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ input }) => {
      console.log(
        `delete: Attempting to delete project with projectId ${input.projectId}`
      );
      const index = Array.from(projectsData.values()).findIndex(
        (project) => project.projectId === input.projectId
      );
      if (index !== -1) {
        const project = projectsData[index];
        projectsData.delete(input.projectId);
        console.log(
          `delete: Successfully deleted project with projectId ${input.projectId}`
        );
        return project;
      }
      console.error(
        `delete: Project with projectId ${input.projectId} not found`
      );
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
      console.log(`create: Creating new project for ownerId ${input.ownerId}`);
      const newProject = {
        projectId:
          `project-${Date.now()}` as unknown as Data.ProjectId.ProjectId,
        ownerId: input.ownerId as unknown as Data.UserId.UserId,
        projectName:
          input.projectName as unknown as Data.ProjectName.ProjectName,
        whitelistedUrls: input.whitelistedUrls?.map(
          (url) => url as unknown as Data.Url.Url
        ),
      };
      projectsData.set(newProject.projectId, newProject);
      console.log(
        `create: Successfully created project with projectId ${newProject.projectId}`
      );
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
      console.log(`update: Updating project with projectId ${input.projectId}`);
      const project = projectsData.get(input.projectId);

      if (project) {
        const updatedProject = { ...project };

        if (input.projectName !== null && input.projectName !== undefined) {
          console.log(
            `update: Updating project name to "${input.projectName}"`
          );
          updatedProject.projectName =
            input.projectName as unknown as Data.ProjectName.ProjectName;
        }

        if (
          input.whitelistedUrls !== null &&
          input.whitelistedUrls !== undefined
        ) {
          console.log(
            `update: Updating whitelisted URLs (${input.whitelistedUrls?.length} URLs)`
          );
          updatedProject.whitelistedUrls = input.whitelistedUrls?.map(
            (url) => url as unknown as Data.Url.Url
          );
        }

        projectsData.set(input.projectId, updatedProject);
        console.log(
          `update: Successfully updated project with projectId ${input.projectId}`
        );

        return updatedProject;
      }

      console.error(
        `update: Project with projectId ${input.projectId} not found`
      );
      throw new Error('Project not found');
    }),
});

export type ProjectRouter = typeof projectRouter;
