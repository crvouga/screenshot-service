import {
  CaptureScreenshotRequest,
  Data,
} from '@screenshot-service/screenshot-service';
import { delay, takeEvery, fork, put, race, take } from 'redux-saga/effects';
import { call } from 'typed-redux-saga';
import { takeClientDisconnected } from './app';
import { dataAccess } from './data-access';
import { InferActionMap } from './utils';
import * as WebBrowser from './web-browser';
import { FinalStatus } from '@screenshot-service/shared';

//
//
//
// Action
//
//
//

const Action = CaptureScreenshotRequest.Action;

type ActionMap = InferActionMap<typeof Action>;

const LOG_DELAY = 1000;

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
  yield takeEvery(Action.Cancelled, function* (action) {
    const newStatus: FinalStatus = 'Cancelled';
    yield* call(dataAccess.captureScreenshotRequest.updateStatus, {
      requestId: action.payload.requestId,
      status: newStatus,
    });
  });

  yield takeEvery(Action.Failed, function* (action) {
    const newStatus: FinalStatus = 'Failed';
    yield* call(dataAccess.captureScreenshotRequest.updateStatus, {
      requestId: action.payload.requestId,
      status: newStatus,
    });
  });

  yield takeEvery(Action.Succeeded, function* (action) {
    const newStatus: FinalStatus =
      action.payload.source === 'Cache'
        ? 'Succeeded_Cached'
        : 'Succeeded_Network';

    yield* call(dataAccess.captureScreenshotRequest.updateStatus, {
      requestId: action.payload.requestId,
      status: newStatus,
    });
  });

  yield fork(startFlow, { clientId, webBrowser });
};

const startFlow = function* ({
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
        call(startedFlow, { clientId, webBrowser, request }),
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
  }
};

const startedFlow = function* ({
  clientId,
  webBrowser,
  request,
}: {
  clientId: string;
  webBrowser: WebBrowser.WebBrowser;
  request: CaptureScreenshotRequest;
}) {
  const findProjectResult = yield* call(
    dataAccess.project.findManyById,
    request
  );

  if (findProjectResult.type === 'Err') {
    yield put(
      Action.Failed(clientId, request.requestId, findProjectResult.error)
    );
    return;
  }

  const [project] = findProjectResult.value;

  if (!project) {
    yield put(
      Action.Failed(clientId, request.requestId, [
        { message: 'Could not find project' },
      ])
    );
    return;
  }

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

  const insertResult = yield* call(
    dataAccess.captureScreenshotRequest.insertNew,
    {
      ...request,
      status: 'Loading',
    }
  );

  if (insertResult.type === 'Err') {
    yield put(Action.Failed(clientId, request.requestId, insertResult.error));
    return;
  }

  switch (request.strategy) {
    case 'CacheFirst':
      yield* cacheFirstFlow(clientId, webBrowser, request);
      return;

    case 'NetworkFirst':
      yield* networkFirstFlow(clientId, webBrowser, request);
      return;
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

  const findSucceededResult = yield* call(
    dataAccess.captureScreenshotRequest.findSucceededRequest,
    request
  );

  if (findSucceededResult.type === 'Err') {
    yield put(
      Action.Log(
        clientId,
        request.requestId,
        'info',
        'Failed get from cache. Trying network...'
      )
    );
    yield delay(LOG_DELAY);

    yield* networkFirstFlow(clientId, webBrowser, request);

    return;
  }

  const cached = findSucceededResult.value;

  if (cached.type === 'Nothing') {
    yield put(
      Action.Log(
        clientId,
        request.requestId,
        'info',
        'Not cached. Trying network...'
      )
    );

    yield delay(LOG_DELAY);

    yield* networkFirstFlow(clientId, webBrowser, request);

    return;
  }

  const earlierRequest = cached.value;

  const publicUrlResult = yield* call(
    dataAccess.captureScreenshotRequest.getPublicUrl,
    earlierRequest
  );

  if (publicUrlResult.type === 'Err') {
    yield put(
      Action.Failed(clientId, request.requestId, publicUrlResult.error)
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
      imageType: earlierRequest.imageType,
      src: publicUrl,
    })
  );
  return;
};

//
//
//
//
// Network First
//
//
//
//

const networkFirstFlow = function* (
  clientId: string,
  webBrowser: WebBrowser.WebBrowser,
  request: CaptureScreenshotRequest
) {
  const requestId = request.requestId;

  yield put(
    Action.Log(clientId, requestId, 'info', 'opening new browser page...')
  );

  const openPageResult = yield* call(WebBrowser.openNewPage, webBrowser);

  if (openPageResult.type === 'Err') {
    yield put(Action.Failed(clientId, requestId, [openPageResult.error]));
    return;
  }

  const page = openPageResult.value;

  yield put(Action.Log(clientId, requestId, 'info', 'loading webpage...'));

  const goToResult = yield* call(WebBrowser.goTo, page, request.targetUrl);

  if (goToResult.type === 'Err') {
    yield put(
      Action.Failed(clientId, request.requestId, [
        { message: `going to page failed. ${goToResult.error.message}` },
      ])
    );
    return;
  }

  yield put(Action.Log(clientId, requestId, 'info', 'website loaded'));

  yield delay(LOG_DELAY);

  for (let remaining = request.delaySec; remaining > 0; remaining--) {
    yield put(
      Action.Log(
        clientId,
        requestId,
        'info',
        `delaying for ${pluralize(remaining, 'second', 'seconds')}...`
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

  const uploadResult = yield* call(
    dataAccess.captureScreenshotRequest.uploadScreenshot,
    request,
    captureResult.value
  );

  if (uploadResult.type === 'Err') {
    yield put(
      Action.Log(
        clientId,
        requestId,
        'error',
        `failed to upload screenshot to cache.`
      )
    );
    yield put(Action.Failed(clientId, requestId, uploadResult.error));
    return;
  }

  const captureScreenshotRequest = uploadResult.value;

  const publicUrlResult = yield* call(
    dataAccess.captureScreenshotRequest.getPublicUrl,
    captureScreenshotRequest
  );

  if (publicUrlResult.type === 'Err') {
    yield put(Action.Failed(clientId, requestId, publicUrlResult.error));
    return;
  }

  const publicUrl = publicUrlResult.value;

  yield put(
    Action.Log(clientId, requestId, 'notice', `captured new screenshot`)
  );

  yield put(
    Action.Succeeded({
      clientId,
      requestId: captureScreenshotRequest.requestId,
      source: 'Network',
      imageType: captureScreenshotRequest.imageType,
      src: publicUrl,
    })
  );
};

//
//
//
//
// Helpers
//
//
//
//

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

const pluralize = (
  quantity: number,
  singular: string,
  plural: string
): string => {
  if (quantity === 1) {
    return `1 ${singular}`;
  }

  return `${quantity} ${plural}`;
};
