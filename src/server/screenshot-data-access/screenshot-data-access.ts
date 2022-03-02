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

  const filename = `${screenshotId}.${imageType}`;

  const exisitngResult = await ScreenshotSupabaseStorage.get({
    filename,
    imageType,
  });

  if (exisitngResult.type === "error") {
    const newResult = await ScreenshotPuppeteer.get(browser, {
      imageType,
      timeoutMs,
      targetUrl,
    });

    if (newResult.type === "success") {
      await ScreenshotSupabaseStorage.put({ filename }, newResult.image.data);
    }

    return newResult;
  }

  return exisitngResult;
};
