import { configureStore } from '@reduxjs/toolkit';
import * as RequestScreenshot from './request-screenshot';
import * as WebSocket from './web-socket';
import createSagaMiddleware from 'redux-saga';
import { fork } from 'redux-saga/effects';

export const create = ({ overrides }: { overrides?: WebSocket.Overrides }) => {
  const sagaMiddleware = createSagaMiddleware();

  const store = configureStore({
    reducer: {
      requestScreenshot: RequestScreenshot.reducer,
    },
    middleware: [sagaMiddleware],
  });

  const webSocket = WebSocket.create({ overrides });

  function* saga() {
    yield fork(RequestScreenshot.saga, webSocket);
  }

  sagaMiddleware.run(saga);

  return store;
};
