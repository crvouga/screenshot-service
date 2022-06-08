import { Data } from '@screenshot-service/screenshot-service';
import { Session } from '@supabase/supabase-js';
import constate from 'constate';
import { useEffect, useState } from 'react';
import { supabaseClient } from './supabase';

type IAuthState =
  | { type: 'Loading' }
  | { type: 'LoggedIn'; userId: Data.UserId.UserId; defaultName: string }
  | { type: 'LoggedOut' };

const toAuthState = (session: Session | null): IAuthState => {
  const decodedUserId = Data.UserId.decode(session?.user?.id);
  const defaultName =
    session?.user?.user_metadata?.['name'] ??
    session?.user?.user_metadata?.['full_name'] ??
    '';

  if (decodedUserId.type === 'Ok') {
    return {
      type: 'LoggedIn',
      userId: decodedUserId.value,
      defaultName: defaultName,
    };
  }

  return { type: 'LoggedOut' };
};

export const useAuthState = () => {
  const [authState, setAuthState] = useState<IAuthState>({ type: 'Loading' });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setAuthState(toAuthState(supabaseClient.auth.session()));
    }, 1000);

    supabaseClient.auth.onAuthStateChange((event, session) => {
      clearTimeout(timeout);
      setAuthState(toAuthState(session));
    });
  }, []);

  return authState;
};

export const [AuthUserContext, useAuthUser] = constate(
  ({
    userId,
    defaultName,
  }: {
    userId: Data.UserId.UserId;
    defaultName: string;
  }) => {
    return {
      userId,
      defaultName,
    };
  }
);
