import {
  IDelaySec,
  IImageType,
  ILogLevel,
  IProjectId,
  IScreenshotId,
  IStrategy,
  ITargetUrl,
} from '@crvouga/screenshot-service';
import * as ProjectStorage from '../data-access/project-storage';
import * as ScreenshotStorage from '../data-access/screenshot-storage';
import * as WebBrowser from '../data-access/web-browser';
import { IScreenshotBuffer } from '../types';

//
//
//
//
//
//
//
//

type IRequest = {
  strategy: IStrategy;
  projectId: IProjectId;
  imageType: IImageType;
  delaySec: IDelaySec;
  targetUrl: ITargetUrl;
};

type IResponse =
  | {
      type: 'success';
      buffer: IScreenshotBuffer;
      screenshotId: IScreenshotId;
      imageType: IImageType;
    }
  | {
      type: 'aborted';
    }
  | {
      type: 'error';
      errors: { message: string }[];
    };

type IDependencies = {
  webBrowser: WebBrowser.WebBrowser;
  log: (logLevel: ILogLevel, message: string) => Promise<void>;
};

//
//
//
//
//
//
//

export const requestScreenshot = async (
  dependencies: IDependencies,
  request: IRequest
): Promise<IResponse> => {
  const { log } = dependencies;
  const { strategy, projectId } = request;

  await log('info', 'loading project...');

  const getResult = await ProjectStorage.getOneById({ projectId });

  if (getResult.type === 'error') {
    await log('error', `failed to load project. ${getResult.error}`);

    return {
      type: 'error',
      errors: [
        { message: `failed to load project.` },
        { message: getResult.error },
      ],
    };
  }

  switch (strategy) {
    case 'cache-first':
      return tryCacheFirst(dependencies, { ...request, strategy });

    case 'network-first':
      return tryNetworkFirst(dependencies, { ...request, strategy });
  }
};

const tryCacheFirst = async (
  dependencies: IDependencies,
  request: IRequest & { strategy: 'cache-first' }
): Promise<IResponse> => {
  const { log } = dependencies;

  await log('info', 'trying cache first');

  const getResult = await ScreenshotStorage.get(request);

  if (getResult.type === 'success') {
    await log('info', 'returning cached screenshot');

    return {
      type: 'success',
      buffer: getResult.buffer,
      imageType: request.imageType,
      screenshotId: getResult.screenshot.screenshotId,
    };
  }

  const captureResult = await captureScreenshot(dependencies, request);

  if (captureResult.type === 'error') {
    await log('error', 'failed to capture screenshot');

    return {
      type: 'error',
      errors: [...captureResult.errors, ...getResult.errors],
    };
  }

  const cacheResponse = await cacheScreenshot(
    dependencies,
    request,
    captureResult.buffer
  );

  return cacheResponse;
};

const tryNetworkFirst = async (
  dependencies: IDependencies,
  request: IRequest & { strategy: 'network-first' }
): Promise<IResponse> => {
  const { log } = dependencies;

  await log('info', 'trying network first');

  const captureResult = await captureScreenshot(dependencies, request);

  if (captureResult.type === 'error') {
    await log('error', 'failed to captured screenshot. trying cache...');

    const getResult = await ScreenshotStorage.get(request);

    if (getResult.type === 'success') {
      await log('info', 'returing cached screenshot');

      return {
        type: 'success',
        buffer: getResult.buffer,
        imageType: request.imageType,
        screenshotId: getResult.screenshot.screenshotId,
      };
    }

    return {
      type: 'error',
      errors: [...captureResult.errors, ...getResult.errors],
    };
  }

  const cacheResponse = await cacheScreenshot(
    dependencies,
    request,
    captureResult.buffer
  );

  return cacheResponse;
};

//
//
//
//
//
//
//

const cacheScreenshot = async (
  { log }: IDependencies,
  request: IRequest,
  buffer: IScreenshotBuffer
): Promise<IResponse> => {
  await log('info', 'caching screenshot');

  const putResult = await ScreenshotStorage.put(request, buffer);

  if (putResult.type === 'error') {
    const putErrorMessage = putResult.errors
      .map((error) => error.message)
      .join(' & ');

    await log('error', `failed to cache screenshot. ${putErrorMessage}`);

    return {
      type: 'error',
      errors: [{ message: 'failed to cache screenshot' }, ...putResult.errors],
    };
  }

  await log('notice', 'returning screenshot');

  return {
    type: 'success',
    buffer: buffer,
    imageType: request.imageType,
    screenshotId: putResult.screenshotId,
  };
};

//
//
//
//
//
//
//

const captureScreenshot = async (
  { webBrowser, log }: IDependencies,
  { delaySec, targetUrl, imageType }: IRequest
) => {
  const page = await WebBrowser.openNewPage(webBrowser);

  await log('info', 'opening web page...');

  await WebBrowser.goTo(page, targetUrl);

  for (let elapsed = 0; elapsed < delaySec; elapsed++) {
    await log(
      'info',
      `delaying for ${pluralize(delaySec - elapsed, 'second', 'seconds')}...`
    );

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  await log('info', 'capturing screenshot');

  const result = await WebBrowser.takeScreenshot(page, imageType);

  return result;
};

//
//
//
//
//
//
//
//

const pluralize = (count: number, singular: string, plural: string) => {
  if (count === 1) {
    return `${count} ${singular}`;
  }

  return `${count} ${plural}`;
};
