import { AnyAction, configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import { mainSaga } from './main-saga';
import loggerMiddleware from 'redux-logger';
import * as Server from './modules/server';

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
  sagaMiddleware.run(mainSaga, { port });
};
