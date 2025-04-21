import { Data } from '@screenshot-service/screenshot-service';
import { TrpcClient } from '../../trpc-client';
import { IConfigurationDataAccess } from './interface';

export const TrpcClientConfigurationDataAccess = ({
  trpcClient,
}: {
  trpcClient: TrpcClient;
}): IConfigurationDataAccess => {
  return {
    findOne: async () => {
      try {
        const configuration = await trpcClient.configuration.findOne.query();
        return Data.Result.Ok(configuration);
      } catch (error) {
        return Data.Result.Err([
          {
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        ]);
      }
    },
  };
};
