import puppeteer from "puppeteer";
import {
  IImageType,
  IMaxAgeMs,
  ITargetUrl,
  ITimeoutMs,
} from "../../shared/screenshot-data";
import * as ScreenshotId from "../../shared/screenshot-id";
import { IGetScreenshotResult } from "./screenshot-data-access-interface";
import * as ScreenshotPuppeteer from "./screenshot-data-access-puppeteer";
import * as ScreenshotSupabaseStorage from "./screenshot-data-access-supabase-storage";

export const get = async (
  browser: puppeteer.Browser,
  {
    timeoutMs,
    targetUrl,
    imageType,
    maxAgeMs,
  }: {
    imageType: IImageType;
    timeoutMs: ITimeoutMs;
    targetUrl: ITargetUrl;
    maxAgeMs: IMaxAgeMs;
  }
): Promise<IGetScreenshotResult> => {
  const screenshotId = ScreenshotId.encode({
    timeoutMs,
    imageType,
    targetUrl,
  });

  console.log({ maxAgeMs });

  const filename = `${screenshotId}.${imageType}`;

  const supabaseGetResult = await ScreenshotSupabaseStorage.get({
    filename,
    imageType,
  });

  if (supabaseGetResult.type === "success") {
    return supabaseGetResult;
  }

  console.log(JSON.stringify({ supabaseGetResult }, null, 4));

  const puppeteerGetResult = await ScreenshotPuppeteer.get(browser, {
    imageType,
    timeoutMs,
    targetUrl,
  });

  if (puppeteerGetResult.type === "success") {
    const supabasePutResult = await ScreenshotSupabaseStorage.put(
      { filename },
      puppeteerGetResult.image.data
    );

    console.log(JSON.stringify({ supabasePutResult }, null, 4));

    return puppeteerGetResult;
  }

  return puppeteerGetResult;
};
