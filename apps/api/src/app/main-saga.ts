import {
  ClientToServerEvents,
  ILogLevel,
  InferActionUnion,
  InterServerEvents,
  IRequestId,
  isToClient,
  IToServer,
  IToServerMap,
  ScreenshotRequest,
  ServerToClientEvents,
  SocketData,
  ToClient,
  ToServer,
} from '@crvouga/screenshot-service';
import { createAction } from '@reduxjs/toolkit';
import express from 'express';
import http from 'http';
import { eventChannel } from 'redux-saga';
import {
  cancel,
  delay,
  fork,
  put,
  race,
  take,
  takeEvery,
  takeLatest,
} from 'redux-saga/effects';
import socket from 'socket.io';
import { call } from 'typed-redux-saga';
import * as DataAccess from './data-access';

export const Action = {
  ServerListening: createAction('ServerListening', (port: number) => ({
    payload: {
      port,
    },
  })),

  ClientConnected: createAction('ClientConnected', (clientId: string) => ({
    payload: {
      clientId,
    },
  })),

  ClientDisconnecting: createAction(
    'ClientDisconnecting',
    (clientId: string) => ({ payload: { clientId } })
  ),

  ClientDisconnected: createAction(
    'ClientDisconnected',
    (clientId: string) => ({ payload: { clientId } })
  ),

  SocketError: createAction('SocketError', (clientId: string) => ({
    payload: { clientId },
  })),

  Log: createAction('Log', (level: ILogLevel, message: string) => ({
    payload: { level, message },
  })),
};

type IAction = InferActionUnion<typeof Action>;

//
//
//
// Main
//
//
//

export const mainSaga = function* ({ port }: { port: number }) {
  yield fork(loggingSaga);
  yield fork(serverSaga, { port });

  const webBrowser = yield* call(createWebBrowser);

  yield takeEvery(Action.ClientConnected, function* (action) {
    yield* clientFlow(action.payload.clientId, webBrowser);
  });
};

const createWebBrowser = function* () {
  const webBrowser = yield* call(DataAccess.WebBrowser.create);

  yield put(Action.Log('info', 'created web browser'));

  return webBrowser;
};

const clientFlow = function* (
  clientId: string,
  webBrowser: DataAccess.WebBrowser.WebBrowser
) {
  yield put(
    Action.Log('info', `Starting client sagas for clientId: ${clientId}`)
  );

  const task = yield fork(clientFlowMain, clientId, webBrowser);

  yield takeClientDisconnected(clientId);

  yield cancel(task);

  yield put(
    Action.Log('info', `Cancelled client sagas for clientId: ${clientId}`)
  );
};

const clientFlowMain = function* (
  clientId: string,
  webBrowser: DataAccess.WebBrowser.WebBrowser
) {
  yield takeLatest(ToServer.RequestScreenshot, function* (action) {
    yield* requestScreenshotFlow(clientId, webBrowser, action.payload.request);
  });
};

const takeClientDisconnected = function* (clientId: string) {
  while (true) {
    const action: ReturnType<typeof Action.ClientDisconnected> = yield take(
      Action.ClientDisconnected
    );

    if (action.payload.clientId === clientId) {
      return action;
    }
  }
};

const requestScreenshotFlow = function* (
  clientId: string,
  webBrowser: DataAccess.WebBrowser.WebBrowser,
  request: ScreenshotRequest
) {
  const { cancel } = yield race({
    cancel: call(takeCancelScreenshotRequest, request.requestId),
    requestScreenshot: call(
      requestScreenshotMainFlow,
      clientId,
      webBrowser,
      request
    ),
  });

  if (cancel) {
    yield put(ToClient.Log(clientId, 'notice', 'Cancelled request'));
    yield put(ToClient.CancelRequestSucceeded(clientId));
  }
};

const requestScreenshotMainFlow = function* (
  clientId: string,
  webBrowser: DataAccess.WebBrowser.WebBrowser,
  request: ScreenshotRequest
) {
  const projectResult = yield* call(DataAccess.Project.getOneById, request);

  if (projectResult.type === 'error') {
    yield put(
      ToClient.RequestScreenshotFailed(clientId, [
        { message: projectResult.error },
      ])
    );
    return;
  }

  if (request.strategy === 'network-first') {
    yield* networkFirstFlow(clientId, webBrowser, request);
  }

  if (request.strategy === 'cache-first') {
    yield* cacheFirstFlow(clientId, webBrowser, request);
  }
};

