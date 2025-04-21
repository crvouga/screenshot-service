import { initTRPC } from '@trpc/server';
import { IncomingMessage } from 'http';

export type Context = {
  req?: IncomingMessage;
};

export const t = initTRPC.context<Context>().create();

export const publicProcedure = t.procedure;
export const router = t.router;
