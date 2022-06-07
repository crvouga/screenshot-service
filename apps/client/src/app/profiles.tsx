import { DataAccess } from '@screenshot-service/shared';
import constate from 'constate';
import { useEffect } from 'react';
import { useMutation, useQuery } from 'react-query';
import { appEventEmitter } from './app-event-emitter';
import { supabaseClient } from './supabase';

export type Profile = DataAccess.Profiles.Profile;

export const profileQueryFilter = 'profile';

export const useProfileQuery = ({ userId }: { userId: string }) => {
  return useQuery([profileQueryFilter, userId], () =>
    DataAccess.Profiles.getOne(supabaseClient)({ userId })
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
  return useMutation(DataAccess.Profiles.create(supabaseClient));
};

export const useUpdateProfileMutation = () => {
  return useMutation(DataAccess.Profiles.update(supabaseClient));
};

export const useDeleteProfileMutation = () => {
  return useMutation(DataAccess.Profiles.deleteForever(supabaseClient));
};
