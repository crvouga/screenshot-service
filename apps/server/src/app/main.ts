import reduxDevTools from '@redux-devtools/cli';
import { AnyAction, configureStore, createAction } from '@reduxjs/toolkit';
import { Socket } from '@screenshot-service/screenshot-service';
import express from 'express';
import http from 'http';
import createSagaMiddleware, { eventChannel } from 'redux-saga';
import { cancel, fork, put, select, takeEvery } from 'redux-saga/effects';
import remoteDevToolsEnhancer from 'remote-redux-devtools';
import socket from 'socket.io';
import { take } from 'typed-redux-saga';
import * as CaptureScreenshot from './capture-screenshot-request';
import { InferActionMap, InferActionUnion } from './utils';
import * as WebBrowser from './web-browser';

type State = null;

const initialState: State = null;

//
//
//
// Action
//
//
//

export const Action = {
  ClientConnected: createAction(`ClientConnected`, (clientId: string) => ({
    payload: { clientId },
  })),

  ClientDisconnecting: createAction(
    `ClientDisconnecting`,
    (clientId: string) => ({ payload: { clientId } })
  ),

  ClientDisconnected: createAction(
    `ClientDisconnected`,
    (clientId: string) => ({ payload: { clientId } })
  ),

  SocketError: createAction(`SocketError`, (error: Error) => ({
    payload: { error },
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
// Server
//
//
//

const app = express();

const server = http.createServer(app);

const socketServer = new socket.Server<
  Socket.ClientToServerEvents,
  Socket.ServerToClientEvents
>(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

//
//
//
// Saga
//
//
//

export const saga = function* (webBrowser: WebBrowser.WebBrowser) {
  yield fork(socketFlow);
  yield fork(clientFlow, webBrowser);
};

const clientFlow = function* (webBrowser: WebBrowser.WebBrowser) {
  yield takeEvery(Action.ClientConnected, function* (action) {
    const clientId = action.payload.clientId;

    const task = yield fork(connectedClientFlow, webBrowser, clientId);

    yield takeClientDisconnected({ clientId });

    yield cancel(task);
  });
};

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

const connectedClientFlow = function* (
  webBrowser: WebBrowser.WebBrowser,
  clientId: string
) {
  yield fork(CaptureScreenshot.saga, { clientId, webBrowser });

  yield takeEvery('*', function* (action) {
    if (
      Socket.isServerToClientAction(action) &&
      action.payload.clientId === clientId
    ) {
      socketServer.to(clientId).emit('ServerToClient', action);
      yield;
    }
  });
};
//
//
//
// Socket
//
//
//

const socketFlow = function* () {
  yield fork(clientToServerFlow);
};

const clientToServerFlow = function* () {
  yield takeEvery(socketChan, function* (action) {
    yield put(action);
  });
};

const socketChan = eventChannel<AnyAction>((emit) => {
  socketServer.on('connection', (socket) => {
    emit(Action.ClientConnected(socket.id));

    socket.on('disconnecting', () => {
      emit(Action.ClientDisconnecting(socket.id));
    });

    socket.on('disconnect', () => {
      emit(Action.ClientDisconnected(socket.id));
    });

    socket.on('error', (error) => {
      emit(Action.SocketError(error));
    });

    socket.on('ClientToServer', (action) => {
      return emit(action);
    });
  });

  return () => {
    //
  };
});

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
    reducer: (state) => state,
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
      `Serving devtools at http://${devToolsConfig.hostname}:${devToolsConfig.port}/`
    );
  });

  const webBrowser = await WebBrowser.create();

  sagaMiddleware.run(saga, webBrowser);

  server.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}/`);
  });
};
