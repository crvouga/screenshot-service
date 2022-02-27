import express, { Application, ErrorRequestHandler } from "express";
import morgan from "morgan";
import path from "path";
import { useAPI } from "./server-api";
import cors from "cors";

export const createServer = async () => {
  const app = express();

  app.use(morgan("dev"));

  app.use(cors());

  useAPI(app);

  useServeClientApp(app);

  const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    if (err) {
      res.status(500).send("Something broke!").end();
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
