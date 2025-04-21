import type { AppRouter } from '@screenshot-service/server-trpc';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';

export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:8000/trpc',
    }),
  ],
});
