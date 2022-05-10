import {
  API_ENDPOINT,
  castImageType,
  castMaxAgeMs,
  castTargetUrl,
  castTimeoutMs,
  GET_SCREENSHOT_ENDPOINT,
  IApiErrorBody,
  IGetScreenshotQueryParams,
  resultToErrors,
} from '@screenshot-service/api-interfaces';
import { Application, ErrorRequestHandler, Router } from 'express';
import { Browser } from 'puppeteer';
import env from './dotenv';
import * as Screenshot from './screenshot-data-access/screenshot-data-access';
import * as ScreenshotPuppeteer from './screenshot-data-access/screenshot-data-access-puppeteer';

export const useApi = async (app: Application) => {
  const browser = await ScreenshotPuppeteer.createPuppeteerBrowser();

  const router = Router();

  useSecurity(router);

  useGetScreenshot(browser, router);

  useErrorHandler(browser, router);

  app.use(API_ENDPOINT, router);
};

/**
 *
 *
 *
 * get screenshot
 *
 *
 *
 */

const useGetScreenshot = async (browser: Browser, router: Router) => {
  router.get(GET_SCREENSHOT_ENDPOINT, async (req, res) => {
    const queryParams: IGetScreenshotQueryParams = req.query;

    const timeoutMsResult = castTimeoutMs(queryParams.timeoutMs);
    const targetUrlResult = castTargetUrl(queryParams.targetUrl);
    const imageTypeResult = castImageType(queryParams.imageType);
    const maxAgeMsResult = castMaxAgeMs(queryParams.maxAgeMs);

    if (
      !(
        timeoutMsResult.type === 'success' &&
        targetUrlResult.type === 'success' &&
        imageTypeResult.type === 'success' &&
        maxAgeMsResult.type === 'success'
      )
    ) {
      const apiErrorBody: IApiErrorBody = [
        ...resultToErrors(timeoutMsResult),
        ...resultToErrors(targetUrlResult),
        ...resultToErrors(imageTypeResult),
        ...resultToErrors(maxAgeMsResult),
      ];

      res.status(400).json(apiErrorBody);
      return;
    }

    const result = await Screenshot.get(browser, {
      imageType: imageTypeResult.data,
      timeoutMs: timeoutMsResult.data,
      targetUrl: targetUrlResult.data,
      maxAgeMs: maxAgeMsResult.data,
    });

    if (result.type === 'error') {
      const apiErrorBody: IApiErrorBody = result.errors;

      res.status(400).json(apiErrorBody).end();
      return;
    }

    const image = result.screenshot;

    const statusCode = result.source === 'FromPuppeteer' ? 201 : 200;

    res
      .writeHead(statusCode, {
        'Content-Type': image.type,
        'Content-Length': image.data.length,
      })
      .end(image.data);
  });
};

/**
 *
 *
 *
 * security
 *
 *
 *
 */

const useSecurity = async (router: Router) => {
  router.use(async (req, res, next) => {
    const whitelist = await getWhitelist();
    const clientUrl = req.headers.origin ?? req.headers.referer;

    if (!clientUrl) {
      const apiErrorBody: IApiErrorBody = [
        {
          message: `'origin' header is undefined or 'referer' header is undefined. One of these headers has to be defined so I can check if you are on the whitelist.`,
        },
      ];

      res.status(400).json(apiErrorBody).end();
      return;
    }

    if (isOnWhitelist(whitelist, clientUrl)) {
      next();
      return;
    }

    const apiErrorBody: IApiErrorBody = [
      {
        message: `You are not on the whitelist. Your url is ${clientUrl}. Whitelisted urls are: ${whitelist.join(
          ', '
        )} `,
      },
    ];

    res.status(400).json(apiErrorBody).end();
  });
};

export const getWhitelist = async () => {
  return env.URL_WHITELIST_CSV?.split(',').map((item) => item.trim()) ?? [];
};

const toHostname = (maybeUrl: string) => {
  try {
    return new URL(maybeUrl).hostname;
  } catch (_error) {
    return maybeUrl;
  }
};

export const isOnWhitelist = (whitelist: string[], item: string) => {
  return whitelist.some((whitelistedItem) => {
    return toHostname(whitelistedItem) === toHostname(item);
  });
};

/**
 *
 *
 *
 * error handler
 *
 *
 *
 */

const useErrorHandler = (browser: Browser, router: Router) => {
  const errorHandler: ErrorRequestHandler = (_err, _req, _res, next) => {
    browser.close();
    next();
  };

  router.use(errorHandler);
};
