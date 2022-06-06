import { AnyAction, createAction } from '@reduxjs/toolkit';
import { eventChannel } from 'redux-saga';
import { fork, put, takeEvery } from 'redux-saga/effects';
import * as Socket from './socket';
import { InferActionUnion } from './utils';

//
//
//
// State
//
//
//

export type State = { type: 'Connecting' } | { type: 'Connected' };

export const initialState: State = { type: 'Connecting' };

//
//
//
// Action
//
//
//

export const Action = {
  Connected: createAction(`socket/Connected`),
  Disconnected: createAction(`socket/Disconnected`),
  ConnectError: createAction(`socket/ConnectError`),
};

export type Action = InferActionUnion<typeof Action>;

//
//
//
// Reducer
//
//
//

export const reducer = (state: State, action: AnyAction): State => {
  if (Action.Connected.match(action)) {
    return { type: 'Connected' };
  }

  if (Action.Disconnected.match(action)) {
    return { type: 'Connecting' };
  }

  return state;
};

//
//
//
// Saga
//
//
//

export const saga = function* (socket: Socket.Instance) {
  yield fork(serverToClientFlow, socket);
  yield fork(clientToServerFlow, socket);
};

const clientToServerFlow = function* (socket: Socket.Instance) {
  yield takeEvery('*', function* (action) {
    if (Socket.isClientToServerAction(action)) {
      socket.emit('ClientToServer', action);
      yield;
    }
  });
};

const serverToClientFlow = function* (socket: Socket.Instance) {
  const socketChan = eventChannel<AnyAction>((emit) => {
    socket.on('connect', () => {
      emit(Action.Connected());
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

  yield takeEvery(socketChan, function* (action) {
    yield put(action);
  });
};
