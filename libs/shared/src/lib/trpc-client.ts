import type { AppRouter } from '@screenshot-service/server-trpc';
import { createTRPCClient, httpBatchLink } from '@trpc/client';

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:8000/trpc',
    }),
  ],
});
