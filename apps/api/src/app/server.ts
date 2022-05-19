import {
  API_ENDPOINT,
  castDelaySec,
  castImageType,
  castTargetUrl,
  ClientToServerEvents,
  GET_SCREENSHOT_ENDPOINT,
  IApiErrorBody,
  IGetScreenshotQueryParams,
  InterServerEvents,
  resultToErrors,
  ServerToClientEvents,
  SocketData,
} from '@crvouga/screenshot-service';
import cors from 'cors';
import express, { Application, ErrorRequestHandler, Router } from 'express';
import morgan from 'morgan';
import path from 'path';
import { Browser } from 'puppeteer';
import { requestScreenshotStorageFirst } from './features/request-screenshot';
import * as WebBrowser from './data-access/web-browser';
import http from 'http';
import socket from 'socket.io';

/**
 *
 *
 *
 * sever
 *
 *
 *
 */

export const startServer = async ({ port }: { port: number }) => {
  const app = await createApp();

  const server = http.createServer(app);

  const io = new socket.Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('client connected');

    socket.on('requestScreenshot', async (request) => {
      // const result = await requestScreenshotStorageFirst({
      //   webBrowser: browser,
      //   log: async (level, message) => {
      //     console.log(level, message);
      //   },
      // })({
      //   imageType: imageTypeResult.data,
      //   delaySec: delaySecResult.data,
      //   targetUrl: targetUrlResult.data,
      //   projectId: projectIdResult.data,
      // });
    });
  });

  server.listen(port, () => {
    console.log(`Server is listening on http://localhost:${port}/`);
  });
};

/**
 *
 *
 *
 * socket app
 *
 *
 *
 */

/**
 *
 *
 *
 * http app
 *
 *
 *
 */

const createApp = async () => {
  const app = express();

  app.use(morgan('dev'));

  app.use(cors());

  await useApi(app);

  const clientBuildPath = path.join(
    __dirname,
    '..',
    '..',
    '..',
    'dist',
    'apps',
    'client'
  );

  app.use(express.static(clientBuildPath));

  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });

  app.use(errorHandler);

  return app;
};

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

export const useApi = async (app: Application) => {
  const router = Router();

  const webBrowser = await WebBrowser.create();

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

    const delaySecResult = castDelaySec(queryParams.delaySec);
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
      delaySecResult.type === 'error' ||
      targetUrlResult.type === 'error' ||
      imageTypeResult.type === 'error' ||
      projectIdResult.type === 'error'
    ) {
      const apiErrorBody: IApiErrorBody = [
        ...resultToErrors(delaySecResult),
        ...resultToErrors(targetUrlResult),
        ...resultToErrors(imageTypeResult),
      ];

      res.status(400).json(apiErrorBody);
      return;
    }

    const result = await requestScreenshotStorageFirst({
      webBrowser: browser,
      log: async (level, message) => {
        console.log(level, message);
      },
    })({
      imageType: imageTypeResult.data,
      delaySec: delaySecResult.data,
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
