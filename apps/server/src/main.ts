import { configureStore } from '@reduxjs/toolkit';
import { appRouter } from '@screenshot-service/server-trpc';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import cors from 'cors';
import express from 'express';
import createSagaMiddleware from 'redux-saga';
import socketIo from 'socket.io';
import { initialState, saga, SocketServer } from './app/app';
import { dataAccess } from './app/data-access';
import * as WebBrowser from './app/web-browser';
import { getPort } from './port';

const main = async () => {
  const port = getPort();

  // Initialize Redux store and saga middleware
  const sagaMiddleware = createSagaMiddleware();
  const store = configureStore({
    preloadedState: initialState,
    reducer: (state) => state,
    middleware: [sagaMiddleware],
  });

  // Create Express app
  const app = express();

  // Enable CORS for all routes
  app.use(
    cors({
      origin: '*',
      methods: ['GET', 'POST', 'DELETE', 'PATCH', 'PUT', 'HEAD', 'OPTIONS'],
      allowedHeaders: '*',
    })
  );

  // Create HTTP server
  const httpServer = app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}/`);
    console.log(`tRPC available at http://localhost:${port}/trpc`);
  });

  // Initialize WebBrowser
  const webBrowser = await WebBrowser.create();

  // Set up Socket.IO
  const socketServer: SocketServer = new socketIo.Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Set up tRPC middleware
  app.use(
    '/trpc',
    createExpressMiddleware({
      router: appRouter,
      createContext: () => ({ dataAccess }),
      onError: ({ path, error }) => {
        console.error('tRPC error on path:', path, error);
      },
    })
  );

  // Root route
  app.get('/', (req, res) => {
    res.json({ message: 'Hello from screenshot service backend' });
  });

  // Start saga middleware
  sagaMiddleware.run(saga, { webBrowser, socketServer });

  // Handle process termination
  const cleanup = () => {
    console.log('Cleaning up...');
    webBrowser.close();
    socketServer.close();
    httpServer.close();
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', cleanup);

  return store;
};

main();
