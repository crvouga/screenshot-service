import { configureStore } from '@reduxjs/toolkit';
import { appRouter } from '@screenshot-service/server-trpc';
import { createHTTPHandler } from '@trpc/server/adapters/standalone';
import http from 'http';
import createSagaMiddleware from 'redux-saga';
import socketIo from 'socket.io';
import { initialState, saga, SocketServer } from './app/app';
import { dataAccess } from './app/data-access';
import * as WebBrowser from './app/web-browser';
import { getPort } from './port';

const main = async () => {
  const port = getPort();

  const sagaMiddleware = createSagaMiddleware();

  const store = configureStore({
    preloadedState: initialState,
    reducer: (state) => state,
    middleware: [sagaMiddleware],
  });

  const webBrowser = await WebBrowser.create();

  const httpServer = http.createServer();

  const trpcHandler = createHTTPHandler({
    router: appRouter,
    createContext: () => ({ dataAccess }),
    onError: ({ path, error }) => {
      console.error('tRPC error on path:', path, error);
    },
  });

  httpServer.on('request', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Request-Method', '*');
    res.setHeader(
      'Access-Control-Allow-Methods',
      'OPTIONS, GET, POST, DELETE, PATCH, PUT, HEAD'
    );
    res.setHeader('Access-Control-Allow-Headers', '*');
    if (req.url?.startsWith('/trpc')) {
      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      console.log('Request received:', req.url);

      return trpcHandler(req, res);
    }

    if (req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({ message: 'Hello from screenshot service backend' })
      );
      return;
    }

    res.writeHead(404);
    res.end();
  });

  const socketServer: SocketServer = new socketIo.Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

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

  // Start the server
  httpServer.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}/`);
    console.log(`tRPC available at http://localhost:${port}/trpc`);
  });

  return store;
};

main();
