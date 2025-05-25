import type { AppRouter } from '@screenshot-service/server-trpc';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';

const trpcClientNetwork = createTRPCProxyClient<AppRouter>({
  links: [],
});

export type TrpcClientNetwork = typeof trpcClientNetwork;

export const createTrpcClientNetwork = (input: {
  serverBaseUrl: string;
}): TrpcClientNetwork => {
  return createTRPCProxyClient<AppRouter>({
    links: [httpBatchLink({ url: input.serverBaseUrl + '/trpc' })],
  });
};

export const createTrpcClientCaller = (input: { appRouter: AppRouter }) => {
  return input.appRouter.createCaller({});
};

export type TrpcClientCaller = ReturnType<typeof createTrpcClientCaller>;

export type TrpcClient = TrpcClientNetwork;
