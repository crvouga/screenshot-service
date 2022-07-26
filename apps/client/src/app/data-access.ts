import { Data } from '@screenshot-service/screenshot-service';
import * as Shared from '@screenshot-service/shared';
import constate from 'constate';
import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { appEventEmitter } from './app-event-emitter';
import { supabaseClient } from './supabase';

//
//
//
//
//
//
//

export const dataAccess = Shared.DataAccess(supabaseClient);

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
    dataAccess.project.findMany({ ownerId })
  );
};

export const useSingleProjectQuery = ({
  projectId,
}: {
  projectId: Data.ProjectId.ProjectId;
}) => {
  return useQuery(
    [projectsQueryFilter, projectId],
    () => dataAccess.project.findOne({ projectId }),
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

//
//
//
//
// Screenshot
//
//
//
//

export const useScreenshotsQuery = ({ projectId }: { projectId: string }) => {
  return useQuery(['screenshots', projectId], () =>
    dataAccess.screenshot.findManyByProjectId({ projectId })
  );
};

export const useScreenshotSrcQuery = ({
  screenshotId,
  imageType,
}: {
  screenshotId: Data.ScreenshotId.ScreenshotId;
  imageType: Data.ImageType.ImageType;
}) => {
  return useQuery(['screenshots', screenshotId], () =>
    dataAccess.screenshot.getPublicUrl({
      screenshotId,
      imageType,
    })
  );
};