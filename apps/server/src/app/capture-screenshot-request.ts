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
  console.log(`Starting capture screenshot saga for client: ${clientId}`);

  yield takeEvery(Action.Cancelled, function* (action) {
    console.log(`Request cancelled: ${action.payload.requestId}`);
    const newStatus: FinalStatus = 'Cancelled';
    yield* call(dataAccess.captureScreenshotRequest.updateStatus, {
      requestId: action.payload.requestId,
      status: newStatus,
    });
  });

  yield takeEvery(Action.Failed, function* (action) {
    console.log(
      `Request failed: ${action.payload.requestId}`,
      action.payload.problems
    );
    const newStatus: FinalStatus = 'Failed';
    yield* call(dataAccess.captureScreenshotRequest.updateStatus, {
      requestId: action.payload.requestId,
      status: newStatus,
    });
  });

  yield takeEvery(Action.Succeeded, function* (action) {
    console.log(
      `Request succeeded: ${action.payload.requestId} from ${action.payload.source}`
    );
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
  console.log(`Starting flow for client: ${clientId}`);
  while (true) {
    const action = yield* call(takeStart, { clientId });
    const request = action.payload;
    const requestId = request.requestId;

    console.log(`New request received: ${requestId}`, request);
    yield put(Action.Log(clientId, requestId, 'info', 'starting...'));

    yield fork(function* () {
      console.log(`Forking process for request: ${requestId}`);
      const [cancel, disconnected] = yield race([
        call(takeCancel, { requestId }),
        call(takeClientDisconnected, { clientId }),
        call(startedFlow, { clientId, webBrowser, request }),
      ]);

      if (disconnected) {
        console.log(
          `Client disconnected: ${clientId} for request: ${requestId}`
        );
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
        console.log(`Request cancelled by user: ${requestId}`);
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
  console.log(`Started flow for request: ${request.requestId}`, request);
  const findProjectResult = yield* call(
    dataAccess.project.findManyById,
    request
  );

  if (findProjectResult.type === 'Err') {
    console.error(
      `Failed to find project for request: ${request.requestId}`,
      findProjectResult.error
    );
    yield put(
      Action.Failed(clientId, request.requestId, findProjectResult.error)
    );
    return;
  }

  const [project] = findProjectResult.value;

  if (!project) {
    console.error(`Project not found for request: ${request.requestId}`);
    yield put(
      Action.Failed(clientId, request.requestId, [
        { message: 'Could not find project' },
      ])
    );
    return;
  }

  console.log('project:', project);
  console.log(
    `Found project: ${project.projectName} for request: ${request.requestId}`
  );
  const isOnWhitelist = project.whitelistedUrls.some(
    (url) => url === request.originUrl
  );

  if (!isOnWhitelist) {
    console.error(
      `Origin URL not whitelisted: ${request.originUrl} for project: ${project.projectName}`
    );
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
    console.error(
      `Failed to insert request: ${request.requestId}`,
      insertResult.error
    );
    yield put(Action.Failed(clientId, request.requestId, insertResult.error));
    return;
  }

  console.log(
    `Request inserted successfully: ${request.requestId}, using strategy: ${request.strategy}`
  );
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
  console.log(`Starting cache-first flow for request: ${request.requestId}`);
  yield put(
    Action.Log(clientId, request.requestId, 'info', 'checking cache...')
  );

  const findSucceededResult = yield* call(
    dataAccess.captureScreenshotRequest.findSucceededRequest,
    request
  );

  if (findSucceededResult.type === 'Err') {
    console.error(
      `Failed to check cache for request: ${request.requestId}`,
      findSucceededResult.error
    );
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
    console.log(
      `No cache found for request: ${request.requestId}, falling back to network`
    );
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

  const captureScreenshotRequest = cached.value;
  console.log(
    `Found cached request: ${captureScreenshotRequest.requestId} for request: ${request.requestId}`
  );

  const publicUrlResult = yield* call(
    dataAccess.captureScreenshotRequest.getPublicUrl,
    {
      requestId: captureScreenshotRequest.requestId,
      imageType: captureScreenshotRequest.imageType,
      projectId: captureScreenshotRequest.projectId,
    }
  );

  if (publicUrlResult.type === 'Err') {
    console.error(
      `Failed to get public URL for request: ${request.requestId}`,
      publicUrlResult.error
    );
    yield put(
      Action.Failed(clientId, request.requestId, publicUrlResult.error)
    );
    return;
  }

  const publicUrl = publicUrlResult.value;
  console.log(`Got public URL for cached request: ${publicUrl}`);

  yield put(
    Action.Log(clientId, request.requestId, 'info', 'found cached screenshot')
  );

  yield put(
    Action.Succeeded({
      source: 'Cache',
      clientId,
      requestId: request.requestId,
      imageType: captureScreenshotRequest.imageType,
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
  console.log(`Starting network-first flow for request: ${requestId}`);

  yield put(
    Action.Log(clientId, requestId, 'info', 'opening new browser page...')
  );

  const openPageResult = yield* call(WebBrowser.openNewPage, webBrowser);

  if (openPageResult.type === 'Err') {
    console.error(
      `Failed to open browser page for request: ${requestId}`,
      openPageResult.error
    );
    yield put(Action.Failed(clientId, requestId, [openPageResult.error]));
    return;
  }

  const page = openPageResult.value;
  console.log(`Browser page opened for request: ${requestId}`);

  yield put(Action.Log(clientId, requestId, 'info', 'loading webpage...'));

  const goToResult = yield* call(WebBrowser.goTo, page, request.targetUrl);

  if (goToResult.type === 'Err') {
    console.error(
      `Failed to navigate to URL: ${request.targetUrl} for request: ${requestId}`,
      goToResult.error
    );
    yield put(
      Action.Failed(clientId, request.requestId, [
        { message: `going to page failed. ${goToResult.error.message}` },
      ])
    );
    return;
  }

  console.log(
    `Successfully navigated to URL: ${request.targetUrl} for request: ${requestId}`
  );
  yield put(Action.Log(clientId, requestId, 'info', 'website loaded'));

  yield delay(LOG_DELAY);

  for (let remaining = request.delaySec; remaining > 0; remaining--) {
    console.log(
      `Delaying for request: ${requestId}, ${remaining} seconds remaining`
    );
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

  console.log(`Capturing screenshot for request: ${requestId}`);
  yield put(Action.Log(clientId, requestId, 'info', `capturing screenshot...`));

  const captureResult = yield* call(
    WebBrowser.captureScreenshot,
    page,
    request.imageType
  );

  if (captureResult.type === 'Err') {
    console.error(
      `Failed to capture screenshot for request: ${requestId}`,
      captureResult.error
    );
    yield put(Action.Failed(clientId, requestId, captureResult.error));
    return;
  }

  console.log(
    `Screenshot captured successfully for request: ${requestId}, uploading to cache`
  );
  yield put(Action.Log(clientId, requestId, 'info', `caching screenshot...`));

  console.log(`Uploading screenshot for request: ${requestId}`);

  const uploadResult = yield* call(
    dataAccess.captureScreenshotRequest.uploadScreenshot,
    request,
    captureResult.value
  );

  if (uploadResult.type === 'Err') {
    console.error(
      `Failed to upload screenshot for request: ${requestId}`,
      uploadResult.error
    );
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

  console.log(`Screenshot uploaded successfully for request: ${requestId}`);

  const captureScreenshotRequest = uploadResult.value;

  console.log(`Screenshot uploaded successfully for request: ${requestId}`);

  console.log(
    `Getting public URL for request: ${requestId}, screenshot: ${captureScreenshotRequest}`
  );

  const publicUrlResult = yield* call(
    dataAccess.captureScreenshotRequest.getPublicUrl,
    {
      requestId: captureScreenshotRequest.requestId,
      imageType: captureScreenshotRequest.imageType,
      projectId: captureScreenshotRequest.projectId,
    }
  );

  if (publicUrlResult.type === 'Err') {
    console.error(
      `Failed to get public URL for request: ${requestId}`,
      publicUrlResult.error
    );
    yield put(Action.Failed(clientId, requestId, publicUrlResult.error));
    return;
  }

  const publicUrl = publicUrlResult.value;
  console.log(`Got public URL for request: ${requestId}: ${publicUrl}`);

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
  console.log(`Waiting for start action for client: ${clientId}`);
  while (true) {
    const action: ActionMap['Start'] = yield take(Action.Start);

    if (action.payload.clientId === clientId) {
      console.log(
        `Received start action for client: ${clientId}`,
        action.payload
      );
      return action;
    }
  }
};

const takeCancel = function* ({
  requestId,
}: {
  requestId: Data.RequestId.RequestId;
}) {
  console.log(`Waiting for cancel action for request: ${requestId}`);
  while (true) {
    const action: ActionMap['Cancel'] = yield take(Action.Cancel);

    if (action.payload.requestId === requestId) {
      console.log(`Received cancel action for request: ${requestId}`);
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
