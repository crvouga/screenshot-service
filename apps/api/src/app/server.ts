import {
  API_ENDPOINT,
  castDelaySec,
  castImageType,
  castProjectId,
  castTargetUrl,
  ClientToServerEvents,
  GET_SCREENSHOT_ENDPOINT,
  IApiErrorBody,
  IGetScreenshotQueryParams,
  ILogLevel,
  InterServerEvents,
  IProjectId,
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
  const app = createApp();

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

  const webBrowser = await WebBrowser.create();

  io.on('connection', (socket) => {
    console.log('client connected');

    socket.on('requestScreenshot', async (request) => {
      console.log('requestScreenshot', request);

      socket.join(request.requestId);

      const log = async (level: ILogLevel, message: string) => {
        socket.emit('log', level, message);
        console.log(level, message);
      };

      const result = await requestScreenshotStorageFirst(
        { webBrowser, log },
        request
      );

      socket.leave(request.requestId);

      if (result.type === 'error') {
        socket.emit('requestScreenshotFailed', result.errors);

        return;
      }

      socket.emit('requestScreenshotSucceeded', result);
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

const createApp = () => {
  const app = express();

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
