import {
  CaptureScreenshotRequest,
  Data,
} from '@screenshot-service/screenshot-service';
import { DataAccess } from '@screenshot-service/shared';
import {
  ActionPattern,
  cancelled,
  delay,
  fork,
  put,
  race,
  take,
} from 'redux-saga/effects';
import { call, takeEvery } from 'typed-redux-saga';
import { takeClientDisconnected } from './main';
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

//
//
//
// Saga
//
//
//

type CaptureScreenshotRequest = ActionMap['Start']['payload'];

export const saga = function* ({
  clientId,
  webBrowser,
}: {
  clientId: string;
  webBrowser: WebBrowser.WebBrowser;
}) {
  while (true) {
    const action = yield* call(takeStart, { clientId });
    const request = action.payload;
    const requestId = request.requestId;

    yield put(Action.Log(clientId, requestId, 'info', 'starting...'));

    yield fork(function* () {
      const [cancel, disconnected] = yield race([
        call(takeCancel, { requestId }),
        call(takeClientDisconnected, { clientId }),
        call(captureScreenshotFlow, { clientId, webBrowser, request }),
      ]);

      if (disconnected) {
        yield put(
          Action.Log(
            clientId,
            requestId,
            'notice',
            'cancelled because client disconnected'
          )
        );

        yield put(Action.Cancelled(clientId, requestId));
      }

      if (cancel) {
        yield put(Action.Log(clientId, requestId, 'info', 'cancelling...'));

        yield delay(500);

        yield put(Action.Log(clientId, requestId, 'notice', 'cancelled'));

        yield put(Action.Cancelled(clientId, requestId));
      }
    });

    yield fork(persistRequestOutcomeFlow, { requestId });
  }
};

const persistRequestOutcomeFlow = function* ({
  requestId,
}: {
  requestId: Data.RequestId.RequestId;
}) {
  const [cancelled, failed, succeeded] = yield race([
    call(takeCancelled, { requestId }),
    call(takeFailed, { requestId }),
    call(takeSucceeded, { requestId }),
  ]);

  if (cancelled) {
    console.log('saved cancelled');
  }

  if (failed) {
    console.log('failed');
  }

  if (succeeded) {
    console.log('succeeded');
  }
};

const takeCancelled = function* ({
  requestId,
}: {
  requestId: Data.RequestId.RequestId;
}) {
  while (true) {
    const action: ActionMap['Cancelled'] = yield take(Action.Cancelled);

    if (action.payload.requestId === requestId) {
      return action;
    }
  }
};

const takeSucceeded = function* ({
  requestId,
}: {
  requestId: Data.RequestId.RequestId;
}) {
  while (true) {
    const action: ActionMap['Succeeded'] = yield take(Action.Succeeded);

    if (action.payload.requestId === requestId) {
      return action;
    }
  }
};

const takeFailed = function* ({
  requestId,
}: {
  requestId: Data.RequestId.RequestId;
}) {
  while (true) {
    const action: ActionMap['Failed'] = yield take(Action.Failed);

    if (action.payload.requestId === requestId) {
      return action;
    }
  }
};

const takeStart = function* ({ clientId }: { clientId: string }) {
  while (true) {
    const action: ActionMap['Start'] = yield take(Action.Start);

    if (action.payload.clientId === clientId) {
      return action;
    }
  }
};

const takeCancel = function* ({
  requestId,
}: {
  requestId: Data.RequestId.RequestId;
}) {
  while (true) {
    const action: ActionMap['Cancel'] = yield take(Action.Cancel);

    if (action.payload.requestId === requestId) {
      return action;
    }
  }
};

