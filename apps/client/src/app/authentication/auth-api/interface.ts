import { Data } from '@screenshot-service/screenshot-service';

export type CurrentUser = {
  userId: Data.UserId.UserId;
};

export interface IAuthApi {
  loginWithGoogle: (input: { redirectTo?: string }) => Promise<void>;
  getCurrentUser: () => Promise<CurrentUser | null>;
  logout: () => Promise<void>;
}
