import { Data } from '@screenshot-service/screenshot-service';
import * as Shared from '@screenshot-service/shared';
import { Configuration } from '@screenshot-service/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import constate from 'constate';
import { useEffect } from 'react';
import { appEventEmitter } from './app-event-emitter';
import { supabaseClient } from './supabase-client';
import { trpcClient } from './trpc-client';

//
//
//
//
//
//
//

const USE_SUPABASE_CLIENT = false;

export const dataAccess: Shared.IDataAccess = USE_SUPABASE_CLIENT
  ? Shared.SupabaseDataAccess(supabaseClient)
  : Shared.TrpcClientDataAccess({ trpcClient });

//
//
//
// Profile
//
//
//

export type Profile = Shared.Profile;

export const profileQueryFilter = 'profile';

export const useProfileQuery = ({ userId }: { userId: string }) => {
  return useQuery([profileQueryFilter, userId], () =>
    dataAccess.profile.findOne({ userId })
  );
};

export const [ProfileContext, useProfileContext] = constate(
  ({ profile }: { profile: Profile }) => {
    useEffect(() => {
      appEventEmitter.emit('Profile', { profile });
    }, [profile]);

    return {
      profile,
    };
  }
);

export const useCreateProfileMutation = () => {
  return useMutation(dataAccess.profile.create);
};

export const useUpdateProfileMutation = () => {
  return useMutation(dataAccess.profile.update);
};

export const useDeleteProfileMutation = () => {
  return useMutation(dataAccess.profile.deleteForever);
};

//
//
//
// Configuration
//
//
//

export const useQueryConfiguration = () => {
  return useQuery(['configuration'], () => dataAccess.configuration.findOne());
};

export const [ConfigurationContext, useConfigurationContext] = constate(
  ({ configuration }: { configuration: Configuration }) => {
    return {
      configuration,
    };
  }
);

//
//
//
//
// Project
//
//
//
//

export type Project = Shared.Project;

const projectsQueryFilter = 'projects';

export const useProjectsQuery = ({
  ownerId,
}: {
  ownerId: Data.UserId.UserId;
}) => {
  return useQuery([projectsQueryFilter, ownerId], () =>
    dataAccess.project.findManyOwnerId({ ownerId })
  );
};

export const useSingleProjectQuery = ({
  projectId,
}: {
  projectId: Data.ProjectId.ProjectId;
}) => {
  return useQuery(
    [projectsQueryFilter, projectId],
    () => dataAccess.project.findManyById({ projectId }),
    { refetchOnWindowFocus: true }
  );
};

export const useCreateProjectMutation = () => {
  const queryClient = useQueryClient();
  return useMutation(dataAccess.project.insert, {
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.includes(projectsQueryFilter),
      });
    },
  });
};

export const useUpdateProjectMutation = () => {
  const queryClient = useQueryClient();
  return useMutation(dataAccess.project.update, {
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.includes(projectsQueryFilter),
      });
    },
  });
};

export const useDeleteProjectMutation = () => {
  const queryClient = useQueryClient();
  return useMutation(dataAccess.project.deleteForever, {
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.includes(projectsQueryFilter),
      });
    },
  });
};
