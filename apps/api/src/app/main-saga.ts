import {
  ClientToServerEvents,
  InferActionUnion,
  InterServerEvents,
  IRequestId,
  IToServer,
  IToServerMap,
  ScreenshotRequest,
  ServerToClientEvents,
  SocketData,
  isToClient,
  ToClient,
  ToServer,
} from '@crvouga/screenshot-service';
import { createAction } from '@reduxjs/toolkit';
import express from 'express';
import http from 'http';
import { eventChannel } from 'redux-saga';
import {
  race,
  take,
  delay,
  fork,
  put,
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
};

type IAction = InferActionUnion<typeof Action>;

//
//
//
// Main
//
//
//

export function* mainSaga({ port }: { port: number }) {
  yield fork(startLoggerFlow);
  yield fork(startServerFlow, { port });

  const webBrowser = yield* call(DataAccess.WebBrowser.create);

  yield takeEvery(Action.ClientConnected, function* (action) {
    yield* clientConnectedFlow(action.payload.clientId, webBrowser);
  });
}

function* clientConnectedFlow(
  clientId: string,
  webBrowser: DataAccess.WebBrowser.WebBrowser
) {
  yield takeLatest(ToServer.RequestScreenshot, function* (action) {
    yield* requestScreenshotFlow(clientId, webBrowser, action.payload.request);
  });
}

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
  const getProfileResult = yield* call(DataAccess.Project.getOneById, request);

  if (getProfileResult.type === 'error') {
    yield put(ToClient.RequestScreenshotFailed(clientId));
    return;
  }

  if (request.strategy === 'network-first') {
    yield* networkFirstFlow(clientId, webBrowser, request);
  }

  if (request.strategy === 'cache-first') {
    yield* cacheFirstFlow(request);
  }
};

const cacheFirstFlow = function* (request: ScreenshotRequest) {
  console.log('cacheFirstFlow, ', request);

  yield;
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

  const captureScreenshotResult = yield* call(
    DataAccess.WebBrowser.takeScreenshot,
    page,
    request.imageType
  );

  if (captureScreenshotResult.type === 'error') {
    yield put(ToClient.RequestScreenshotFailed(clientId));
    return;
  }

  yield put(ToClient.Log(clientId, 'info', `Caching screenshot...`));

  const putCacheResult = yield* call(
    DataAccess.Screenshot.put,
    request,
    captureScreenshotResult.buffer
  );

  if (putCacheResult.type === 'error') {
    yield put(ToClient.RequestScreenshotFailed(clientId));
    return;
  }

  yield put(
    ToClient.RequestScreenshotSucceeded({
      clientId,
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
    });

    server.listen(port, () => {
      emit(Action.ServerListening(port));
    });

    return () => {
      io.close();
      server.close();
    };
  });

const startServerFlow = function* ({ port }: { port: number }) {
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

function* startLoggerFlow() {
  yield takeEvery('*', function* (action) {
    console.log('Action:', action);

    if (Action.ServerListening.match(action)) {
      console.log(
        `Notice: Server is listening on http://localhost:${action.payload.port}/`
      );
    }

    yield;
  });
}
