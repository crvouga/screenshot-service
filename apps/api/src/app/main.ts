import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import { mainSaga } from './main-saga';

const sagaMiddleware = createSagaMiddleware();

const noopReducer = <TState>(state: TState): TState => {
  return state;
};

export const store = configureStore({
  reducer: noopReducer,
  middleware: [sagaMiddleware],
});

export const main = ({ port }: { port: number }) => {
  sagaMiddleware.run(mainSaga, { port });
};
