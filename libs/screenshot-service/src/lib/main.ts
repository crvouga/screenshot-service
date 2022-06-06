import { combineReducers, configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import { fork } from 'redux-saga/effects';
import * as CaptureScreenshotRequest from './capture-screenshot-request';
import * as Socket from './socket';
import * as SocketConnection from './socket-connection';

//
//
//
// State
//
//
//

export type State = {
  captureScreenshotRequest: CaptureScreenshotRequest.State;
  socketConnection: SocketConnection.State;
};

export const initialState: State = {
  captureScreenshotRequest: CaptureScreenshotRequest.initialState,
  socketConnection: SocketConnection.initialState,
};

//
//
//
// Action
//
//
//

export const Action = {
  SocketConnection: SocketConnection.Action,
  CaptureScreenshotRequest: CaptureScreenshotRequest.Action,
};

//
//
//
// Reducer
//
//
//

export const reducer = combineReducers<State>({
  captureScreenshotRequest: CaptureScreenshotRequest.reducer,
  socketConnection: SocketConnection.reducer,
});

//
//
//
// Saga
//
//
//

export const saga = function* (socket: Socket.Instance) {
  yield fork(SocketConnection.saga, socket);
};

//
//
//
// Main
//
//
//

export const makeClient = ({
  socketConfig,
}: {
  socketConfig: Socket.Config;
}) => {
  const sagaMiddleware = createSagaMiddleware();

  const store = configureStore({
    preloadedState: initialState,
    reducer: reducer,
    middleware: [sagaMiddleware],
  });

  const socket = Socket.make(socketConfig);

  sagaMiddleware.run(saga, socket);

  return store;
};
