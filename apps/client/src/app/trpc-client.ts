import { createTrpcClientNetwork } from '@screenshot-service/shared';
import { getServerBaseUrl } from '@screenshot-service/shared-core';
import { environment } from '../environments/environment';

export const trpcClient = createTrpcClientNetwork({
  serverBaseUrl: getServerBaseUrl({
    isServerSide: false,
    isProd: environment.production,
  }),
});
