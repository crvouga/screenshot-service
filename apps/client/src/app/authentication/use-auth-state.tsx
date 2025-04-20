import { Data } from '@screenshot-service/screenshot-service';
import constate from 'constate';
import { useEffect, useState } from 'react';
import { authApi } from './auth-api/impl';

type IAuthState =
  | { type: 'Loading' }
  | { type: 'LoggedIn'; userId: Data.UserId.UserId; defaultName: string }
  | { type: 'LoggedOut' };

export const useAuthState = () => {
  const [authState, setAuthState] = useState<IAuthState>({ type: 'Loading' });

  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const user = await authApi.getCurrentUser();

        if (user) {
          setAuthState({
            type: 'LoggedIn',
            userId: user.userId,
            defaultName: '',
          });
        } else {
          setAuthState({ type: 'LoggedOut' });
        }
      } catch (error) {
        setAuthState({ type: 'LoggedOut' });
      }
    };

    checkAuthState();

    const intervalId = setInterval(checkAuthState, 5000);

    return () => {
      clearInterval(intervalId);
    };
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
