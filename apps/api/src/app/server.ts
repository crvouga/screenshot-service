import cors from 'cors';
import express, { ErrorRequestHandler, Router } from 'express';
import morgan from 'morgan';
import { IApiErrorBody } from '@screenshot-service/api-interfaces';
import { useApi } from './server-api';
import path from 'path';

export const createServer = async () => {
  const app = express();

  app.use(morgan('dev'));

  app.use(cors());

  await useApi(app);

  useStaticFiles(app);

  useErrorHandler(app);

  return app;
};

/**
 *
 *
 *
 * static files
 *
 *
 *
 */

const clientBuildPath = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'dist',
  'apps',
  'client'
);

const useStaticFiles = (router: Router) => {
  router.use(express.static(clientBuildPath));

  router.get('*', (_req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
};

/**
 *
 *
 *
 * error handler
 *
 *
 *
 */

const useErrorHandler = (router: Router) => {
  const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
    if (err) {
      const errorString = String(err?.toString?.() ?? "I don't know why >:{");

      const apiErrorBody: IApiErrorBody = [
        {
          message: `Something wen wrong. ${errorString}`,
        },
      ];

      res.status(500).json(apiErrorBody).end();
      return;
    }

    next();
  };

  router.use(errorHandler);
};
