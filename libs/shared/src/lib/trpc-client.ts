import type { AppRouter } from '@screenshot-service/server-trpc';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';

const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [],
});

export type TrpcClient = typeof trpcClient;

export const createTrpcClient = (input: { serverBaseUrl: string }) => {
  return createTRPCProxyClient<AppRouter>({
    links: [httpBatchLink({ url: input.serverBaseUrl + '/trpc' })],
  });
};