const captureScreenshotFlow = function* ({
  clientId,
  webBrowser,
  request,
}: {
  clientId: string;
  webBrowser: WebBrowser.WebBrowser;
  request: CaptureScreenshotRequest;
}) {
  const findProjectResult = yield* call(
    DataAccess.Projects.findOne(supabaseClient),
    request
  );

  if (findProjectResult.type === 'Err') {
    yield put(
      Action.Failed(clientId, request.requestId, findProjectResult.error)
    );
    return;
  }

  const project = findProjectResult.value;

  const isOnWhitelist = project.whitelistedUrls.some(
    (url) => url === request.originUrl
  );

  if (!isOnWhitelist) {
    yield put(
      Action.Failed(clientId, request.requestId, [
        {
          message: `the origin url "${request.originUrl}" is not on the whitelist for the project "${project.projectName}". add url to whitelist then try again`,
        },
      ])
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
  request: CaptureScreenshotRequest
) {
  yield put(
    Action.Log(clientId, request.requestId, 'info', 'checking cache...')
  );

  const cacheResult = yield* call(
    DataAccess.Screenshots.get(supabaseClient),
    request
  );

  if (cacheResult.type === 'Ok') {
    const [screenshot] = cacheResult.value;

    const publicUrlResult = yield* call(
      DataAccess.Screenshots.getPublicUrl(supabaseClient),
      screenshot
    );

    if (publicUrlResult.type === 'Err') {
      yield put(
        Action.Failed(clientId, request.requestId, [publicUrlResult.error])
      );
      return;
    }

    const publicUrl = publicUrlResult.value;

    yield put(
      Action.Log(clientId, request.requestId, 'info', 'found cached screenshot')
    );

    yield put(
      Action.Succeeded({
        source: 'Cache',
        clientId,
        requestId: request.requestId,
        screenshotId: screenshot.screenshotId,
        imageType: screenshot.imageType,
        src: publicUrl,
      })
    );

    return;
  }

  yield* networkFirstFlow(clientId, webBrowser, request);
};

const networkFirstFlow = function* (
  clientId: string,
  webBrowser: WebBrowser.WebBrowser,
  request: CaptureScreenshotRequest
) {
  const requestId = request.requestId;

  yield put(Action.Log(clientId, requestId, 'info', 'opening new page...'));

  const page = yield* call(WebBrowser.openNewPage, webBrowser);

  yield put(Action.Log(clientId, requestId, 'info', 'going to url...'));

  const goToResult = yield* call(WebBrowser.goTo, page, request.targetUrl);

  if (goToResult.type === 'Err') {
    yield put(
      Action.Failed(clientId, request.requestId, [
        { message: `going to url failed. ${goToResult.error.message}` },
      ])
    );
    return;
  }

  for (let remaining = request.delaySec; remaining > 0; remaining--) {
    yield put(
      Action.Log(
        clientId,
        requestId,
        'info',
        `delaying for ${remaining} seconds...`
      )
    );

    yield delay(1000);
  }

  yield put(Action.Log(clientId, requestId, 'info', `capturing screenshot...`));

  const captureResult = yield* call(
    WebBrowser.captureScreenshot,
    page,
    request.imageType
  );

  if (captureResult.type === 'Err') {
    yield put(Action.Failed(clientId, requestId, captureResult.error));
    return;
  }

  yield put(Action.Log(clientId, requestId, 'info', `caching screenshot...`));

  const putCacheResult = yield* call(
    DataAccess.Screenshots.put(supabaseClient),
    request,
    captureResult.value
  );

  if (putCacheResult.type === 'Err') {
    yield put(
      Action.Log(clientId, requestId, 'error', `failed to cache screenshot.`)
    );
    yield put(Action.Failed(clientId, requestId, putCacheResult.error));
    return;
  }

  const screenshot = putCacheResult.value;

  const publicUrlResult = yield* call(
    DataAccess.Screenshots.getPublicUrl(supabaseClient),
    screenshot
  );

  if (publicUrlResult.type === 'Err') {
    yield put(Action.Failed(clientId, requestId, [publicUrlResult.error]));
    return;
  }

  const publicUrl = publicUrlResult.value;

  yield put(
    Action.Log(clientId, requestId, 'notice', `captured new screenshot`)
  );
  yield put(
    Action.Succeeded({
      clientId,
      requestId,
      source: 'Network',
      screenshotId: screenshot.screenshotId,
      imageType: screenshot.imageType,
      src: publicUrl,
    })
  );
};
