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
import cors from 'cors';
import express, { Application, ErrorRequestHandler, Router } from 'express';
import morgan from 'morgan';
import path from 'path';
import { Browser } from 'puppeteer';
import { requestScreenshotFromStorageFirst } from './screenshot';
import * as WebBrowser from './web-browser';

// ███████╗███████╗██████╗ ██╗   ██╗███████╗██████╗
// ██╔════╝██╔════╝██╔══██╗██║   ██║██╔════╝██╔══██╗
// ███████╗█████╗  ██████╔╝██║   ██║█████╗  ██████╔╝
// ╚════██║██╔══╝  ██╔══██╗╚██╗ ██╔╝██╔══╝  ██╔══██╗
// ███████║███████╗██║  ██║ ╚████╔╝ ███████╗██║  ██║
// ╚══════╝╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚══════╝╚═╝  ╚═╝

export const createServer = async () => {
  const app = express();

  app.use(morgan('dev'));

  app.use(cors());

  await useApi(app);

  useServeClientBuild(app);

  const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
    if (err) {
      const errorString = String(err?.toString?.() ?? "I don't know why >:{");

      const apiErrorBody: IApiErrorBody = [
        {
          message: `Something wen wrong. ${errorString}`,
        },
      ];

      res.status(500).json(apiErrorBody).end();
      return;
    }

    next();
  };

  app.use(errorHandler);

  return app;
};

//  █████╗ ██████╗ ██╗
// ██╔══██╗██╔══██╗██║
// ███████║██████╔╝██║
// ██╔══██║██╔═══╝ ██║
// ██║  ██║██║     ██║
// ╚═╝  ╚═╝╚═╝     ╚═╝

export const useApi = async (app: Application) => {
  const webBrowser = await WebBrowser.create();

  const router = Router();

  await useGetScreenshot(webBrowser, router);

  const errorHandler: ErrorRequestHandler = (_err, _req, _res, next) => {
    webBrowser.close();
    next();
  };

  router.use(errorHandler);

  router.use(errorHandler);

  app.use(API_ENDPOINT, router);
};

const useGetScreenshot = async (browser: Browser, router: Router) => {
  router.get(GET_SCREENSHOT_ENDPOINT, async (req, res) => {
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

//  ██████╗██╗     ██╗███████╗███╗   ██╗████████╗    ██████╗ ██╗   ██╗██╗██╗     ██████╗
// ██╔════╝██║     ██║██╔════╝████╗  ██║╚══██╔══╝    ██╔══██╗██║   ██║██║██║     ██╔══██╗
// ██║     ██║     ██║█████╗  ██╔██╗ ██║   ██║       ██████╔╝██║   ██║██║██║     ██║  ██║
// ██║     ██║     ██║██╔══╝  ██║╚██╗██║   ██║       ██╔══██╗██║   ██║██║██║     ██║  ██║
// ╚██████╗███████╗██║███████╗██║ ╚████║   ██║       ██████╔╝╚██████╔╝██║███████╗██████╔╝
//  ╚═════╝╚══════╝╚═╝╚══════╝╚═╝  ╚═══╝   ╚═╝       ╚═════╝  ╚═════╝ ╚═╝╚══════╝╚═════╝

const clientBuildPath = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'dist',
  'apps',
  'client'
);

export const useServeClientBuild = (router: Router) => {
  router.use(express.static(clientBuildPath));

  router.get('*', (_req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
};
