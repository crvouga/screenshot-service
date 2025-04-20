import { Data } from '@screenshot-service/screenshot-service';

export type Configuration = {
  maxProjectCount: number;
  maxDailyRequests: number;
  clientLibraryUrl: string;
};

export interface IConfigurationDataAccess {
  findOne(): Promise<Data.Result.Result<Data.Problem[], Configuration>>;
}
