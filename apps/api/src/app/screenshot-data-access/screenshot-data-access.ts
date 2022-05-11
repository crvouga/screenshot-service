import puppeteer from 'puppeteer';
import {
  encode,
  IImageType,
  IMaxAgeMs,
  ITargetUrl,
  ITimeoutMs,
} from '@screenshot-service/shared';
import * as ScreenshotPuppeteer from './screenshot-data-access-puppeteer';
import * as ScreenshotSupabaseStorage from './screenshot-data-access-supabase-storage';
import { IScreenshot } from './types';

type IGetResult =
  | {
      type: 'success';
      source: 'FromCache' | 'FromPuppeteer';
      screenshot: IScreenshot;
    }
  | { type: 'error'; errors: { message: string }[] };

export const get = async (
  browser: puppeteer.Browser,
  {
    timeoutMs,
    targetUrl,
    imageType,
  }: {
    imageType: IImageType;
    timeoutMs: ITimeoutMs;
    targetUrl: ITargetUrl;
    maxAgeMs: IMaxAgeMs;
  }
): Promise<IGetResult> => {
  const screenshotId = encode({
    timeoutMs,
    imageType,
    targetUrl,
  });

  const filename = `${screenshotId}.${imageType}`;

  const supabaseResult = await ScreenshotSupabaseStorage.get({
    filename,
    imageType,
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
      { filename },
      puppeteerResult.screenshot.data
    );

    return {
      type: 'success',
      source: 'FromPuppeteer',
      screenshot: puppeteerResult.screenshot,
    };
  }

  const screenshotAgeMs = Date.now() - supabaseResult.screenshot.updatedAtMs;

  console.log({ screenshotAgeMs: formatMs(screenshotAgeMs) });

  return {
    type: 'success',
    source: 'FromCache',
    screenshot: supabaseResult.screenshot,
  };
};

//
//
// helpers
//
//

const toHours = (ms: number) => Math.floor((ms / (1000 * 60 * 60)) % 60);
const toMinutes = (ms: number) => Math.floor((ms / (1000 * 60)) % 60);
const toSeconds = (ms: number) => Math.floor((ms / 1000) % 60);
//
const formatHours = (hours: number) => `${hours} hr`;
const formatMinutes = (minutes: number) => `${minutes} min`;
const formatSeconds = (seconds: number) => `${seconds} sec`;
//

const formatMs = (ms: number) =>
  [
    formatHours(toHours(ms)),
    formatMinutes(toMinutes(ms)),
    formatSeconds(toSeconds(ms)),
  ].join(' ');
