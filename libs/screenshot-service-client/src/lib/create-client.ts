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

type ScreenshotRequest = {
  requestId: IRequestId;
  projectId: IProjectId;
  strategy: IStrategy;
  delaySec: IDelaySec;
  imageType: IImageType;
  targetUrl: ITargetUrl;
};

// docs: https://socket.io/docs/v4/typescript/

export interface ClientToServerEvents {
  requestScreenshot: (request: ScreenshotRequest) => void;
  cancelScreenshotRequest: () => void;
}

export interface ServerToClientEvents {
  requestScreenshotFailed: (errors: { message: string }[]) => void;
  requestScreenshotSucceeded: (response: {
    screenshotId: IScreenshotId;
    imageType: IImageType;
  }) => void;
  cancelScreenshotRequestFailed: () => void;
  cancelScreenshotRequestSucceeded: () => void;
  log: (logLevel: ILogLevel, message: string) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  name: string;
  age: number;
}

export const createClient = ({ url }: { url: string }) => {
  const socket: Socket<ServerToClientEvents, ClientToServerEvents> =
    socketClient(url);

  return {
    socket,
  };
};
