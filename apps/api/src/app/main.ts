import { WebSocket } from '@crvouga/screenshot-service';
import { AnyAction, configureStore, createAction } from '@reduxjs/toolkit';
import express from 'express';
import http from 'http';
import loggerMiddleware from 'redux-logger';
import createSagaMiddleware, { eventChannel } from 'redux-saga';
import { cancel, fork, put, takeEvery } from 'redux-saga/effects';
import socket from 'socket.io';
import { call, take } from 'typed-redux-saga';
import * as CaptureScreenshot from './capture-screenshot';
import { InferActionMap, InferActionUnion } from './utils';
import * as WebBrowser from './web-browser';
import remoteDevToolsEnhancer from 'remote-redux-devtools';
import reduxDevTools from '@redux-devtools/cli';

//
//
//
// Namespace
//
//
//

export const namespace = 'server' as const;

//
//
//
// State
//
//
//

export type State =
  | { status: 'Idle' }
  | {
      status: 'Listening';
      port: number;
      connectedClients: {
        [clientId: string]: {
          [CaptureScreenshot.namespace]: CaptureScreenshot.State;
        };
      };
    };

export const initialState: State = { status: 'Idle' };

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

  SocketError: createAction(`${namespace}/SocketError`, (error: Error) => ({
    payload: { error },
  })),

  Log: createAction(`${namespace}/Log`, (message: string) => ({
    payload: { message },
  })),

  RecievedClientEvent: createAction(`${namespace}/RecievedClientEvent`),
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

export const reducer = (
  state: State = initialState,
  action: AnyAction
): State => {
  switch (state.status) {
    case 'Idle':
      if (Action.ServerListening.match(action)) {
        return {
          status: 'Listening',
          port: action.payload.port,
          connectedClients: {},
        };
      }

      return state;

    case 'Listening':
      if (Action.ClientConnected.match(action)) {
        return {
          ...state,
          connectedClients: {
            ...state.connectedClients,
            [action.payload.clientId]: {
              [CaptureScreenshot.namespace]: CaptureScreenshot.initialState,
            },
          },
        };
      }

      if (Action.ClientDisconnected.match(action)) {
        return {
          ...state,
          connectedClients: removeKey(
            action.payload.clientId,
            state.connectedClients
          ),
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
  }
};

const removeKey = <T>(key: keyof T, object: T): T => {
  const copyed = { ...object };
  delete copyed[key];
  return copyed;
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

//
//
//
// Server Events
//
//
//

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

const createServerEventChan = ({ port }: { port: number }) => {
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

      socket.on('error', (error) => {
        emit(Action.SocketError(error));
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

//
//
//
// Helpers
//
//
//

const takeClientDisconnected = function* ({ clientId }: { clientId: string }) {
  while (true) {
    const action: ActionMap['ClientDisconnected'] = yield take(
      Action.ClientDisconnected
    );

    if (action.payload.clientId === clientId) {
      return action;
    }
  }
};

//
//
//
// Main
//
//
//

export const main = ({ port }: { port: number }) => {
  const sagaMiddleware = createSagaMiddleware();

  const devToolsConfig = {
    hostname: 'localhost',
    port: 9000,
    secure: false,
  };

  configureStore({
    reducer: reducer,
    middleware: [sagaMiddleware],
    enhancers: [
      remoteDevToolsEnhancer({
        realtime: true,
        name: 'Screenshot Service API',
        hostname: devToolsConfig.hostname,
        port: devToolsConfig.port,
        secure: devToolsConfig.secure,
      }),
    ],
  });

  reduxDevTools({
    hostname: devToolsConfig.hostname,
    port: devToolsConfig.port,
    secure: devToolsConfig.secure,
  });

  sagaMiddleware.run(saga, { port });
};
