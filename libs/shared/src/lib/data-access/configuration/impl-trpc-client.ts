import { Data } from '@screenshot-service/screenshot-service';
import { trpc } from '../../trpc-client';
import { IConfigurationDataAccess } from './interface';

export const TrpcClientConfigurationDataAccess =
  (): IConfigurationDataAccess => {
    return {
      findOne: async () => {
        try {
          const configuration = await trpc.configuration.findOne.query();
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
