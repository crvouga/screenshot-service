import {
  CaptureScreenshot,
  Data,
  DataAccess,
  Utils,
  WebSocket,
} from '@crvouga/screenshot-service';
import { createAction } from '@reduxjs/toolkit';
import express from 'express';
import { either } from 'fp-ts';
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
import { supabaseClient } from './supabase';
import * as WebBrowser from './web-browser';

//
//
//
// Action
//
//
//

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

  Log: createAction(
    'Log',
    (level: Data.LogLevel.LogLevel, message: string) => ({
      payload: { level, message },
    })
  ),
};

type IAction = Utils.InferActionUnion<typeof Action>;

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
  const webBrowser = yield* call(WebBrowser.create);

  yield put(Action.Log('info', 'created web browser'));

  return webBrowser;
};

const clientFlow = function* (
  clientId: string,
  webBrowser: WebBrowser.WebBrowser
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
  webBrowser: WebBrowser.WebBrowser
) {
  yield takeLatest(CaptureScreenshot.Action.ToServer.Start, function* (action) {
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
  webBrowser: WebBrowser.WebBrowser,
  request: CaptureScreenshot.Request
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
    yield put(
      CaptureScreenshot.Action.ToClient.Log(
        clientId,
        'info',
        'Cancelling request...'
      )
    );

    yield delay(1000);

    yield put(
      CaptureScreenshot.Action.ToClient.Log(
        clientId,
        'notice',
        'Cancelled request'
      )
    );

    yield put(CaptureScreenshot.Action.ToClient.Cancelled(clientId));
  }
};

const requestScreenshotMainFlow = function* (
  clientId: string,
  webBrowser: WebBrowser.WebBrowser,
  request: CaptureScreenshot.Request
) {
  const findProjectResult = yield* call(
    DataAccess.Projects.findOne(supabaseClient),
    request
  );

  if (either.isLeft(findProjectResult)) {
    yield put(
      CaptureScreenshot.Action.ToClient.Failed(clientId, findProjectResult.left)
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
  webBrowser: WebBrowser.WebBrowser,
  request: CaptureScreenshot.Request
) {
  yield put(
    CaptureScreenshot.Action.ToClient.Log(clientId, 'info', 'Checking cache...')
  );

  const cacheResult = yield* call(
    DataAccess.Screenshots.get(supabaseClient),
    request
  );

  if (either.isRight(cacheResult)) {
    const [screenshot] = cacheResult.right;

    const srcResult = yield* call(
      DataAccess.Screenshots.getSrc(supabaseClient),
      screenshot
    );

    if (either.isLeft(srcResult)) {
      yield put(
        CaptureScreenshot.Action.ToClient.Failed(clientId, srcResult.left)
      );
      return;
    }

    const { src } = srcResult.right;

    const response = {
      source: 'Cache',
      clientId,
      screenshotId: screenshot.screenshotId,
      imageType: screenshot.imageType,
      src,
    } as const;

    yield put(CaptureScreenshot.Action.ToClient.Succeeded(response));

    return;
  }

  yield put(
    CaptureScreenshot.Action.ToClient.Log(clientId, 'info', 'Not cached')
  );

  yield* networkFirstFlow(clientId, webBrowser, request);
};

const networkFirstFlow = function* (
  clientId: string,
  webBrowser: WebBrowser.WebBrowser,
  request: CaptureScreenshot.Request
) {
  yield put(
    CaptureScreenshot.Action.ToClient.Log(
      clientId,
      'info',
      'Opening url in web browser...'
    )
  );

  const page = yield* call(WebBrowser.openNewPage, webBrowser);

  yield* call(WebBrowser.goTo, page, request.targetUrl);

  for (let remaining = request.delaySec; remaining > 0; remaining--) {
    yield put(
      CaptureScreenshot.Action.ToClient.Log(
        clientId,
        'info',
        `Delaying for ${remaining} seconds...`
      )
    );

    yield delay(1000);
  }

  yield put(
    CaptureScreenshot.Action.ToClient.Log(
      clientId,
      'info',
      `Capturing screenshot...`
    )
  );

  const captureResult = yield* call(
    WebBrowser.captureScreenshot,
    page,
    request.imageType
  );

  if (either.isLeft(captureResult)) {
    yield put(
      CaptureScreenshot.Action.ToClient.Failed(clientId, captureResult.left)
    );
    return;
  }

  yield put(
    CaptureScreenshot.Action.ToClient.Log(
      clientId,
      'info',
      `Caching screenshot...`
    )
  );

  const putCacheResult = yield* call(
    DataAccess.Screenshots.put(supabaseClient),
    request,
    captureResult.right
  );

  if (either.isLeft(putCacheResult)) {
    yield put(
      CaptureScreenshot.Action.ToClient.Log(
        clientId,
        'error',
        `Failed to cache screenshot.`
      )
    );

    yield put(
      CaptureScreenshot.Action.ToClient.Failed(clientId, putCacheResult.left)
    );
    return;
  }

  const screenshot = putCacheResult.right;

  const srcResult = yield* call(
    DataAccess.Screenshots.getSrc(supabaseClient),
    screenshot
  );

  if (either.isLeft(srcResult)) {
    yield put(
      CaptureScreenshot.Action.ToClient.Log(
        clientId,
        'error',
        `Failed to get screenshot's src`
      )
    );
    yield put(
      CaptureScreenshot.Action.ToClient.Failed(clientId, srcResult.left)
    );
    return;
  }

  const { src } = srcResult.right;

  yield put(
    CaptureScreenshot.Action.ToClient.Log(
      clientId,
      'notice',
      `Request suceeded`
    )
  );

  yield put(
    CaptureScreenshot.Action.ToClient.Succeeded({
      clientId,
      source: 'Network',
      screenshotId: screenshot.screenshotId,
      imageType: screenshot.imageType,
      src,
    })
  );
};

const takeCancelScreenshotRequest = function* (
  requestId: Data.RequestId.RequestId
) {
  while (true) {
    const action: CaptureScreenshot.ToServerMap['Cancel'] = yield take(
      CaptureScreenshot.Action.ToServer.Cancel
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

const createToServerChan = ({ port }: { port: number }) =>
  eventChannel<CaptureScreenshot.ToServer | IAction>((emit) => {
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
    if (CaptureScreenshot.isToClient(action)) {
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
