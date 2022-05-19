import socketClient, { Socket } from 'socket.io-client';
import { IDelaySec, IImageType, ITargetUrl } from './screenshot';

type ScreenshotRequest = {
  requestId: string;
  projectId: string;
  delaySec: IDelaySec;
  imageType: IImageType;
  targetUrl: ITargetUrl;
};

// docs: https://socket.io/docs/v4/typescript/

export interface ServerToClientEvents {
  noArg: () => void;
  basicEmit: (a: number, b: string, c: Buffer) => void;
  withAck: (d: string, callback: (e: number) => void) => void;
}

export interface ClientToServerEvents {
  requestScreenshot: (request: ScreenshotRequest) => void;
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
