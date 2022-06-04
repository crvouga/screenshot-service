import * as WebBrowser from '../web-browser';
import { WebSocket } from '@crvouga/screenshot-service';
import { AnyAction, createAction } from '@reduxjs/toolkit';
import express from 'express';
import http from 'http';
import { eventChannel } from 'redux-saga';
import { cancel, fork, put, takeEvery } from 'redux-saga/effects';
import socket from 'socket.io';
import { call, take } from 'typed-redux-saga';
import { InferActionMap, InferActionUnion } from '../utils';
import * as CaptureScreenshot from './capture-screenshot';

//
//
//
// Namespace
//
//
//

export const namespace = 'Server' as const;

//
//
//
// State
//
//
//

export type State = {
  server: ServerState;
  connectedClients: {
    [clientId: string]: ClientState;
  };
};

type ServerState = { type: 'Idle' } | { type: 'Listening'; port: number };

type ClientState = {
  [CaptureScreenshot.namespace]: CaptureScreenshot.State;
};

export const initialState: State = {
  server: { type: 'Idle' },
  connectedClients: {},
};

//
//
//
// Action
//
//
//

export const Action = {
  ServerListening: createAction(
    `${namespace}/ServerListening`,
    (port: number) => ({
      payload: { port },
    })
  ),

  ClientConnected: createAction(
    `${namespace}/ClientConnected`,
    (clientId: string) => ({
      payload: { clientId },
    })
  ),

  ClientDisconnecting: createAction(
    `${namespace}/ClientDisconnecting`,
    (clientId: string) => ({
      payload: { clientId },
    })
  ),

  ClientDisconnected: createAction(
    `${namespace}/ClientDisconnected`,
    (clientId: string) => ({
      payload: { clientId },
    })
  ),

  WebSocketError: createAction(`${namespace}/WebSocketError`),
};

export type Action = InferActionUnion<typeof Action>;
export type ActionMap = InferActionMap<typeof Action>;

export const isAction = (action: AnyAction): action is Action => {
  return Object.values(Action).some((actionCreator) =>
    actionCreator.match(action)
  );
};

//
//
//
// Reducer
//
//
//

export const reducer = (state: State, action: AnyAction): State => {
  if (Action.ClientConnected.match(action)) {
    return {
      ...state,
      connectedClients: {
        ...state.connectedClients,
        [action.payload.clientId]: {
          CaptureScreenshot: CaptureScreenshot.initialState,
        },
      },
    };
  }

  if (Action.ClientDisconnected.match(action)) {
    const { [action.payload.clientId]: _clientState, ...rest } =
      state.connectedClients;

    return { ...state, connectedClients: rest };
  }

  if (Action.ServerListening.match(action)) {
    return {
      ...state,
      server: { type: 'Listening', port: action.payload.port },
    };
  }

  if (CaptureScreenshot.isAction(action)) {
    const clientId = action.payload.clientId;
    const slice = state.connectedClients[clientId]['CaptureScreenshot'];
    return {
      ...state,
      connectedClients: {
        ...state.connectedClients,
        [clientId]: {
          ...slice,
          CaptureScreenshot: CaptureScreenshot.reducer(slice, action),
        },
      },
    };
  }

  return state;
};

//
//
//
// Saga
//
//
//

export const saga = function* ({ port }: { port: number }) {
  const chan = yield* call(createServerEventChan, { port });

  yield takeEvery(chan, function* (action) {
    yield put(action);
  });

  const webBrowser = yield* call(WebBrowser.create);

  yield takeEvery(Action.ClientConnected, function* (action) {
    const clientId = action.payload.clientId;

    const task = yield fork(clientFlow, { webBrowser, clientId });

    yield takeClientDisconnected({ clientId });

    yield cancel(task);
  });
};

const clientFlow = function* ({
  webBrowser,
  clientId,
}: {
  webBrowser: WebBrowser.WebBrowser;
  clientId: string;
}) {
  yield fork(CaptureScreenshot.saga, { clientId, webBrowser });
};

const takeClientDisconnected = function* ({ clientId }: { clientId: string }) {
  while (true) {
    const action: ActionMap['ClientConnected'] = yield take(
      Action.ClientConnected
    );

    if (action.payload.clientId === clientId) {
      return action;
    }
  }
};

const createServerEventChan = ({ port }: { port: number }) => {
  const app = express();
  const server = http.createServer(app);
  const io = new socket.Server<
    WebSocket.ClientToServerEvents,
    WebSocket.ServerToClientEvents,
    WebSocket.InterServerEvents,
    WebSocket.SocketData
  >(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  return eventChannel<Action>((emit) => {
    io.on('connection', (socket) => {
      emit(Action.ClientConnected(socket.id));
      // socket.on('ToServer', emit);

      socket.on('disconnecting', () => {
        emit(Action.ClientDisconnecting(socket.id));
      });

      socket.on('disconnect', () => {
        emit(Action.ClientDisconnected(socket.id));
      });

      socket.on('error', () => {
        emit(Action.WebSocketError());
      });
    });

    server.listen(port, () => {
      emit(Action.ServerListening(port));
    });

    return () => {
      io.close();
      server.close();
    };
  });
};
