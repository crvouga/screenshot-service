import {
  IDelaySec,
  IImageType,
  ILogLevel,
  ITargetUrl,
} from '@crvouga/screenshot-service';
import * as ProjectStorage from '../data-access/project-storage';
import * as ScreenshotStorage from '../data-access/screenshot-storage';
import * as WebBrowser from '../data-access/web-browser';
import { IScreenshotData } from '../types';

type IRequest = {
  projectId: string;
  imageType: IImageType;
  delaySec: IDelaySec;
  targetUrl: ITargetUrl;
};

type IResponse =
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

type Log = (logLevel: ILogLevel, message: string) => Promise<void>;

export const requestScreenshotStorageFirst =
  ({ webBrowser, log }: { webBrowser: WebBrowser.WebBrowser; log: Log }) =>
  async ({
    projectId,
    delaySec,
    targetUrl,
    imageType,
  }: IRequest): Promise<IResponse> => {
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
      delaySec,
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

    const screenshotResult = await WebBrowser.captureScreenshot(webBrowser, {
      imageType,
      delaySec,
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
      {
        imageType,
        delaySec,
        targetUrl,
        projectId,
      },
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
