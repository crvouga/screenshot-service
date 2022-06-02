import { Data, DataAccess } from '@crvouga/screenshot-service';
import { useMutation, useQuery } from 'react-query';

export type Project = DataAccess.Projects.Project;

export const projectsQueryFilter = 'projects';

export const useProjectsQuery = ({
  ownerId,
}: {
  ownerId: Data.UserId.UserId;
}) => {
  return useQuery([projectsQueryFilter, ownerId], () =>
    DataAccess.Projects.findMany({ ownerId })
  );
};

export const useSingleProjectQuery = ({
  projectId,
}: {
  projectId: Data.ProjectId.ProjectId;
}) => {
  return useQuery([projectsQueryFilter, projectId], () =>
    DataAccess.Projects.findOne({ projectId })
  );
};

export const useCreateProjectMutation = () => {
  return useMutation(DataAccess.Projects.insert);
};

export const useUpdateProjectMutation = () => {
  return useMutation(DataAccess.Projects.update);
};

export const useDeleteProjectMutation = () => {
  return useMutation(DataAccess.Projects.deleteForever);
};
