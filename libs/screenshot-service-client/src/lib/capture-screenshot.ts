import { AnyAction, createAction } from '@reduxjs/toolkit';
import { eventChannel } from 'redux-saga';
import { call, put, takeEvery } from 'redux-saga/effects';
import * as Data from './data';
import { InferActionMap, InferActionUnion } from './utils';
import * as WebSocket from './web-socket';

//
//
//
// Namespace
//
//
//

export const namespace = 'captureScreenshot' as const;

//
//
//
// State
//
//
//

export type State =
  | { type: 'Idle'; logs: Log[] }
  | { type: 'Loading'; logs: Log[]; requestId: Data.RequestId.RequestId }
  | { type: 'Failed'; logs: Log[]; errors: Error[] }
  | { type: 'Cancelling'; logs: Log[] }
  | { type: 'Cancelled'; logs: Log[] }
  | { type: 'Succeeded'; logs: Log[]; src: string };

type Log = { level: Data.LogLevel.LogLevel; message: string };

export type Request = {
  requestId: Data.RequestId.RequestId;
  projectId: Data.ProjectId.ProjectId;
  strategy: Data.Strategy.Strategy;
  delaySec: Data.DelaySec.DelaySec;
  imageType: Data.ImageType.ImageType;
  targetUrl: Data.TargetUrl.TargetUrl;
};

// export type ProjectLog = {
//   id: Data.Uuid.Uuid;
//   message: string;
//   projectId: Data.ProjectId.ProjectId;
//   logLevel: Data.LogLevel.LogLevel;
//   requestId: Data.RequestId.RequestId;
// };

//
//
//
// Action
//
//
//

const ToServer = {
  RequestScreenshot: createAction(
    'ToServer/RequestScreenshot',
    (request: Request) => ({
      payload: { request },
    })
  ),

  CancelRequestScreenshot: createAction(
    'ToServer/CancelRequestScreenshot',
    (requestId: Data.RequestId.RequestId) => ({
      payload: { requestId },
    })
  ),
};

export type ToServer = InferActionUnion<typeof ToServer>;

export type ToServerMap = InferActionMap<typeof ToServer>;

const ToClient = {
  CancelRequestSucceeded: createAction(
    'ToClient/CancelRequestScreenshotSucceeded',
    (clientId: string) => ({
      payload: {
        clientId,
      },
    })
  ),

  RequestScreenshotSucceeded: createAction(
    'ToClient/RequestScreenshotSucceeded',
    (payload: {
      clientId: string;
      screenshotId: Data.ScreenshotId.ScreenshotId;
      imageType: Data.ImageType.ImageType;
      src: string;
      source: 'Network' | 'Cache';
    }) => ({
      payload,
    })
  ),

  RequestScreenshotFailed: createAction(
    'ToClient/RequestScreenshotFailed',
    (clientId: string, errors: Error[]) => ({
      payload: {
        clientId,
        errors,
      },
    })
  ),

  Log: createAction(
    'Log',
    (clientId: string, level: Data.LogLevel.LogLevel, message) => ({
      payload: { clientId, level, message },
    })
  ),
};

export const isToClient = (action: AnyAction): action is ToClient => {
  return Object.values(ToClient).some((actionCreator) =>
    actionCreator.match(action)
  );
};

export type ToClient = InferActionUnion<typeof ToClient>;

export type ToClientMap = InferActionMap<typeof ToClient>;

export const Action = {
  ToServer,
  ToClient,
};

export type Action = ToServer | ToClient;

//
//
//
// Reducer
//
//
//

export const reducer = (state: State, action: Action): State => {
  switch (state.type) {
    case 'Failed':
      if (ToClient.Log.match(action)) {
        return addLog(action.payload, state);
      }

      if (ToServer.RequestScreenshot.match(action)) {
        return initLoading(state);
      }

      return state;

    case 'Idle':
      if (ToClient.Log.match(action)) {
        return addLog(action.payload, state);
      }

      if (ToServer.RequestScreenshot.match(action)) {
        return initLoading(state);
      }

      return state;

    case 'Cancelling':
      if (ToClient.Log.match(action)) {
        return addLog(action.payload, state);
      }

      if (ToClient.CancelRequestSucceeded.match(action)) {
        return { ...state, type: 'Cancelled' };
      }

      return state;

    case 'Cancelled':
      if (ToClient.Log.match(action)) {
        return addLog(action.payload, state);
      }

      if (ToServer.RequestScreenshot.match(action)) {
        return initLoading(state);
      }

      return state;

    case 'Loading':
      if (ToClient.Log.match(action)) {
        return addLog(action.payload, state);
      }

      if (ToClient.RequestScreenshotFailed.match(action)) {
        return { ...state, type: 'Failed', errors: action.payload.errors };
      }

      if (ToClient.RequestScreenshotSucceeded.match(action)) {
        return { ...state, type: 'Succeeded', src: action.payload.src };
      }

      if (ToServer.CancelRequestScreenshot.match(action)) {
        return { ...state, type: 'Cancelled' };
      }

      return state;

    case 'Succeeded':
      if (ToClient.Log.match(action)) {
        return addLog(action.payload, state);
      }

      if (ToServer.RequestScreenshot.match(action)) {
        return initLoading(state);
      }

      return state;
  }
};

const addLog = (log: Log, state: State): State => {
  return { ...state, logs: [...state.logs, log] };
};

const initLoading = (state: State): State => {
  return {
    ...state,
    type: 'Loading',
    requestId: Data.RequestId.generate(),
  };
};

//
//
//
// Selectors
//
//
//

export const Selectors = {
  slice: (parent: { [namespace in typeof namespace]: State }) =>
    parent[namespace],
};

//
//
//
// Saga
//
//
//

export function* saga(webSocket: WebSocket.WebSocket) {
  yield takeEvery(eventChannel(webSocket.onAction), function* (action) {
    yield put(action);
  });

  yield takeEvery(Action.ToServer.CancelRequestScreenshot, function* (action) {
    yield call(webSocket.emit, action);
  });

  yield takeEvery(Action.ToServer.RequestScreenshot, function* (action) {
    yield call(webSocket.emit, action);
  });
}
