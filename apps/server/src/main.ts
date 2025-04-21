import { configureStore } from '@reduxjs/toolkit';
import {
  appRouter,
  captureScreenshotRequestRouterExpress,
} from '@screenshot-service/server-trpc';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import path from 'path';
import createSagaMiddleware from 'redux-saga';
import socketIo from 'socket.io';
import { initialState, saga, SocketServer } from './app/app';
import * as WebBrowser from './app/web-browser';
import { getPort } from './port';

const main = async () => {
  console.log('Starting server...');
  const port = getPort();

  const sagaMiddleware = createSagaMiddleware();
  const store = configureStore({
    preloadedState: initialState,
    reducer: (state) => state,
    middleware: [sagaMiddleware],
  });
  store.subscribe(() => console.log('State:', store.getState()));

  const app = express();

  // Add request logging middleware
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
  });

  // Add body parser middleware
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use(
    cors({
      origin: '*',
      methods: ['GET', 'POST', 'DELETE', 'PATCH', 'PUT', 'HEAD', 'OPTIONS'],
      allowedHeaders: '*',
    })
  );

  const httpServer = app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}/`);
    console.log(`tRPC available at http://localhost:${port}/trpc`);
  });

  const webBrowser = await WebBrowser.create();

  const socketServer: SocketServer = new socketIo.Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  app.use(
    '/trpc',
    createExpressMiddleware({
      router: appRouter,
      createContext: (input) => ({ req: input.req }),
      onError: ({ path, error }) => {
        console.error('tRPC error on path:', path, error);
      },
    })
  );

  captureScreenshotRequestRouterExpress(app);

  app.get('/api', (req, res) => {
    console.log('Received request to root endpoint');
    res.json({ message: 'Hello from screenshot service backend' });
  });

  // Serve static files from the client build directory
  const clientBuildDir = path.join(__dirname, '../../../dist/apps/client');
  app.use(express.static(clientBuildDir));
  app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(clientBuildDir, 'index.html'));
  });

  sagaMiddleware.run(saga, { webBrowser, socketServer });

  const cleanup = () => {
    console.log('Cleaning up...');
    webBrowser.close();
    socketServer.close();
    httpServer.close();
    console.log('Cleanup complete');
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', cleanup);
};

main();
