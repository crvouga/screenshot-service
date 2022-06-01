import { createAction } from '@reduxjs/toolkit';
import socketClient, { Socket } from 'socket.io-client';
import * as RequestScreenshot from './request-screenshot';
import { InferActionUnion } from './utils';

type ToServer = RequestScreenshot.ToServer;

type ToClient = RequestScreenshot.ToClient;

export const Action = {
  ConnectionError: createAction('WebSocket/ConnectionError'),
  Connected: createAction('WebSocket/Connected'),
  Disconnected: createAction('WebSocket/Disconnected'),
};

export type Action = InferActionUnion<typeof Action>;

//
//
//
// todo put this in the env var

const BASE_URL = 'https://crvouga-screenshot-service.herokuapp.com/';

//
//
//
//
//
//

export const create = ({ overrides }: { overrides?: Overrides }) => {
  const baseUrl = overrides?.baseUrl ? overrides.baseUrl : BASE_URL;

  const socket: Socket<ServerToClientEvents, ClientToServerEvents> =
    socketClient(baseUrl);

  const emit = (action: ToServer) => {
    return socket.emit('ToServer', action);
  };

  const onInternal = (callback: (action: Action) => void): (() => void) => {
    socket.on('connect', () => {
      callback(Action.Connected());
    });
    socket.on('disconnect', () => {
      callback(Action.Disconnected());
    });
    socket.on('connect_error', () => {
      callback(Action.ConnectionError());
    });
    return () => {
      // todo clean up
    };
  };

  const on = (callback: (action: ToClient) => void): (() => void) => {
    socket.on('ToClient', callback);
    return () => {
      socket.off('ToClient', callback);
    };
  };

  return {
    emit,
    onInternal,
    on,
  };
};

export type WebSocket = ReturnType<typeof create>;

export type Overrides = { baseUrl: string };

//
//
//
// docs: https://socket.io/docs/v4/typescript/
//
//
//

export interface ClientToServerEvents {
  ToServer: (action: ToServer) => void;
}

export interface ServerToClientEvents {
  ToClient: (action: ToClient) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  name: string;
  age: number;
}
