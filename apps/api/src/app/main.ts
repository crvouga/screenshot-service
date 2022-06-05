import { AnyAction, configureStore } from '@reduxjs/toolkit';
import loggerMiddleware from 'redux-logger';
import createSagaMiddleware from 'redux-saga';
import { fork } from 'redux-saga/effects';
import * as Server from './server';

//
//
//
// State
//
//
//

type State = Server.State;

const initialState: State = Server.initialState;

//
//
//
// Action
//
//
//

export const Action = Server.Action;

type Action = Server.Action;

//
//
//
// Reducer
//
//
//

const reducer = (state: State = initialState, action: AnyAction): State => {
  return Server.reducer(state, action);
};

//
//
//
// Saga
//
//
//

const saga = function* ({ port }: { port: number }) {
  yield fork(Server.saga, { port });
};

//
//
//
// Main
//
//
//

const sagaMiddleware = createSagaMiddleware();

export const store = configureStore({
  reducer: reducer,
  middleware: [loggerMiddleware, sagaMiddleware],
});

export const main = ({ port }: { port: number }) => {
  sagaMiddleware.run(saga, { port });
};
