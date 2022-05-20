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
import { IScreenshotData } from '../types';

/* 





*/

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
      source: 'WebBrowser' | 'Storage';
      data: IScreenshotData;
      screenshotId: IScreenshotId;
      imageType: IImageType;
    }
  | {
      type: 'error';
      errors: { message: string }[];
    };

type IDependencies = {
  webBrowser: WebBrowser.WebBrowser;
  log: (logLevel: ILogLevel, message: string) => Promise<void>;
};

/* 





*/

export const requestScreenshot = async (
  dependencies: IDependencies,
  request: IRequest
): Promise<IResponse> => {
  const { strategy } = request;

  switch (strategy) {
    case 'cache-first':
      return handleCacheFirst(dependencies, { ...request, strategy });

    case 'network-first':
      return handleNetworkFirst(dependencies, { ...request, strategy });
  }
};

const handleCacheFirst = async (
  { webBrowser, log }: IDependencies,
  {
    projectId,
    delaySec,
    targetUrl,
    imageType,
  }: IRequest & { strategy: 'cache-first' }
): Promise<IResponse> => {
  await log('info', 'finding project');

  const projectResult = await ProjectStorage.getOneById({ projectId });

  if (projectResult.type === 'error') {
    await log('error', 'failed to find project');

    return {
      type: 'error',
      errors: [
        {
          message: `failed to find a project`,
        },
      ],
    };
  }

  await log('info', 'trying cache first');

  const getResult = await ScreenshotStorage.get({
    delaySec,
    targetUrl,
    imageType,
    projectId,
  });

  if (getResult.type === 'success') {
    await log('info', 'found screenshot cache');

    return {
      type: 'success',
      source: 'Storage',
      data: getResult.data,
      imageType: imageType,
      screenshotId: getResult.screenshot.screenshotId,
    };
  }

  await log('info', 'opening new page');

  const page = await WebBrowser.openNewPage(webBrowser);

  await log('info', 'going to url');

  await WebBrowser.goTo(page, targetUrl);

  for (let elapsed = 0; elapsed < delaySec; elapsed++) {
    await log('info', `delaying for ${delaySec - elapsed} seconds...`);
    await timeout(1000);
  }

  const screenshotResult = await WebBrowser.takeScreenshot(page, imageType);

  if (screenshotResult.type === 'error') {
    await log('error', 'failed to capture screenshot');

    return {
      type: 'error',
      errors: [...screenshotResult.errors, ...getResult.errors],
    };
  }

  await log('info', 'storing screenshot');

  const putResult = await ScreenshotStorage.put(
    {
      imageType,
      delaySec,
      targetUrl,
      projectId,
    },
    screenshotResult.buffer
  );

  if (putResult.type === 'error') {
    await log(
      'error',
      `failed to put screenshot in storage. ${putResult.errors
        .map((error) => error.message)
        .join(' & ')}`
    );

    return {
      type: 'error',
      errors: [{ message: 'failed to put screenshot in storage' }],
    };
  }

  await log('notice', 'screenshot request suceeded ');

  return {
    type: 'success',
    source: 'WebBrowser',
    data: screenshotResult.buffer,
    imageType: imageType,
    screenshotId: putResult.screenshotId,
  };
};

const handleNetworkFirst = async (
  { webBrowser, log }: IDependencies,
  {
    projectId,
    delaySec,
    targetUrl,
    imageType,
  }: IRequest & { strategy: 'network-first' }
): Promise<IResponse> => {
  await log('info', 'finding project');

  const projectResult = await ProjectStorage.getOneById({ projectId });

  if (projectResult.type === 'error') {
    await log('error', 'failed to find project');

    return {
      type: 'error',
      errors: [
        {
          message: `failed to find a project`,
        },
      ],
    };
  }

  await log('info', 'trying network first');

  const page = await WebBrowser.openNewPage(webBrowser);

  await log('info', 'going to url');

  await WebBrowser.goTo(page, targetUrl);

  for (let elapsed = 0; elapsed < delaySec; elapsed++) {
    await log('info', `delaying for ${delaySec - elapsed} seconds...`);
    await timeout(1000);
  }

  const screenshotResult = await WebBrowser.takeScreenshot(page, imageType);

  if (screenshotResult.type === 'error') {
    await log('error', 'failed to capture screenshot. trying cache...');

    const getResult = await ScreenshotStorage.get({
      delaySec,
      targetUrl,
      imageType,
      projectId,
    });

    if (getResult.type === 'success') {
      await log('info', 'found screenshot cache');

      return {
        type: 'success',
        source: 'Storage',
        data: getResult.data,
        imageType: imageType,
        screenshotId: getResult.screenshot.screenshotId,
      };
    }

    return {
      type: 'error',
      errors: [...screenshotResult.errors, ...getResult.errors],
    };
  }

  await log('info', 'storing screenshot');

  const putResult = await ScreenshotStorage.put(
    {
      imageType,
      delaySec,
      targetUrl,
      projectId,
    },
    screenshotResult.buffer
  );

  if (putResult.type === 'error') {
    await log(
      'error',
      `failed to put screenshot in storage. ${putResult.errors
        .map((error) => error.message)
        .join(' & ')}`
    );

    return {
      type: 'error',
      errors: [{ message: 'failed to put screenshot in storage' }],
    };
  }

  await log('notice', 'screenshot request suceeded ');

  return {
    type: 'success',
    source: 'WebBrowser',
    data: screenshotResult.buffer,
    imageType: imageType,
    screenshotId: putResult.screenshotId,
  };
};

/* 


helpers


*/

const timeout = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
