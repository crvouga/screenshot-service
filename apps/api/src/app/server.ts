import {
  ClientToServerEvents,
  IApiErrorBody,
  ILogLevel,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from '@crvouga/screenshot-service';
import express, { ErrorRequestHandler } from 'express';
import http from 'http';
import path from 'path';
import socket from 'socket.io';
import * as WebBrowser from './data-access/web-browser';
import { requestScreenshotStorageFirst } from './features/request-screenshot';

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
