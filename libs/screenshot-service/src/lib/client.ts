import {
  AnyAction,
  bindActionCreators,
  configureStore,
  createAction,
} from '@reduxjs/toolkit';
import { Data } from '@screenshot-service/screenshot-service';
import createSagaMiddleware, { eventChannel } from 'redux-saga';
import { put, takeEvery } from 'redux-saga/effects';
import socketClient, { Socket } from 'socket.io-client';
import * as Shared from './shared';
import { InferActionUnion } from './utils';

//
//
//
// Namespace
//
//
//

const namespace = 'client' as const;

//
//
//
// State
//
//
//

export type State = {
  status: 'ServerConnected' | 'ServerConnecting';
  captureScreenshot: Shared.CaptureScreenshot.State;
};

const initialState: State = {
  status: 'ServerConnecting',
  captureScreenshot: Shared.CaptureScreenshot.initialState,
};

//
//
//
// Action
//
//
//

const Action = {
  ServerConnected: createAction(`${namespace}/ServerConnected`),
  ServerDisconnected: createAction(`${namespace}/ServerDisconnected`),
  ServerConnectionError: createAction(`${namespace}/ServerConnectionError`),
  RecievedServerAction: createAction(
    `${namespace}/RecievedServerAction`,
    (payload: Shared.ServerToClient) => ({ payload })
  ),
  Start: createAction(
    `${namespace}/Start`,
    (request: Shared.CaptureScreenshot.Request) => ({ payload: { request } })
  ),
  Cancel: createAction(
    `${namespace}/Cancel`,
    (requestId: Data.RequestId.RequestId) => ({ payload: { requestId } })
  ),
};

export type Action = InferActionUnion<typeof Action>;

//
//
//
// Reducer
//
//
//

const reducer = (state: State = initialState, action: AnyAction): State => {
  if (Action.ServerConnected.match(action)) {
    return { ...state, status: 'ServerConnected' };
  }

  if (Action.ServerDisconnected.match(action)) {
    return { ...state, status: 'ServerConnecting' };
  }

  return state;
};

//
//
//
//
//
//
//

const saga = function* ({ overrides }: { overrides?: Overrides }) {
  const socketChan = createSocketChan({ overrides });

  yield takeEvery(socketChan, function* (action) {
    yield put(action);
  });

  yield;
};

//
//
//
// Socket Events
//
//
//

export type Overrides = { serverBaseUrl: string };

const createSocketChan = ({ overrides }: { overrides?: Overrides }) => {
  const baseUrl = overrides?.serverBaseUrl
    ? overrides.serverBaseUrl
    : Shared.PRODUCTION_SERVER_BASE_URL;

  const socket: Socket<
    Shared.ServerToClientEvents,
    Shared.ClientToServerEvents
  > = socketClient(baseUrl);

  return eventChannel<Action>((emit) => {
    socket.on('connect', () => {
      emit(Action.ServerConnected());
    });

    socket.on('disconnect', () => {
      emit(Action.ServerDisconnected());
    });

    socket.on('connect_error', () => {
      emit(Action.ServerConnectionError());
    });

    return () => {
      socket.close();
    };
  });
};

//
//
//
// Main
//
//
//

export const create = ({ overrides }: { overrides?: Overrides }) => {
  const sagaMiddleware = createSagaMiddleware();

  const store = configureStore<State, Action>({
    preloadedState: initialState,
    reducer: reducer,
    middleware: [sagaMiddleware],
  });

  sagaMiddleware.run(saga, { overrides });

  const actions = bindActionCreators(
    {
      start: Action.Start,
      cancel: Action.Cancel,
    },
    store.dispatch
  );

  return {
    getState: store.getState,
    subscribe: store.subscribe,
    ...actions,
  };
};
