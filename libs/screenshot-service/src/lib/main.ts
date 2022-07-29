import { RequestState } from './capture-screenshot-request';
import { Problem, RequestId, Result } from './data';
import * as Socket from './socket';
import { makeStore } from './store';

//
//
//
// Interface
//
//
//

export type Client = {
  capture: ({
    targetUrl,
    delaySec,
  }: {
    targetUrl: string;
    delaySec?: number;
  }) => Result.Result<Problem, { requestId: RequestId.RequestId }>;

  cancel: ({
    requestId,
  }: {
    requestId: RequestId.RequestId;
  }) => Result.Result<Problem, null>;

  subscribe: (
    {
      requestId,
    }: {
      requestId: RequestId.RequestId;
    },
    callback: (state: RequestState) => void
  ) => Unsubscribe;
};

export type Unsubscribe = () => void;

//
//
//
// Client
//
//
//

export const makeClient = ({
  socketConfig,
}: {
  socketConfig?: Socket.Config;
}) => {
  const store = makeStore({ socketConfig });

  return {
    store,
  };
};