const cacheFirstFlow = function* (
  clientId: string,
  webBrowser: DataAccess.WebBrowser.WebBrowser,
  request: ScreenshotRequest
) {
  yield put(ToClient.Log(clientId, 'info', 'Checking cache...'));

  const cacheResult = yield* call(DataAccess.Screenshot.get, request);

  if (cacheResult.type === 'success') {
    yield put(
      ToClient.RequestScreenshotSucceeded({
        source: 'Cache',
        clientId,
        screenshotId: cacheResult.screenshot.screenshotId,
        imageType: cacheResult.screenshot.imageType,
      })
    );

    return;
  }

  yield put(ToClient.Log(clientId, 'info', 'Not cached'));

  yield* networkFirstFlow(clientId, webBrowser, request);
};

const networkFirstFlow = function* (
  clientId: string,
  webBrowser: DataAccess.WebBrowser.WebBrowser,
  request: ScreenshotRequest
) {
  yield put(ToClient.Log(clientId, 'info', 'Opening url in web browser...'));

  const page = yield* call(DataAccess.WebBrowser.openNewPage, webBrowser);

  yield* call(DataAccess.WebBrowser.goTo, page, request.targetUrl);

  for (let remaining = request.delaySec; remaining > 0; remaining--) {
    yield put(
      ToClient.Log(clientId, 'info', `Delaying for ${remaining} seconds...`)
    );

    yield delay(1000);
  }

  yield put(ToClient.Log(clientId, 'info', `Capturing screenshot...`));

  const captureResult = yield* call(
    DataAccess.WebBrowser.takeScreenshot,
    page,
    request.imageType
  );

  if (captureResult.type === 'error') {
    yield put(ToClient.RequestScreenshotFailed(clientId, captureResult.errors));
    return;
  }

  yield put(ToClient.Log(clientId, 'info', `Caching screenshot...`));

  const putCacheResult = yield* call(
    DataAccess.Screenshot.put,
    request,
    captureResult.buffer
  );

  if (putCacheResult.type === 'error') {
    yield put(
      ToClient.RequestScreenshotFailed(clientId, putCacheResult.errors)
    );
    return;
  }

  yield put(
    ToClient.RequestScreenshotSucceeded({
      clientId,
      source: 'Network',
      screenshotId: putCacheResult.screenshotId,
      imageType: request.imageType,
    })
  );
};

const takeCancelScreenshotRequest = function* (requestId: IRequestId) {
  while (true) {
    const action: IToServerMap['CancelRequestScreenshot'] = yield take(
      ToServer.CancelRequestScreenshot
    );

    if (action.payload.requestId === requestId) {
      return action;
    }
  }
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
const io = new socket.Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const createToServerChan = ({ port }: { port: number }) =>
  eventChannel<IToServer | IAction>((emit) => {
    io.on('connection', (socket) => {
      emit(Action.ClientConnected(socket.id));
      socket.on('ToServer', emit);

      socket.on('disconnecting', () => {
        emit(Action.ClientDisconnecting(socket.id));
      });

      socket.on('disconnect', () => {
        emit(Action.ClientDisconnected(socket.id));
      });

      socket.on('error', () => {
        emit(Action.SocketError(socket.id));
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

const serverSaga = function* ({ port }: { port: number }) {
  const serverChan = createToServerChan({ port });

  yield takeEvery(serverChan, function* (action) {
    yield put(action);
  });

  yield takeEvery('*', function* (action) {
    if (isToClient(action)) {
      io.to(action.payload.clientId).emit('ToClient', action);
      yield;
    }
  });
};

//
//
//
// Logging
//
//
//

function* loggingSaga() {
  yield takeEvery('*', function* (action) {
    if (Action.ServerListening.match(action)) {
      console.log(
        `Notice: Server is listening on http://localhost:${action.payload.port}/`
      );
    }
    yield;
  });
}
