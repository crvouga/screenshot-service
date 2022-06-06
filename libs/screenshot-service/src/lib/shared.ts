import { createAction } from '@reduxjs/toolkit';
import * as Data from './data';
import { InferActionUnion } from './utils';

//
//
//
// State
//
//
//

export type CaptureScreenshotState =
  | { type: 'Idle'; logs: CaptureScreenshotLog[] }
  | {
      type: 'Loading';
      logs: CaptureScreenshotLog[];
      requestId: Data.RequestId.RequestId;
    }
  | { type: 'Failed'; logs: CaptureScreenshotLog[]; errors: Error[] }
  | { type: 'Cancelling'; logs: CaptureScreenshotLog[] }
  | { type: 'Cancelled'; logs: CaptureScreenshotLog[] }
  | { type: 'Succeeded'; logs: CaptureScreenshotLog[]; src: string };

export type CaptureScreenshotLog = {
  level: Data.LogLevel.LogLevel;
  message: string;
};

export type CaptureScreenshotRequest = {
  requestId: Data.RequestId.RequestId;
  projectId: Data.ProjectId.ProjectId;
  strategy: Data.Strategy.Strategy;
  delaySec: Data.DelaySec.DelaySec;
  imageType: Data.ImageType.ImageType;
  targetUrl: Data.TargetUrl.TargetUrl;
};

export const initialCaptureScreenshotState: CaptureScreenshotState = {
  type: 'Idle',
  logs: [],
};

//
//
//
// Action
//
//
//

export const ClientToServer = {
  StartCapureScreenshot: createAction(
    `ClientToServer/CaptureScreenshot/Start`,
    (request: CaptureScreenshotRequest) => ({
      payload: { request },
    })
  ),

  CancelCaptureScreenshot: createAction(
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
    (state: CaptureScreenshotState) => ({ payload: state })
  ),
};

export type ServerToClient = InferActionUnion<typeof ServerToClient>;

//
//
// Socket Interface
// docs: https://socket.io/docs/v4/typescript/
//
//
//

export interface ClientToServerEvents {
  ClientToServer: (action: ClientToServer) => void;
}

export interface ServerToClientEvents {
  ServerToClient: (action: ServerToClient) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export type SocketData = {
  name: string;
  age: number;
};

//
//
//
// Config
//
//
//

// todo put this in the env var
export const PRODUCTION_SERVER_BASE_URL =
  'https://crvouga-screenshot-service.herokuapp.com/';
