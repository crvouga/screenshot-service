import { AnyAction, createAction } from '@reduxjs/toolkit';
import { Data } from '@screenshot-service/screenshot-service';
import { InferActionUnion } from './utils';

//
//
//
// State
//
//
//

export type State = {
  [requestId: Data.RequestId.RequestId]: RequestState;
};

export type RequestState =
  | { type: 'Idle'; logs: Log[] }
  | { type: 'Loading'; logs: Log[]; requestId: Data.RequestId.RequestId }
  | { type: 'Failed'; logs: Log[]; problems: Problem[] }
  | { type: 'Cancelling'; logs: Log[] }
  | { type: 'Cancelled'; logs: Log[] }
  | { type: 'Succeeded'; logs: Log[]; src: string };

export type Log = {
  level: Data.LogLevel.LogLevel;
  message: string;
};

export const initialState: State = {};

export const initialRequestState: RequestState = { type: 'Idle', logs: [] };

export type Problem = { message: string };

//
//
//
// Action
//
//
//

export const ClientToServerAction = {
  Start: createAction(
    `CaptureScreenshot/Start`,
    (payload: {
      clientId: string;
      originUrl: Data.Url.Url;
      requestId: Data.RequestId.RequestId;
      projectId: Data.ProjectId.ProjectId;
      strategy: Data.Strategy.Strategy;
      delaySec: Data.DelaySec.DelaySec;
      imageType: Data.ImageType.ImageType;
      targetUrl: Data.TargetUrl.TargetUrl;
    }) => ({
      payload,
    })
  ),

  Cancel: createAction(
    `CaptureScreenshot/Cancel`,
    (clientId: string, requestId: Data.RequestId.RequestId) => ({
      payload: {
        clientId,
        requestId,
      },
    })
  ),
};

export type ClientToServerAction = InferActionUnion<
  typeof ClientToServerAction
>;

export const isClientToServer = (
  action: AnyAction
): action is ClientToServerAction => {
  return Object.values(ClientToServerAction).some((actionCreator) =>
    actionCreator.match(action)
  );
};

export const ServerToClientAction = {
  Cancelled: createAction(
    `CaptureScreenshot/Cancelled`,
    (clientId: string, requestId: Data.RequestId.RequestId) => ({
      payload: {
        clientId,
        requestId,
      },
    })
  ),

  Succeeded: createAction(
    `CaptureScreenshot/Succeeded`,
    (payload: {
      clientId: string;
      requestId: Data.RequestId.RequestId;
      screenshotId: Data.ScreenshotId.ScreenshotId;
      imageType: Data.ImageType.ImageType;
      src: string;
      source: 'Network' | 'Cache';
    }) => ({
      payload,
    })
  ),

  Failed: createAction(
    `CaptureScreenshot/Failed`,
    (
      clientId: string,
      requestId: Data.RequestId.RequestId,
      problems: Problem[]
    ) => ({
      payload: {
        clientId,
        requestId,
        problems,
      },
    })
  ),

  Log: createAction(
    `CaptureScreenshot/Log`,
    (
      clientId: string,
      requestId: Data.RequestId.RequestId,
      level: Data.LogLevel.LogLevel,
      message
    ) => ({
      payload: { clientId, requestId, level, message },
    })
  ),
};

export type ServerToClientAction = InferActionUnion<
  typeof ServerToClientAction
>;

export const isServerToClient = (
  action: AnyAction
): action is ServerToClientAction => {
  return Object.values(ServerToClientAction).some((actionCreator) =>
    actionCreator.match(action)
  );
};

export const Action = {
  ...ClientToServerAction,
  ...ServerToClientAction,
};

export type Action = InferActionUnion<typeof Action>;

export const isAction = (action: AnyAction): action is Action => {
  return isClientToServer(action) || isServerToClient(action);
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
  if (isAction(action)) {
    const requestId = action.payload.requestId;

    return {
      ...state,
      [requestId]: requestReducer(state[requestId], action),
    };
  }

  return state;
};

const requestReducer = (
  state: RequestState = initialRequestState,
  action: AnyAction
): RequestState => {
  switch (state.type) {
    case 'Failed':
      if (Action.Log.match(action)) {
        return appendLog(action.payload, state);
      }

      if (Action.Start.match(action)) {
        return initLoading(state, action.payload.requestId);
      }

      return state;

    case 'Idle':
      if (Action.Log.match(action)) {
        return appendLog(action.payload, state);
      }

      if (Action.Start.match(action)) {
        return initLoading(state, action.payload.requestId);
      }

      return state;

    case 'Cancelling':
      if (Action.Log.match(action)) {
        return appendLog(action.payload, state);
      }

      if (Action.Cancelled.match(action)) {
        return { ...state, type: 'Cancelled' };
      }

      return state;

    case 'Cancelled':
      if (Action.Log.match(action)) {
        return appendLog(action.payload, state);
      }

      if (Action.Start.match(action)) {
        return initLoading(state, action.payload.requestId);
      }

      return state;

    case 'Loading':
      if (Action.Log.match(action)) {
        return appendLog(action.payload, state);
      }

      if (Action.Failed.match(action)) {
        return { ...state, type: 'Failed', problems: action.payload.problems };
      }

      if (Action.Succeeded.match(action)) {
        return { ...state, type: 'Succeeded', src: action.payload.src };
      }

      if (Action.Cancel.match(action)) {
        return { ...state, type: 'Cancelling' };
      }

      return state;

    case 'Succeeded':
      if (Action.Log.match(action)) {
        return appendLog(action.payload, state);
      }

      if (Action.Start.match(action)) {
        return initLoading(state, action.payload.requestId);
      }

      return state;
  }
};

const appendLog = (log: Log, state: RequestState): RequestState => {
  return { ...state, logs: [...state.logs, log] };
};

const initLoading = (
  state: RequestState,
  requestId: Data.RequestId.RequestId
): RequestState => {
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

export const toRequest = (
  requestId: Data.RequestId.RequestId,
  state: State
): RequestState => state[requestId] ?? initialRequestState;
