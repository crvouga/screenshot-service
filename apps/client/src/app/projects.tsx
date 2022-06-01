import { Data, DataAccess } from '@crvouga/screenshot-service';
import { useQuery } from 'react-query';

export const queryFilter = 'projects';

export const useProjectsQuery = ({
  ownerId,
}: {
  ownerId: Data.UserId.UserId;
}) => {
  return useQuery([queryFilter, ownerId], () =>
    DataAccess.Projects.findMany({ ownerId })
  );
};
