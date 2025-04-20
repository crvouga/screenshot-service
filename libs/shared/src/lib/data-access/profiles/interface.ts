import { Data } from '@screenshot-service/screenshot-service';
import { Problem } from '../shared';

export type Profile = {
  userId: Data.UserId.UserId;
  avatarSeed: string;
  name: string;
  themeMode: ThemeMode;
};

export type ThemeMode = 'light' | 'dark' | 'system';

export interface IProfileDataAccess {
  findOne: ({
    userId,
  }: {
    userId: string;
  }) => Promise<Data.Result.Result<Problem[], Profile | null>>;

  deleteForever: ({
    userId,
  }: {
    userId: string;
  }) => Promise<Data.Result.Result<Problem, Data.Unit>>;

  create: ({
    userId,
    name,
    avatarSeed,
    themeMode,
  }: {
    userId: string;
    name: string;
    avatarSeed: string;
    themeMode: ThemeMode;
  }) => Promise<Data.Result.Result<Problem, Data.UserId.UserId>>;

  update: ({
    userId,
    ...updates
  }: Partial<Profile> & { userId: string }) => Promise<
    Data.Result.Result<Problem, Data.Unit>
  >;
}
