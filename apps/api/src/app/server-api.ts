import {
  API_ENDPOINT,
  GET_SCREENSHOT_ENDPOINT,
  IApiErrorBody,
  IGetScreenshotQueryParams,
} from '@crvouga/screenshot-service';
import {
  castImageType,
  castTargetUrl,
  castTimeoutMs,
  resultToErrors,
} from '@screenshot-service/shared';
import { Application, ErrorRequestHandler, Router } from 'express';
import { Browser } from 'puppeteer';
import { requestScreenshotFromStorageFirst } from './screenshot';
import * as WebBrowser from './web-browser';

export const useApi = async (app: Application) => {
  const webBrowser = await WebBrowser.create();

  const router = Router();

  useGetScreenshot(webBrowser, router);

  useErrorHandler(webBrowser, router);

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
    const clientUrl = req.headers.origin ?? req.headers.referer;

    const orgin = new URL(req.headers.origin);
    const referer = new URL(req.headers.referer);

    console.log({ origin: orgin.toString(), referer: referer.toString() });

    const queryParams: Partial<IGetScreenshotQueryParams> = req.query;

    const timeoutMsResult = castTimeoutMs(queryParams.timeoutMs);
    const targetUrlResult = castTargetUrl(queryParams.targetUrl);
    const imageTypeResult = castImageType(queryParams.imageType);
    const projectIdResult =
      typeof queryParams.projectId === 'string'
        ? { type: 'success', data: queryParams.projectId }
        : {
            type: 'error',
            errors: [
              { message: 'projectId query param is missing or invalid' },
            ],
          };

    if (
      timeoutMsResult.type === 'error' ||
      targetUrlResult.type === 'error' ||
      imageTypeResult.type === 'error' ||
      projectIdResult.type === 'error'
    ) {
      const apiErrorBody: IApiErrorBody = [
        ...resultToErrors(timeoutMsResult),
        ...resultToErrors(targetUrlResult),
        ...resultToErrors(imageTypeResult),
      ];

      res.status(400).json(apiErrorBody);
      return;
    }

    const result = await requestScreenshotFromStorageFirst(browser)({
      imageType: imageTypeResult.data,
      timeoutMs: timeoutMsResult.data,
      targetUrl: targetUrlResult.data,
      projectId: projectIdResult.data,
    });

    if (result.type === 'error') {
      const apiErrorBody: IApiErrorBody = result.errors;

      res.status(400).json(apiErrorBody).end();
      return;
    }

    const statusCode = result.source === 'WebBrowser' ? 201 : 200;

    res
      .writeHead(statusCode, {
        'Content-Type': result.imageType,
        'Content-Length': result.data.length,
      })
      .end(result.data);
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
