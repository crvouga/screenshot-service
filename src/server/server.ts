import cors from "cors";
import express, { ErrorRequestHandler } from "express";
import morgan from "morgan";
import { IApiErrorBody } from "../shared/server-interface";
import { useAPI } from "./server-api";

export const createServer = async () => {
  const app = express();

  app.use(morgan("dev"));

  app.use(cors());

  await useAPI(app);

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

  app.use(errorHandler);

  return app;
};
