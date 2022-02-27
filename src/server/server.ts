import express, { Application, ErrorRequestHandler } from "express";
import morgan from "morgan";
import path from "path";
import { useAPI } from "./server-api";
import cors from "cors";
import { IApiErrorBody } from "../shared/server-interface";

export const createServer = async () => {
  const app = express();

  app.use(morgan("dev"));

  app.use(cors());

  useAPI(app);

  useServeClientApp(app);

  const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
    if (err) {
      const errorString = String(
        err?.toString?.() ?? "And I don't know why >:{"
      );

      const apiErrorBody: IApiErrorBody = [
        {
          message: `Something broke! ${errorString}`,
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

const useServeClientApp = (app: Application) => {
  const JUMP_OUT_OF_SERVER_DIR = "..";
  const JUMP_OUT_OF_SRC_DIR = "..";
  const JUMP_OUT_OF_SERVER_BUILD_DIR = "..";

  const CLIENT_BUILD_PATH = path.join(
    __dirname,
    JUMP_OUT_OF_SERVER_DIR,
    JUMP_OUT_OF_SRC_DIR,
    JUMP_OUT_OF_SERVER_BUILD_DIR,
    "build"
  );

  app.use(express.static(CLIENT_BUILD_PATH));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(CLIENT_BUILD_PATH, "index.html"));
  });
};
