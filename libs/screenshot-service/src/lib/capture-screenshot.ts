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

//
//
//
// Action
//
//
//

const ToServer = {
  Start: createAction(`${namespace}/ToServer/Start`, (request: Request) => ({
    payload: { request },
  })),

  Cancel: createAction(
    `${namespace}/ToServer/Cancel`,
    (requestId: Data.RequestId.RequestId) => ({
      payload: { requestId },
    })
  ),
};

export type ToServer = InferActionUnion<typeof ToServer>;

export type ToServerMap = InferActionMap<typeof ToServer>;

const ToClient = {
  Cancelled: createAction(
    `${namespace}/ToClient/Cancelled`,
    (clientId: string) => ({
      payload: {
        clientId,
      },
    })
  ),

  Succeeded: createAction(
    `${namespace}/ToClient/Succeeded`,
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

  Failed: createAction(
    `${namespace}/ToClient/Failed`,
    (clientId: string, errors: Error[]) => ({
      payload: {
        clientId,
        errors,
      },
    })
  ),

  Log: createAction(
    `${namespace}/ToClient/Log`,
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

      if (ToServer.Start.match(action)) {
        return initLoading(state, action.payload.request.requestId);
      }

      return state;

    case 'Idle':
      if (ToClient.Log.match(action)) {
        return addLog(action.payload, state);
      }

      if (ToServer.Start.match(action)) {
        return initLoading(state, action.payload.request.requestId);
      }

      return state;

    case 'Cancelling':
      if (ToClient.Log.match(action)) {
        return addLog(action.payload, state);
      }

      if (ToClient.Cancelled.match(action)) {
        return { ...state, type: 'Cancelled' };
      }

      return state;

    case 'Cancelled':
      if (ToClient.Log.match(action)) {
        return addLog(action.payload, state);
      }

      if (ToServer.Start.match(action)) {
        return initLoading(state, action.payload.request.requestId);
      }

      return state;

    case 'Loading':
      if (ToClient.Log.match(action)) {
        return addLog(action.payload, state);
      }

      if (ToClient.Failed.match(action)) {
        return { ...state, type: 'Failed', errors: action.payload.errors };
      }

      if (ToClient.Succeeded.match(action)) {
        return { ...state, type: 'Succeeded', src: action.payload.src };
      }

      if (ToServer.Cancel.match(action)) {
        return { ...state, type: 'Cancelling' };
      }

      return state;

    case 'Succeeded':
      if (ToClient.Log.match(action)) {
        return addLog(action.payload, state);
      }

      if (ToServer.Start.match(action)) {
        return initLoading(state, action.payload.request.requestId);
      }

      return state;
  }
};

const addLog = (log: Log, state: State): State => {
  return { ...state, logs: [...state.logs, log] };
};

const initLoading = (
  state: State,
  requestId: Data.RequestId.RequestId
): State => {
  return {
    ...state,
    type: 'Loading',
    logs: [],
    requestId,
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

  yield takeEvery(Action.ToServer.Cancel, function* (action) {
    yield call(webSocket.emit, action);
  });

  yield takeEvery(Action.ToServer.Start, function* (action) {
    yield call(webSocket.emit, action);
  });
}
