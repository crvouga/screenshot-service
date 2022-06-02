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

const initialState: State = { type: 'Idle', logs: [] };

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
  StartRequest: createAction('ToServer/StartRequest', (request: Request) => ({
    payload: { request },
  })),

  CancelRequest: createAction(
    'ToServer/CancelRequest',
    (requestId: Data.RequestId.RequestId) => ({
      payload: { requestId },
    })
  ),
};

export type ToServer = InferActionUnion<typeof ToServer>;

export type ToServerMap = InferActionMap<typeof ToServer>;

const ToClient = {
  RequestCancelled: createAction(
    'ToClient/RequestCancelled',
    (clientId: string) => ({
      payload: {
        clientId,
      },
    })
  ),

  RequestSucceeded: createAction(
    'ToClient/RequestSucceeded',
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

  RequestFailed: createAction(
    'CaptureScreenshot/ToClient/RequestFailed',
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

export const reducer = (
  state: State = initialState,
  action: AnyAction
): State => {
  switch (state.type) {
    case 'Failed':
      if (ToClient.Log.match(action)) {
        return addLog(action.payload, state);
      }

      if (ToServer.StartRequest.match(action)) {
        return initLoading(state);
      }

      return state;

    case 'Idle':
      if (ToClient.Log.match(action)) {
        return addLog(action.payload, state);
      }

      if (ToServer.StartRequest.match(action)) {
        return initLoading(state);
      }

      return state;

    case 'Cancelling':
      if (ToClient.Log.match(action)) {
        return addLog(action.payload, state);
      }

      if (ToClient.RequestCancelled.match(action)) {
        return { ...state, type: 'Cancelled' };
      }

      return state;

    case 'Cancelled':
      if (ToClient.Log.match(action)) {
        return addLog(action.payload, state);
      }

      if (ToServer.StartRequest.match(action)) {
        return initLoading(state);
      }

      return state;

    case 'Loading':
      if (ToClient.Log.match(action)) {
        return addLog(action.payload, state);
      }

      if (ToClient.RequestFailed.match(action)) {
        return { ...state, type: 'Failed', errors: action.payload.errors };
      }

      if (ToClient.RequestSucceeded.match(action)) {
        return { ...state, type: 'Succeeded', src: action.payload.src };
      }

      if (ToServer.CancelRequest.match(action)) {
        return { ...state, type: 'Cancelled' };
      }

      return state;

    case 'Succeeded':
      if (ToClient.Log.match(action)) {
        return addLog(action.payload, state);
      }

      if (ToServer.StartRequest.match(action)) {
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

  yield takeEvery(Action.ToServer.CancelRequest, function* (action) {
    yield call(webSocket.emit, action);
  });

  yield takeEvery(Action.ToServer.StartRequest, function* (action) {
    yield call(webSocket.emit, action);
  });
}
