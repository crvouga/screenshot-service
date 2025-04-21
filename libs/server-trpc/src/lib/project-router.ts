import { Data } from '@screenshot-service/screenshot-service';

import { z } from 'zod';
import { FileSystemMap } from './file-system-map';
import { publicProcedure, router } from './trpc-server';

export type Project = {
  projectId: Data.ProjectId.ProjectId;
  ownerId: Data.UserId.UserId;
  projectName: Data.ProjectName.ProjectName;
  whitelistedUrls: Data.Url.Url[];
};

const projectsData = new FileSystemMap<string, Project>('./data', 'projects');

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

export const projectRouter = router({
  findMany: publicProcedure
    .input(z.object({ ownerId: userIdSchema }))
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
    .input(z.object({ projectId: projectIdSchema }))
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
    .input(z.object({ projectId: projectIdSchema }))
    .mutation(async ({ input }) => {
      console.log(
        `delete: Attempting to delete project with projectId ${input.projectId}`
      );
      const project = projectsData.get(input.projectId);

      if (project) {
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
        ownerId: userIdSchema,
        projectName: projectNameSchema,
        whitelistedUrls: z.array(urlSchema),
      })
    )
    .mutation(async ({ input }) => {
      console.log(`create: Creating new project for ownerId ${input.ownerId}`);
      const projectId = `project-${Date.now()}`;

      // Validate the generated projectId
      if (!Data.ProjectId.is(projectId)) {
        throw new Error('Failed to generate valid ProjectId');
      }

      const newProject: Project = {
        projectId,
        ownerId: Data.Result.unwrap(Data.UserId.decode(input.ownerId)),
        projectName: Data.Result.unwrap(
          Data.ProjectName.decode(input.projectName)
        ),
        whitelistedUrls: input.whitelistedUrls.map((url) =>
          Data.Result.unwrap(Data.Url.decode(url))
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
        projectId: projectIdSchema,
        projectName: projectNameSchema.nullish(),
        whitelistedUrls: z.array(urlSchema).nullish(),
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
          updatedProject.projectName = Data.Result.unwrap(
            Data.ProjectName.decode(input.projectName)
          );
        }

        if (
          input.whitelistedUrls !== null &&
          input.whitelistedUrls !== undefined
        ) {
          console.log(
            `update: Updating whitelisted URLs (${input.whitelistedUrls?.length} URLs)`
          );
          updatedProject.whitelistedUrls = input.whitelistedUrls.map((url) =>
            Data.Result.unwrap(Data.Url.decode(url))
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
