import { AnyAction, createAction } from '@reduxjs/toolkit';
import { Socket } from '@screenshot-service/screenshot-service';
import { eventChannel } from 'redux-saga';
import { fork, put, takeEvery } from 'redux-saga/effects';
import socket from 'socket.io';
import { take } from 'typed-redux-saga';
import * as CaptureScreenshot from './capture-screenshot-request';
import { InferActionMap, InferActionUnion } from './utils';
import * as WebBrowser from './web-browser';
import { IDataAccess } from '@screenshot-service/shared';

type State = null;

export const initialState: State = null;

//
//
//
// Action
//
//
//

export const Action = {
  ClientConnected: createAction(`ClientConnected`, (clientId: string) => ({
    payload: { clientId },
  })),

  ClientDisconnecting: createAction(
    `ClientDisconnecting`,
    (clientId: string) => ({ payload: { clientId } })
  ),

  ClientDisconnected: createAction(
    `ClientDisconnected`,
    (clientId: string) => ({ payload: { clientId } })
  ),

  SocketError: createAction(`SocketError`, (error: Error) => ({
    payload: { error },
  })),
};

export type Action = InferActionUnion<typeof Action>;
export type ActionMap = InferActionMap<typeof Action>;

export const isAction = (action: AnyAction): action is Action => {
  return Object.values(Action).some((actionCreator) =>
    actionCreator.match(action)
  );
};

//
//
//
// Saga
//
//
//

export const saga = function* ({
  webBrowser,
  socketServer,
  dataAccess,
}: {
  webBrowser: WebBrowser.WebBrowser;
  socketServer: SocketServer;
  dataAccess: IDataAccess;
}) {
  console.log('Starting main saga');
  yield takeEvery('*', function* (action) {
    console.log(JSON.stringify(action, null, 2));
    yield;
  });

  yield fork(socketFlow, { socketServer });
  yield fork(clientFlow, { webBrowser, socketServer, dataAccess });
  console.log('Main saga initialized');
};

const clientFlow = function* ({
  webBrowser,
  socketServer,
  dataAccess,
}: {
  webBrowser: WebBrowser.WebBrowser;
  socketServer: SocketServer;
  dataAccess: IDataAccess;
}) {
  console.log('Starting client flow');
  yield takeEvery(Action.ClientConnected, function* (action) {
    const clientId = action.payload.clientId;
    console.log(`Client connected: ${clientId}`);

    yield fork(CaptureScreenshot.saga, {
      clientId,
      webBrowser,
      dataAccess,
    });
    console.log(`Started CaptureScreenshot saga for client: ${clientId}`);

    yield takeEvery('*', function* (action) {
      if (
        Socket.isServerToClientAction(action) &&
        action.payload.clientId === clientId
      ) {
        console.log(`Emitting ServerToClient action to client: ${clientId}`);
        socketServer.to(clientId).emit('ServerToClient', action);
        yield;
      }
    });
  });
};

export const takeClientDisconnected = function* ({
  clientId,
}: {
  clientId: string;
}) {
  console.log(`Waiting for client disconnect: ${clientId}`);
  while (true) {
    const action: ActionMap['ClientDisconnected'] = yield take(
      Action.ClientDisconnected
    );

    if (action.payload.clientId === clientId) {
      console.log(`Client disconnected: ${clientId}`);
      return action;
    }
  }
};

//
//
//
// Socket
//
//
//

const socketFlow = function* ({
  socketServer,
}: {
  socketServer: SocketServer;
}) {
  console.log('Starting socket flow');
  const socketChan = makeSocketChan(socketServer);
  console.log('Socket channel created');

  yield takeEvery(socketChan, function* (action) {
    console.log(`Received action from socket channel: ${action.type}`);
    yield put(action);
  });
};

const makeSocketChan = (socketServer: SocketServer) =>
  eventChannel<AnyAction>((emit) => {
    console.log('Setting up socket event channel');
    socketServer.on('connection', (socket) => {
      console.log(`New socket connection: ${socket.id}`);
      emit(Action.ClientConnected(socket.id));

      socket.on('disconnecting', () => {
        console.log(`Socket disconnecting: ${socket.id}`);
        emit(Action.ClientDisconnecting(socket.id));
      });

      socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
        emit(Action.ClientDisconnected(socket.id));
      });

      socket.on('error', (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
        emit(Action.SocketError(error));
      });

      socket.on('ClientToServer', (action) => {
        console.log(
          `Received ClientToServer action from ${socket.id}: ${action.type}`
        );
        return emit(action);
      });
    });

    return () => {
      console.log('Socket channel closed');
    };
  });

export type SocketServer = socket.Server<
  Socket.ClientToServerEvents,
  Socket.ServerToClientEvents
>;
