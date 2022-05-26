import createSagaMiddleware from 'redux-saga';
import { configureStore } from '@reduxjs/toolkit';
import { rootSaga } from './root-saga';

const sagaMiddleware = createSagaMiddleware();

export const store = configureStore({
  reducer: {},
  middleware: [sagaMiddleware],
});

export const main = ({ port }: { port: number }) => {
  sagaMiddleware.run(rootSaga, { port });
};
