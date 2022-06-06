import {
  Data,
  DataAccess,
  CaptureScreenshotRequest,
} from '@screenshot-service/screenshot-service';
import { either } from 'fp-ts';
import { delay, fork, put, race, take } from 'redux-saga/effects';
import { call } from 'typed-redux-saga';
import { supabaseClient } from './supabase';
import { InferActionMap } from './utils';
import * as WebBrowser from './web-browser';

//
//
//
// Action
//
//
//

const Action = CaptureScreenshotRequest.Action;

type ActionMap = InferActionMap<typeof Action>;

type StartCaptureRequest = ActionMap['Start']['payload'];

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

    const requestId = action.payload.requestId;

    const { cancel } = yield race({
      cancel: call(takeCancel, requestId),
      requestScreenshot: call(captureScreenshotMainFlow, {
        clientId,
        webBrowser,
        request: action.payload,
      }),
    });

    if (cancel) {
      yield put(
        Action.Log(clientId, requestId, 'info', 'Cancelling request...')
      );

      yield delay(1000);

      yield put(Action.Log(clientId, requestId, 'notice', 'Cancelled request'));

      yield put(Action.Cancelled(clientId, requestId));
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
  request: StartCaptureRequest;
}) {
  const findProjectResult = yield* call(
    DataAccess.Projects.findOne(supabaseClient),
    request
  );

  if (either.isLeft(findProjectResult)) {
    yield put(
      Action.Failed(clientId, request.requestId, findProjectResult.left)
    );
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
  request: StartCaptureRequest
) {
  yield put(
    Action.Log(clientId, request.requestId, 'info', 'Checking cache...')
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
      yield put(Action.Failed(clientId, request.requestId, srcResult.left));
      return;
    }

    const { src } = srcResult.right;

    yield put(
      Action.Succeeded({
        source: 'Cache',
        clientId,
        requestId: request.requestId,
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
  request: StartCaptureRequest
) {
  const requestId = request.requestId;

  yield put(
    Action.Log(clientId, requestId, 'info', 'Opening url in web browser...')
  );

  const page = yield* call(WebBrowser.openNewPage, webBrowser);

  yield* call(WebBrowser.goTo, page, request.targetUrl);

  for (let remaining = request.delaySec; remaining > 0; remaining--) {
    yield put(
      Action.Log(
        clientId,
        requestId,
        'info',
        `Delaying for ${remaining} seconds...`
      )
    );

    yield delay(1000);
  }

  yield put(Action.Log(clientId, requestId, 'info', `Capturing screenshot...`));

  const captureResult = yield* call(
    WebBrowser.captureScreenshot,
    page,
    request.imageType
  );

  if (either.isLeft(captureResult)) {
    yield put(Action.Failed(clientId, requestId, captureResult.left));
    return;
  }

  yield put(Action.Log(clientId, requestId, 'info', `Caching screenshot...`));

  const putCacheResult = yield* call(
    DataAccess.Screenshots.put(supabaseClient),
    request,
    captureResult.right
  );

  if (either.isLeft(putCacheResult)) {
    yield put(
      Action.Log(clientId, requestId, 'error', `Failed to cache screenshot.`)
    );
    yield put(Action.Failed(clientId, requestId, putCacheResult.left));
    return;
  }

  const screenshot = putCacheResult.right;

  const srcResult = yield* call(
    DataAccess.Screenshots.getSrc(supabaseClient),
    screenshot
  );

  if (either.isLeft(srcResult)) {
    yield put(
      Action.Log(clientId, requestId, 'error', `Failed to get screenshot's src`)
    );
    yield put(Action.Failed(clientId, requestId, srcResult.left));
    return;
  }

  const { src } = srcResult.right;

  yield put(Action.Log(clientId, requestId, 'notice', `Request suceeded`));
  yield put(
    Action.Succeeded({
      clientId,
      requestId,
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
