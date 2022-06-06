import { createAction } from '@reduxjs/toolkit';
import { InferActionUnion } from '../utils';
import * as CaptureScreenshot from './capture-screenshot';

//
//
//
// Action
//
//
//

export const ClientToServer = {
  CaptureScreenshotAction: createAction(
    'ClientToServer/CaptureScreenshotAction',
    (payload: CaptureScreenshot.ClientToServer) => ({ payload })
  ),
};

export type ClientToServer = InferActionUnion<typeof ClientToServer>;

export const ServerToClient = {
  CaptureScreenshotAction: createAction(
    'ServerToClient/CaptureScreenshotAction',
    (payload: CaptureScreenshot.ServerToClient) => ({ payload })
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
