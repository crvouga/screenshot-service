import puppeteer from "puppeteer";
import {
  IImageType,
  ITargetUrl,
  ITimeoutMs,
} from "../../shared/screenshot-data";
import * as ScreenshotId from "../../shared/screenshot-id";
// import * as ScreenshotFileSystem from "./screenshot-data-access-filesystem";
// import * as ScreenshotFirebaseStorage from "./screenshot-data-access-firebase-storage";
import * as ScreenshotSupabaseStorage from "./screenshot-data-access-supabase-storage";
import { IGetScreenshotResult } from "./screenshot-data-access-interface";
import * as ScreenshotPuppeteer from "./screenshot-data-access-puppeteer";

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
  }
): Promise<IGetScreenshotResult> => {
  const screenshotId = ScreenshotId.encode({
    imageType,
    timeoutMs,
    targetUrl,
  });

  const filename = `${screenshotId}.${imageType}`;

  const supabaseGetResult = await ScreenshotSupabaseStorage.get({
    filename,
    imageType,
  });

  console.log(JSON.stringify({ supabaseGetResult }, null, 4));

  if (supabaseGetResult.type === "success") {
    return supabaseGetResult;
  }

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
