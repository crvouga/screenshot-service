import { Data } from '@screenshot-service/screenshot-service';
import { DataAccess } from '@screenshot-service/shared';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { supabaseClient } from './supabase';

export type Project = DataAccess.Projects.Project;

const projectsQueryFilter = 'projects';

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
  const queryClient = useQueryClient();
  return useMutation(DataAccess.Projects.insert(supabaseClient), {
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.includes(projectsQueryFilter),
      });
    },
  });
};

export const useUpdateProjectMutation = () => {
  const queryClient = useQueryClient();
  return useMutation(DataAccess.Projects.update(supabaseClient), {
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.includes(projectsQueryFilter),
      });
    },
  });
};

export const useDeleteProjectMutation = () => {
  const queryClient = useQueryClient();
  return useMutation(DataAccess.Projects.deleteForever(supabaseClient), {
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.includes(projectsQueryFilter),
      });
    },
  });
};
