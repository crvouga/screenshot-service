import { Data } from '@screenshot-service/screenshot-service';
import { Problem } from '../shared';

export type Project = {
  projectId: Data.ProjectId.ProjectId;
  ownerId: Data.UserId.UserId;
  projectName: Data.ProjectName.ProjectName;
  whitelistedUrls: Data.Url.Url[];
};

export interface IProjectDataAccess {
  findManyOwnerId: ({
    ownerId,
  }: {
    ownerId: Data.UserId.UserId;
  }) => Promise<Data.Result.Result<Problem[], Project[]>>;

  findManyById: ({
    projectId,
  }: {
    projectId: Data.ProjectId.ProjectId;
  }) => Promise<Data.Result.Result<Problem[], Project[]>>;

  update: ({
    projectId,
    ...updates
  }: Partial<Project> & { projectId: Data.ProjectId.ProjectId }) => Promise<
    Data.Result.Result<Problem[], Project>
  >;

  deleteForever: ({
    projectId,
  }: {
    projectId: Data.ProjectId.ProjectId;
  }) => Promise<Data.Result.Result<Problem[], Project>>;

  insert: ({
    ownerId,
    projectName,
    whilelistedUrls,
  }: {
    ownerId: Data.UserId.UserId;
    projectName: Data.ProjectName.ProjectName;
    whilelistedUrls: Data.Url.Url[];
  }) => Promise<Data.Result.Result<Problem[], Project>>;
}
