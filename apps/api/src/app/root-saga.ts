import { createAction } from '@reduxjs/toolkit';
import {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from '@crvouga/screenshot-service';
import express from 'express';
import http from 'http';
import socket from 'socket.io';
import * as WebBrowser from './data-access/web-browser';

import { eventChannel } from 'redux-saga';

export const Msgs = {
  ServerListening: createAction('ServerListening'),
};

export function* rootSaga({ port }: { port: number }) {
  // const webBrowser = WebBrowser.create;
  yield;

  console.log('GELLO');
}

//
//
//
// Server
//
//
//

const app = express();
const server = http.createServer(app);
const io = new socket.Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const createServerChan = ({ port }: { port: number }) =>
  eventChannel((emit) => {
    emit();
    server.listen(port, () => {
      console.log(`Server is listening on http://localhost:${port}/`);
    });
  });
