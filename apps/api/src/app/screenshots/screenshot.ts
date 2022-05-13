import { IImageType, ITargetUrl, ITimeoutMs } from '@screenshot-service/shared';
import puppeteer from 'puppeteer';
import * as ProjectStorage from '../projects/project-storage';
import * as WebBrowserPage from '../web-browser';
import * as ScreenshotStorage from './screenshot-storage';
import { IScreenshotData } from './types';

type IGetScreenshotResult =
  | {
      type: 'success';
      source: 'FromCache' | 'FromPuppeteer';
      data: IScreenshotData;
      imageType: IImageType;
    }
  | {
      type: 'error';
      errors: { message: string }[];
    };

export const getScreenshot = async (
  browser: puppeteer.Browser,
  {
    projectId,
    timeoutMs,
    targetUrl,
    imageType,
  }: {
    projectId: string;
    imageType: IImageType;
    timeoutMs: ITimeoutMs;
    targetUrl: ITargetUrl;
  }
): Promise<IGetScreenshotResult> => {
  const projectResult = await ProjectStorage.getOneById({ projectId });

  if (projectResult.type === 'error') {
    return {
      type: 'error',
      errors: [
        {
          message: `Failed to find a project associated with the provided id: ${projectId}`,
        },
      ],
    };
  }
  console.log('found project', projectResult.project);

  console.log('finding result in storage');

  const getResult = await ScreenshotStorage.get({
    timeoutMs,
    targetUrl,
    imageType,
    projectId,
  });

  if (getResult.type === 'error') {
    const screenshotResult = await WebBrowserPage.takeScreenshot(browser, {
      imageType,
      timeoutMs,
      targetUrl,
    });

    if (screenshotResult.type === 'error') {
      return {
        type: 'error',
        errors: [...screenshotResult.errors, ...getResult.errors],
      };
    }

    await ScreenshotStorage.put(
      { imageType, timeoutMs, targetUrl, projectId },
      screenshotResult.data
    );

    return {
      type: 'success',
      source: 'FromPuppeteer',
      data: screenshotResult.data,
      imageType: imageType,
    };
  }

  return {
    type: 'success',
    source: 'FromCache',
    data: getResult.data,
    imageType: imageType,
  };
};
