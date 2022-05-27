import socketClient, { Socket } from 'socket.io-client';
import { ILogLevel } from './project-log';
import {
  IDelaySec,
  IImageType,
  IProjectId,
  IRequestId,
  IScreenshotId,
  IStrategy,
  ITargetUrl,
} from './screenshot';
import { Action, createAction } from '@reduxjs/toolkit';
import { InferActionMap, InferActionUnion } from './utils';

//
//
//
//
//

export type ScreenshotRequest = {
  requestId: IRequestId;
  projectId: IProjectId;
  strategy: IStrategy;
  delaySec: IDelaySec;
  imageType: IImageType;
  targetUrl: ITargetUrl;
};

export const ToServer = {
  RequestScreenshot: createAction(
    'ToServer/RequestScreenshot',
    (request: ScreenshotRequest) => ({
      payload: { request },
    })
  ),

  CancelRequestScreenshot: createAction(
    'ToServer/CancelRequestScreenshot',
    (requestId: IRequestId) => ({
      payload: { requestId },
    })
  ),
};

export const ToClient = {
  CancelRequestSucceeded: createAction(
    'ToClient/CancelRequestScreenshotSucceeded',
    (clientId: string) => ({
      payload: {
        clientId,
      },
    })
  ),

  RequestScreenshotSucceeded: createAction(
    'ToClient/RequestScreenshotSucceeded',
    (payload: {
      clientId: string;
      screenshotId: IScreenshotId;
      imageType: IImageType;
      source: 'Network' | 'Cache';
    }) => ({
      payload,
    })
  ),

  RequestScreenshotFailed: createAction(
    'ToClient/RequestScreenshotFailed',
    (clientId: string, errors: { message: string }[]) => ({
      payload: {
        clientId,
        errors,
      },
    })
  ),

  Log: createAction('Log', (clientId: string, level: ILogLevel, message) => ({
    payload: { clientId, level, message },
  })),
};

export const isToClient = (action: Action): action is IToClient => {
  return Object.values(ToClient).some((actionCreator) =>
    actionCreator.match(action)
  );
};

//
//
//
//
//

export type IToClient = InferActionUnion<typeof ToClient>;
export type IToClientMap = InferActionMap<typeof ToClient>;

export type IToServer = InferActionUnion<typeof ToServer>;
export type IToServerMap = InferActionMap<typeof ToServer>;

// docs: https://socket.io/docs/v4/typescript/

export interface ClientToServerEvents {
  ToServer: (action: IToServer) => void;
}

export interface ServerToClientEvents {
  ToClient: (action: IToClient) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  name: string;
  age: number;
}

const BASE_URL = 'https://crvouga-screenshot-service.herokuapp.com/';

type IScreenshotRequestState =
  | { type: 'Idle' }
  | { type: 'Loading' }
  | { type: 'Failed' }
  | { type: 'Succeeded' };

type ScreenshotClientState = {
  connection: { type: 'Connecting' } | { type: 'Connected' };
  requests: {
    [requestId: string]:
      | { type: 'Idle' }
      | { type: 'Cancelled ' }
      | { type: 'Loading' }
      | { type: 'Failed' }
      | { type: 'Succeeded' };
  };
};

export const createClient = ({
  overrides,
}: {
  overrides?: { baseUrl?: string };
}) => {
  const baseUrl = overrides?.baseUrl ? overrides.baseUrl : BASE_URL;

  const socket: Socket<ServerToClientEvents, ClientToServerEvents> =
    socketClient(baseUrl);

  const toServer = (action: IToServer) => {
    return socket.emit('ToServer', action);
  };

  const fromServer = (callback: (action: IToClient) => void): (() => void) => {
    socket.on('ToClient', callback);
    return () => {
      socket.off('ToClient', callback);
    };
  };

  return {
    toServer,
    fromServer,
  };
};
