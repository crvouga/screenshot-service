import { Shared } from '@screenshot-service/screenshot-service';
import reduxDevTools from '@redux-devtools/cli';
import { AnyAction, configureStore, createAction } from '@reduxjs/toolkit';
import express from 'express';
import http, { Server } from 'http';
import createSagaMiddleware, { eventChannel } from 'redux-saga';
import { cancel, fork, put, takeEvery } from 'redux-saga/effects';
import remoteDevToolsEnhancer from 'remote-redux-devtools';
import socket from 'socket.io';
import { call, take } from 'typed-redux-saga';
import * as CaptureScreenshot from './capture-screenshot';
import { InferActionMap, InferActionUnion } from './utils';
import * as WebBrowser from './web-browser';

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

export type State = {
  status: { type: 'Idle' } | { type: 'Listening'; port: number };
  clients: {
    [clientId: string]: ClientState;
  };
};

type ClientState = {
  [CaptureScreenshot.namespace]: CaptureScreenshot.State;
};

export const initialState: State = {
  status: { type: 'Idle' },
  clients: {},
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

  SocketError: createAction(`${namespace}/SocketError`, (error: Error) => ({
    payload: { error },
  })),

  Log: createAction(`${namespace}/Log`, (message: string) => ({
    payload: { message },
  })),
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
  return {
    status: statusReducer(state.status, action),
    clients: clientsReducer(state.clients, action),
  };
};

const statusReducer = (
  state: State['status'],
  action: AnyAction
): State['status'] => {
  if (Action.ServerListening.match(action)) {
    return { type: 'Listening', port: action.payload.port };
  }

  return state;
};

const clientsReducer = (
  state: State['clients'],
  action: AnyAction
): State['clients'] => {
  if (Action.ClientConnected.match(action)) {
    return {
      ...state,
      [action.payload.clientId]: {
        [CaptureScreenshot.namespace]: CaptureScreenshot.initialState,
      },
    };
  }

  if (Action.ClientDisconnected.match(action)) {
    return removeKey(action.payload.clientId, state);
  }

  if (CaptureScreenshot.isAction(action)) {
    const clientId = action.payload.clientId;
    const clientState = state[clientId];
    const captureScreenshotState = clientState['captureScreenshot'];
    return {
      ...state,
      [clientId]: {
        ...clientState,
        [CaptureScreenshot.namespace]: CaptureScreenshot.reducer(
          captureScreenshotState,
          action
        ),
      },
    };
  }

  return state;
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
  const [serverChan, server] = yield* call(createServerChan, { port });
  const [socketChan, io] = yield* call(createSocketChan, { server });

  yield takeEvery(serverChan, function* (action) {
    yield put(action);
  });

  yield takeEvery(socketChan, function* (action) {
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
// Server
//
//
//

const createServerChan = ({ port }: { port: number }) => {
  const app = express();
  const server = http.createServer(app);

  const chan = eventChannel<Action>((emit) => {
    server.listen(port, () => {
      emit(Action.ServerListening(port));
    });

    return () => {
      server.close();
    };
  });

  return [chan, server] as const;
};

//
//
//
// Socket
//
//
//

const createSocketChan = ({ server }: { server: http.Server }) => {
  const io = new socket.Server<
    Shared.ClientToServerEvents,
    Shared.ServerToClientEvents,
    Shared.InterServerEvents,
    Shared.SocketData
  >(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  const chan = eventChannel<AnyAction>((emit) => {
    io.on('connection', (socket) => {
      emit(Action.ClientConnected(socket.id));

      socket.on('ClientToServer', (action) => {
        if (Shared.ClientToServer.CancelCaptureScreenshot.match(action)) {
          emit(
            CaptureScreenshot.Action.Cancel(socket.id, action.payload.requestId)
          );
        }

        if (Shared.ClientToServer.StartCapureScreenshot.match(action)) {
          emit(
            CaptureScreenshot.Action.Start(socket.id, action.payload.request)
          );
        }
      });

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

    return () => {
      io.close();
    };
  });

  return [chan, io] as const;
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

export const main = async ({ port }: { port: number }) => {
  const sagaMiddleware = createSagaMiddleware();

  const devToolsConfig = {
    hostname: 'localhost',
    port: 9000,
    secure: false,
  };

  configureStore({
    preloadedState: initialState,
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

  const remoteDevTools = await reduxDevTools({
    hostname: devToolsConfig.hostname,
    port: devToolsConfig.port,
    secure: devToolsConfig.secure,
  });

  remoteDevTools.on('ready', () => {
    console.log(
      `Serving api devtools at http://${devToolsConfig.hostname}:${devToolsConfig.port}/`
    );
  });

  sagaMiddleware.run(saga, { port });
};

/* 


{
  type: 'captureScreenshot/Start',
  payload: {
    clientId: 'HDm1ow7Mvzj2dVU9AAAB',
    request: {
      requestId: 'a662d306-775f-4f4a-8d13-3705f79dfe71',
      projectId: 'a662d306-775f-4f4a-8d13-3705f79dfe71',
      delaySec: 3,
      targetUrl:'https://stackoverflow.com/questions/37624144/is-there-a-way-to-short-circuit-async-await-flow',
      imageType: 'jpeg',
      strategy: 'network-first',
    },
  },
}



*/
