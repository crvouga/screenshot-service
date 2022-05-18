import {
  IImageType,
  ILogLevel,
  ITargetUrl,
  ITimeoutMs,
} from '@screenshot-service/shared';
import { randomUUID } from 'crypto';
import * as ProjectLogStorage from './project-log-storage';
import * as ProjectStorage from './project-storage';
import * as ScreenshotStorage from './screenshot-storage';
import { IScreenshotData } from './types';
import * as WebBrowser from './web-browser';

type IRequest = {
  projectId: string;
  imageType: IImageType;
  timeoutMs: ITimeoutMs;
  targetUrl: ITargetUrl;
};

type IResult =
  | {
      type: 'success';
      source: 'WebBrowser' | 'Storage';
      data: IScreenshotData;
      imageType: IImageType;
    }
  | {
      type: 'error';
      errors: { message: string }[];
    };

export const requestScreenshotFromStorageFirst =
  (browser: WebBrowser.WebBrowser) =>
  async ({
    projectId,
    timeoutMs,
    targetUrl,
    imageType,
  }: IRequest): Promise<IResult> => {
    const requestId = randomUUID();

    const log = async (logLevel: ILogLevel, message: string) => {
      const entry = {
        requestId,
        projectId,
        logLevel,
        message,
      };
      console.log(entry);
      await ProjectLogStorage.append(entry);
    };

    await log('notice', 'screenshot request started');

    await log('info', 'finding associated project');

    const projectResult = await ProjectStorage.getOneById({ projectId });

    if (projectResult.type === 'error') {
      await log('error', 'failed to find associated project in storage');

      return {
        type: 'error',
        errors: [
          {
            message: `Failed to find a project associated with the provided id: ${projectId}`,
          },
        ],
      };
    }

    await log('info', 'found associated project');

    await log('info', 'checking if screenshot is in storage');

    const getResult = await ScreenshotStorage.get({
      timeoutMs,
      targetUrl,
      imageType,
      projectId,
    });

    if (getResult.type === 'success') {
      await log('info', 'found screenshot in storage');

      await log('notice', 'screenshot request suceeded ');

      return {
        type: 'success',
        source: 'Storage',
        data: getResult.data,
        imageType: imageType,
      };
    }

    await log('info', 'failed to find screenshot in storage');

    await log('notice', 'started taking screenshot from web browser');

    const screenshotResult = await WebBrowser.takeScreenshot(browser, {
      imageType,
      timeoutMs,
      targetUrl,
    });

    if (screenshotResult.type === 'error') {
      await log('error', 'failed to take screenshot from web browser');

      return {
        type: 'error',
        errors: [...screenshotResult.errors, ...getResult.errors],
      };
    }

    await log('info', 'took screenshot from web browser');

    await log('info', 'putting screenshot in storage');

    const putResult = await ScreenshotStorage.put(
      { imageType, timeoutMs, targetUrl, projectId },
      screenshotResult.data
    );

    if (putResult.type === 'error') {
      await log('warn', 'failed to put screenshot in storage');
    }

    if (putResult.type === 'success') {
      await log('info', 'put screenshot in storage');
    }

    await log('info', 'took screenshot from web browser');

    await log('notice', 'screenshot request suceeded ');

    return {
      type: 'success',
      source: 'WebBrowser',
      data: screenshotResult.data,
      imageType: imageType,
    };
  };
