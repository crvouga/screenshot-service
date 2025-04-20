import { AnyAction, configureStore, createAction } from '@reduxjs/toolkit';
import { Socket } from '@screenshot-service/screenshot-service';
import { appRouter } from '@screenshot-service/server-trpc';
import { createHTTPHandler } from '@trpc/server/adapters/standalone';
import http from 'http';
import createSagaMiddleware, { eventChannel } from 'redux-saga';
import { fork, put, takeEvery } from 'redux-saga/effects';
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
// Saga
//
//
//

export const saga = function* ({
  webBrowser,
  socketServer,
}: {
  webBrowser: WebBrowser.WebBrowser;
  socketServer: SocketServer;
}) {
  yield takeEvery('*', function* (action) {
    console.log(JSON.stringify(action, null, 2));
    yield;
  });

  yield fork(socketFlow, { socketServer });
  yield fork(clientFlow, { webBrowser, socketServer });
};

const clientFlow = function* ({
  webBrowser,
  socketServer,
}: {
  webBrowser: WebBrowser.WebBrowser;
  socketServer: SocketServer;
}) {
  yield takeEvery(Action.ClientConnected, function* (action) {
    const clientId = action.payload.clientId;

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
  });
};

export const takeClientDisconnected = function* ({
  clientId,
}: {
  clientId: string;
}) {
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
// Socket
//
//
//

const socketFlow = function* ({
  socketServer,
}: {
  socketServer: SocketServer;
}) {
  const socketChan = makeSocketChan(socketServer);

  yield takeEvery(socketChan, function* (action) {
    yield put(action);
  });
};

const makeSocketChan = (socketServer: SocketServer) =>
  eventChannel<AnyAction>((emit) => {
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

const requestListener: http.RequestListener = (req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({ message: 'Hello from screenshot service backend' })
    );
    return;
  }

  res.writeHead(404);
  res.end();
};

export const main = async ({ port }: { port: number }) => {
  const sagaMiddleware = createSagaMiddleware();

  const store = configureStore({
    preloadedState: initialState,
    reducer: (state) => state,
    middleware: [sagaMiddleware],
  });

  const webBrowser = await WebBrowser.create();

  // Create HTTP server
  const httpServer = http.createServer();

  // Set up tRPC handler

  const trpcHandler = createHTTPHandler({
    router: appRouter,
  });

  // Handle requests
  httpServer.on('request', (req, res) => {
    // Handle tRPC requests
    if (req.url?.startsWith('/trpc')) {
      // Set CORS headers for tRPC
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Request-Method', '*');
      res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST');
      res.setHeader('Access-Control-Allow-Headers', '*');

      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      return trpcHandler(req, res);
    }

    // Handle other requests
    requestListener(req, res);
  });

  const socketServer: SocketServer = new socket.Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  sagaMiddleware.run(saga, { webBrowser, socketServer });

  httpServer.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}/`);
    console.log(`tRPC available at http://localhost:${port}/trpc`);
  });

  process.once('exit', () => {
    console.log('closing server and web browser');
    webBrowser.close();
    socketServer.close();
    httpServer.close();
  });

  return store;
};

type SocketServer = socket.Server<
  Socket.ClientToServerEvents,
  Socket.ServerToClientEvents
>;
