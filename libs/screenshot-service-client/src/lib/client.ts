import { configureStore } from '@reduxjs/toolkit';
import * as CaptureScreenshot from './capture-screenshot';
import * as WebSocket from './web-socket';
import createSagaMiddleware from 'redux-saga';
import { fork } from 'redux-saga/effects';

export const create = ({ overrides }: { overrides?: WebSocket.Overrides }) => {
  const sagaMiddleware = createSagaMiddleware();

  const store = configureStore({
    reducer: {
      [CaptureScreenshot.namespace]: CaptureScreenshot.reducer,
    },
    middleware: [sagaMiddleware],
  });

  const webSocket = WebSocket.create({ overrides });

  function* saga() {
    yield fork(CaptureScreenshot.saga, webSocket);
  }

  sagaMiddleware.run(saga);

  return store;
};

export type Client = ReturnType<typeof create>;
