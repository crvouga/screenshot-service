import puppeteer from "puppeteer";
import {
  IImageType,
  ITargetUrl,
  ITimeoutMs,
} from "../../shared/screenshot-data";
import * as ScreenshotId from "../../shared/screenshot-id";
import * as ScreenshotFileSystem from "./screenshot-data-access-filesystem";
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

  const fileSystemResult = await ScreenshotFileSystem.get({
    filename,
    imageType,
  });

  if (fileSystemResult.type === "success") {
    return fileSystemResult;
  }

  const puppeteerResult = await ScreenshotPuppeteer.get(browser, {
    imageType,
    timeoutMs,
    targetUrl,
  });

  if (puppeteerResult.type === "success") {
    await ScreenshotFileSystem.put({ filename }, puppeteerResult.image.data);

    return puppeteerResult;
  }

  return puppeteerResult;
};
