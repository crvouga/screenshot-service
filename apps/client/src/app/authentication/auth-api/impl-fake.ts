import { IAuthApi } from './interface';
import { Data } from '@screenshot-service/screenshot-service';

export const FakeAuthApi = (): IAuthApi => {
  const getIsLoggedIn = (): boolean => {
    return localStorage.getItem('fakeAuth_isLoggedIn') === 'true';
  };

  const setIsLoggedIn = (value: boolean): void => {
    localStorage.setItem('fakeAuth_isLoggedIn', value ? 'true' : 'false');
  };

  const getFakeUserId = (): Data.UserId.UserId => {
    const storedUserId = localStorage.getItem('fakeAuth_userId');
    if (storedUserId) {
      const decoded = Data.UserId.decode(storedUserId);
      if (decoded.type === 'Ok') {
        return decoded.value;
      }
    }

    const newUserId = Data.UserId.generate();
    localStorage.setItem('fakeAuth_userId', newUserId);
    return newUserId;
  };

  return {
    loginWithGoogle: async ({ redirectTo }) => {
      console.log(`Fake login with Google. Would redirect to: ${redirectTo}`);

      setIsLoggedIn(true);
      return Promise.resolve();
    },
    getCurrentUser: async () => {
      if (!getIsLoggedIn()) {
        return null;
      }

      return {
        userId: getFakeUserId(),
        defaultName: 'Fake User',
      };
    },
    logout: async () => {
      console.log('Fake logout');
      setIsLoggedIn(false);
      return Promise.resolve();
    },
  };
};
