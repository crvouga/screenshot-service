import * as WebBrowser from './web-browser';
import {
  Data,
  DataAccess,
  Shared,
} from '@screenshot-service/screenshot-service';
import { AnyAction, createAction } from '@reduxjs/toolkit';
import { InferActionMap, InferActionUnion } from './utils';
import { delay, fork, put, race, take } from 'redux-saga/effects';
import { call } from 'typed-redux-saga';
import { either } from 'fp-ts';
import { supabaseClient } from './supabase';

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

export type State = Shared.CaptureScreenshot.State;

export const initialState = Shared.CaptureScreenshot.initialState;

type Log = Shared.CaptureScreenshot.Log;

type Request = Shared.CaptureScreenshot.Request;

//
//
//
// Action
//
//
//

export const Action = {
  Start: createAction(
    `${namespace}/Start`,
    (clientId: string, request: Request) => ({
      payload: {
        clientId,
        request,
      },
    })
  ),

  Cancel: createAction(
    `${namespace}/Cancel`,
    (clientId: string, requestId: Data.RequestId.RequestId) => ({
      payload: {
        clientId,
        requestId,
      },
    })
  ),

  Cancelled: createAction(`${namespace}/Cancelled`, (clientId: string) => ({
    payload: {
      clientId,
    },
  })),

  Succeeded: createAction(
    `${namespace}/Succeeded`,
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
    `${namespace}/Failed`,
    (clientId: string, errors: Error[]) => ({
      payload: {
        clientId,
        errors,
      },
    })
  ),

  Log: createAction(
    `${namespace}/Log`,
    (clientId: string, level: Data.LogLevel.LogLevel, message) => ({
      payload: { clientId, level, message },
    })
  ),
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

export const reducer = (state: State, action: Action): State => {
  switch (state.type) {
    case 'Failed':
      if (Action.Log.match(action)) {
        return appendLog(action.payload, state);
      }

      if (Action.Start.match(action)) {
        return initLoading(state, action.payload.request.requestId);
      }

      return state;

    case 'Idle':
      if (Action.Log.match(action)) {
        return appendLog(action.payload, state);
      }

      if (Action.Start.match(action)) {
        return initLoading(state, action.payload.request.requestId);
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
        return initLoading(state, action.payload.request.requestId);
      }

      return state;

    case 'Loading':
      if (Action.Log.match(action)) {
        return appendLog(action.payload, state);
      }

      if (Action.Failed.match(action)) {
        return { ...state, type: 'Failed', errors: action.payload.errors };
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
        return initLoading(state, action.payload.request.requestId);
      }

      return state;
  }
};

const appendLog = (log: Log, state: State): State => {
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

export const saga = function* ({
  clientId,
  webBrowser,
}: {
  clientId: string;
  webBrowser: WebBrowser.WebBrowser;
}) {
  yield fork(captureScreenshotFlow, { clientId, webBrowser });
};

const captureScreenshotFlow = function* ({
  clientId,
  webBrowser,
}: {
  clientId: string;
  webBrowser: WebBrowser.WebBrowser;
}) {
  while (true) {
    const action = yield* call(takeStart, clientId);

    const request = action.payload.request;

    const { cancel } = yield race({
      cancel: call(takeCancel, request.requestId),
      requestScreenshot: call(captureScreenshotMainFlow, {
        clientId,
        webBrowser,
        request,
      }),
    });

    if (cancel) {
      yield put(Action.Log(clientId, 'info', 'Cancelling request...'));

      yield delay(1000);

      yield put(Action.Log(clientId, 'notice', 'Cancelled request'));

      yield put(Action.Cancelled(clientId));
    }
  }
};

const captureScreenshotMainFlow = function* ({
  clientId,
  webBrowser,
  request,
}: {
  clientId: string;
  webBrowser: WebBrowser.WebBrowser;
  request: Request;
}) {
  const findProjectResult = yield* call(
    DataAccess.Projects.findOne(supabaseClient),
    request
  );

  if (either.isLeft(findProjectResult)) {
    yield put(Action.Failed(clientId, findProjectResult.left));
    return;
  }

  if (request.strategy === 'cache-first') {
    yield* cacheFirstFlow(clientId, webBrowser, request);
  }

  if (request.strategy === 'network-first') {
    yield* networkFirstFlow(clientId, webBrowser, request);
  }
};

const cacheFirstFlow = function* (
  clientId: string,
  webBrowser: WebBrowser.WebBrowser,
  request: Request
) {
  yield put(Action.Log(clientId, 'info', 'Checking cache...'));

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
      yield put(Action.Failed(clientId, srcResult.left));
      return;
    }

    const { src } = srcResult.right;

    yield put(
      Action.Succeeded({
        source: 'Cache',
        clientId,
        screenshotId: screenshot.screenshotId,
        imageType: screenshot.imageType,
        src,
      })
    );

    return;
  }

  yield* networkFirstFlow(clientId, webBrowser, request);
};

const networkFirstFlow = function* (
  clientId: string,
  webBrowser: WebBrowser.WebBrowser,
  request: Request
) {
  yield put(Action.Log(clientId, 'info', 'Opening url in web browser...'));

  const page = yield* call(WebBrowser.openNewPage, webBrowser);

  yield* call(WebBrowser.goTo, page, request.targetUrl);

  yield* call(countDown, clientId, request.delaySec);

  yield put(Action.Log(clientId, 'info', `Capturing screenshot...`));

  const captureResult = yield* call(
    WebBrowser.captureScreenshot,
    page,
    request.imageType
  );

  if (either.isLeft(captureResult)) {
    yield put(Action.Failed(clientId, captureResult.left));
    return;
  }

  yield put(Action.Log(clientId, 'info', `Caching screenshot...`));

  const putCacheResult = yield* call(
    DataAccess.Screenshots.put(supabaseClient),
    request,
    captureResult.right
  );

  if (either.isLeft(putCacheResult)) {
    yield put(Action.Log(clientId, 'error', `Failed to cache screenshot.`));
    yield put(Action.Failed(clientId, putCacheResult.left));
    return;
  }

  const screenshot = putCacheResult.right;

  const srcResult = yield* call(
    DataAccess.Screenshots.getSrc(supabaseClient),
    screenshot
  );

  if (either.isLeft(srcResult)) {
    yield put(Action.Log(clientId, 'error', `Failed to get screenshot's src`));
    yield put(Action.Failed(clientId, srcResult.left));
    return;
  }

  const { src } = srcResult.right;

  yield put(Action.Log(clientId, 'notice', `Request suceeded`));
  yield put(
    Action.Succeeded({
      clientId,
      source: 'Network',
      screenshotId: screenshot.screenshotId,
      imageType: screenshot.imageType,
      src,
    })
  );
};

//
//
//
// Helpers
//
//
//

const takeStart = function* (clientId: string) {
  while (true) {
    const action: ActionMap['Start'] = yield take(Action.Start);

    if (action.payload.clientId === clientId) {
      return action;
    }
  }
};

const takeCancel = function* (requestId: Data.RequestId.RequestId) {
  while (true) {
    const action: ActionMap['Cancel'] = yield take(Action.Cancel);

    if (action.payload.requestId === requestId) {
      return action;
    }
  }
};

const countDown = function* (clientId: string, seconds: number) {
  for (let remaining = seconds; remaining > 0; remaining--) {
    yield put(
      Action.Log(clientId, 'info', `Delaying for ${remaining} seconds...`)
    );

    yield delay(1000);
  }
};
