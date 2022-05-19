import socketClient, { Socket } from 'socket.io-client';
import { ILogLevel } from './project-log';
import {
  IDelaySec,
  IImageType,
  IProjectId,
  IScreenshotId,
  ITargetUrl,
} from './screenshot';
import { Uuid } from './uuid';

type ScreenshotRequest = {
  requestId: Uuid;
  projectId: IProjectId;
  delaySec: IDelaySec;
  imageType: IImageType;
  targetUrl: ITargetUrl;
};

// docs: https://socket.io/docs/v4/typescript/

export interface ClientToServerEvents {
  requestScreenshot: (request: ScreenshotRequest) => void;
}

export interface ServerToClientEvents {
  requestScreenshotFailed: (errors: { message: string }[]) => void;
  requestScreenshotSucceeded: (response: {
    screenshotId: IScreenshotId;
    imageType: IImageType;
  }) => void;
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
