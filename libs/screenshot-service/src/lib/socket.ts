import socketIOClient, { Socket } from 'socket.io-client';
import * as CaptureScreenshotRequest from './capture-screenshot-request';

//
//
//
// Socket Interface
//
//
//

type ClientToServerAction = CaptureScreenshotRequest.ClientToServerAction;

export const isClientToServerAction = CaptureScreenshotRequest.isClientToServer;

type ServerToClientAction = CaptureScreenshotRequest.ServerToClientAction;

export const isServerToClientAction = CaptureScreenshotRequest.isServerToClient;

export interface ClientToServerEvents {
  ClientToServer: (action: ClientToServerAction) => void;
}

export interface ServerToClientEvents {
  ServerToClient: (action: ServerToClientAction) => void;
}

//
//
//
// Socket Instance
//
//
//

export const make = (config?: { serverBaseUrl: string }) => {
  // todo put this in the env var
  const PRODUCTION_SERVER_BASE_URL =
    'https://crvouga-screenshot-service.herokuapp.com/';

  const baseUrl = config?.serverBaseUrl
    ? config.serverBaseUrl
    : PRODUCTION_SERVER_BASE_URL;

  const socket: Socket<ServerToClientEvents, ClientToServerEvents> =
    socketIOClient(baseUrl);

  return socket;
};

export type Config = Parameters<typeof make>[0];
export type Instance = ReturnType<typeof make>;
