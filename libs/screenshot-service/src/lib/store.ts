import { AnyAction, configureStore, createAction } from '@reduxjs/toolkit';
import createSagaMiddleware, { eventChannel } from 'redux-saga';
import { put, takeEvery } from 'redux-saga/effects';
import { call } from 'typed-redux-saga';
import * as CaptureScreenshotRequest from './capture-screenshot-request';
import * as Socket from './socket';
import { InferActionUnion } from './utils';

//
//
//
// State
//
//
//

export type State =
  | {
      type: 'Connecting';
    }
  | {
      type: 'Connected';
      clientId: string;
      captureScreenshotRequest: CaptureScreenshotRequest.State;
    };

export const initialState: State = { type: 'Connecting' };

//
//
//
// Action
//
//
//

export const Action = {
  Disconnected: createAction(`Socket/Disconnected`),
  ConnectError: createAction(`Socket/ConnectError`),
  Connected: createAction(`Socket/Connected`, (clientId: string) => ({
    payload: { clientId },
  })),
};

export type Action = InferActionUnion<typeof Action>;

//
//
//
// Reducer
//
//
//

export const reducer = (
  state: State = initialState,
  action: AnyAction
): State => {
  switch (state.type) {
    case 'Connected':
      if (Action.Disconnected.match(action)) {
        return { type: 'Connecting' };
      }

      return {
        ...state,
        captureScreenshotRequest: CaptureScreenshotRequest.reducer(
          state.captureScreenshotRequest,
          action
        ),
      };

    case 'Connecting':
      if (Action.Connected.match(action)) {
        return {
          type: 'Connected',
          clientId: action.payload.clientId,
          captureScreenshotRequest: CaptureScreenshotRequest.initialState,
        };
      }

      return state;
  }
};

//
//
//
// Saga
//
//
//

export const saga = function* ({
  socketConfig,
}: {
  socketConfig?: Socket.Config;
}) {
  const socket = yield* call(Socket.make, socketConfig);
  const socketChan = yield* call(makeSocketChan, socket);

  yield takeEvery(socketChan, function* (action) {
    yield put(action);
  });

  yield takeEvery('*', function* (action) {
    if (Socket.isClientToServerAction(action)) {
      socket.emit('ClientToServer', action);
      yield;
    }
  });
};

const makeSocketChan = (socket: Socket.Instance) => {
  return eventChannel<AnyAction>((emit) => {
    socket.on('connect', () => {
      emit(Action.Connected(socket.id ?? ''));
    });

    socket.on('disconnect', () => {
      emit(Action.Disconnected());
    });

    socket.on('connect_error', () => {
      emit(Action.ConnectError());
    });

    socket.on('ServerToClient', (action) => {
      emit(action);
    });

    return () => {
      socket.close();
    };
  });
};

//
//
//
// Store
//
//
//

export const makeStore = ({
  socketConfig,
}: {
  socketConfig?: Socket.Config;
}) => {
  const sagaMiddleware = createSagaMiddleware();

  const store = configureStore({
    reducer: reducer,
    middleware: [sagaMiddleware],
  });

  sagaMiddleware.run(saga, { socketConfig });

  return store;
};
