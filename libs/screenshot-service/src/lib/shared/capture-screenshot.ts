import { createAction } from '@reduxjs/toolkit';
import * as Data from '../data';
import { InferActionUnion } from '../utils';

//
//
//
// State
//
//
//

export type State =
  | { type: 'Idle'; logs: Log[] }
  | { type: 'Loading'; logs: Log[]; requestId: Data.RequestId.RequestId }
  | { type: 'Failed'; logs: Log[]; errors: Error[] }
  | { type: 'Cancelling'; logs: Log[] }
  | { type: 'Cancelled'; logs: Log[] }
  | { type: 'Succeeded'; logs: Log[]; src: string };

export type Log = { level: Data.LogLevel.LogLevel; message: string };

export type Request = {
  requestId: Data.RequestId.RequestId;
  projectId: Data.ProjectId.ProjectId;
  strategy: Data.Strategy.Strategy;
  delaySec: Data.DelaySec.DelaySec;
  imageType: Data.ImageType.ImageType;
  targetUrl: Data.TargetUrl.TargetUrl;
};

export const initialState: State = { type: 'Idle', logs: [] };

//
//
//
// Action
//
//
//

export const ClientToServer = {
  Start: createAction(
    `ClientToServer/CaptureScreenshot/Start`,
    (request: Request) => ({
      payload: { request },
    })
  ),

  Cancel: createAction(
    `ClientToServer/CaptureScreenshot/Cancel`,
    (requestId: Data.RequestId.RequestId) => ({
      payload: { requestId },
    })
  ),
};

export type ClientToServer = InferActionUnion<typeof ClientToServer>;

export const ServerToClient = {
  RecievedState: createAction(
    'ServerToClient/CaptureScreenshot/RecievedState',
    (state: State) => ({ payload: state })
  ),
};

export type ServerToClient = InferActionUnion<typeof ServerToClient>;
