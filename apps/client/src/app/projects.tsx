import { Data } from '@screenshot-service/screenshot-service';
import { DataAccess } from '@screenshot-service/shared';
import { useMutation, useQuery } from 'react-query';
import { supabaseClient } from './supabase';

export type Project = DataAccess.Projects.Project;

export const projectsQueryFilter = 'projects';

export const useProjectsQuery = ({
  ownerId,
}: {
  ownerId: Data.UserId.UserId;
}) => {
  return useQuery([projectsQueryFilter, ownerId], () =>
    DataAccess.Projects.findMany(supabaseClient)({ ownerId })
  );
};

export const useSingleProjectQuery = ({
  projectId,
}: {
  projectId: Data.ProjectId.ProjectId;
}) => {
  return useQuery(
    [projectsQueryFilter, projectId],
    () => DataAccess.Projects.findOne(supabaseClient)({ projectId }),
    { refetchOnWindowFocus: true }
  );
};

export const useCreateProjectMutation = () => {
  return useMutation(DataAccess.Projects.insert(supabaseClient));
};

export const useUpdateProjectMutation = () => {
  return useMutation(DataAccess.Projects.update(supabaseClient));
};

export const useDeleteProjectMutation = () => {
  return useMutation(DataAccess.Projects.deleteForever(supabaseClient));
};
