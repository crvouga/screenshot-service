import {
  IDelaySec,
  IImageType,
  ILogLevel,
  IProjectId,
  IScreenshotId,
  ITargetUrl,
} from '@crvouga/screenshot-service';
import * as ProjectStorage from '../data-access/project-storage';
import * as ScreenshotStorage from '../data-access/screenshot-storage';
import * as WebBrowser from '../data-access/web-browser';
import { IScreenshotData } from '../types';

type IRequest = {
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

type Log = (logLevel: ILogLevel, message: string) => Promise<void>;

export const requestScreenshotStorageFirst = async (
  { webBrowser, log }: { webBrowser: WebBrowser.WebBrowser; log: Log },
  { projectId, delaySec, targetUrl, imageType }: IRequest
): Promise<IResponse> => {
  await log('info', 'getting project');

  const projectResult = await ProjectStorage.getOneById({ projectId });

  if (projectResult.type === 'error') {
    await log('error', "didn't find project");

    return {
      type: 'error',
      errors: [
        {
          message: `Failed to find a project associated with the provided id: ${projectId}`,
        },
      ],
    };
  }

  await log('info', 'checking cache');

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

const timeout = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
