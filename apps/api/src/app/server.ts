import { IApiErrorBody } from '@crvouga/screenshot-service';
import cors from 'cors';
import express, { ErrorRequestHandler, Router } from 'express';
import morgan from 'morgan';
import { useApi } from './server-api';
import { useStaticFiles } from './server-client-files';

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
