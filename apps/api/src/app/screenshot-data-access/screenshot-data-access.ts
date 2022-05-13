import { IImageType, ITargetUrl, ITimeoutMs } from '@screenshot-service/shared';
import puppeteer from 'puppeteer';
import * as Projects from '../projects';
import * as ScreenshotPuppeteer from './screenshot-data-access-puppeteer';
import * as ScreenshotSupabaseStorage from './screenshot-data-access-supabase-storage';
import { IScreenshotData } from './types';

type IGetResult =
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
): Promise<IGetResult> => {
  const projectResult = await Projects.getOneById({ projectId });

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

  const supabaseResult = await ScreenshotSupabaseStorage.get({
    timeoutMs,
    targetUrl,
    imageType,
    projectId,
  });

  if (supabaseResult.type === 'error') {
    const puppeteerResult = await ScreenshotPuppeteer.get(browser, {
      imageType,
      timeoutMs,
      targetUrl,
    });

    if (puppeteerResult.type === 'error') {
      return {
        type: 'error',
        errors: [...puppeteerResult.errors, ...supabaseResult.errors],
      };
    }

    await ScreenshotSupabaseStorage.put(
      { imageType, timeoutMs, targetUrl, projectId },
      puppeteerResult.data
    );

    return {
      type: 'success',
      source: 'FromPuppeteer',
      data: puppeteerResult.data,
      imageType: imageType,
    };
  }

  return {
    type: 'success',
    source: 'FromCache',
    data: supabaseResult.data,
    imageType: imageType,
  };
};

// //
// //
// // helpers
// //
// //

// const toHours = (ms: number) => Math.floor((ms / (1000 * 60 * 60)) % 60);
// const toMinutes = (ms: number) => Math.floor((ms / (1000 * 60)) % 60);
// const toSeconds = (ms: number) => Math.floor((ms / 1000) % 60);
// //
// const formatHours = (hours: number) => `${hours} hr`;
// const formatMinutes = (minutes: number) => `${minutes} min`;
// const formatSeconds = (seconds: number) => `${seconds} sec`;
// //

// export const formatMs = (ms: number) =>
//   [
//     formatHours(toHours(ms)),
//     formatMinutes(toMinutes(ms)),
//     formatSeconds(toSeconds(ms)),
//   ].join(' ');
