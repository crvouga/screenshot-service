import { createTrpcClient } from '@screenshot-service/shared';
import { getServerBaseUrl } from '@screenshot-service/shared-core';
import { environment } from '../environments/environment';
export const trpcClient = createTrpcClient({
  serverBaseUrl: getServerBaseUrl({ prod: environment.production }),
});
