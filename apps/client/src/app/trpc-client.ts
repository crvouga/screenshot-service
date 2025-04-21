import { createTrpcClient, getServerBaseUrl } from '@screenshot-service/shared';
import { environment } from '../environments/environment';

export const trpcClient = createTrpcClient({
  serverBaseUrl: getServerBaseUrl({ prod: environment.production }),
});
