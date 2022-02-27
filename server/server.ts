import express, { Application } from "express";
import morgan from "morgan";
import path from "path";
import { useAPI } from "./server-api";
import { useSecurity } from "./server-security";

export const createServer = async () => {
  const app = express();

  app.use(morgan("dev"));

  app.use((req, _res, next) => {
    console.log(req.headers);
    next();
  });

  useSecurity(app);

  useAPI(app);

  useServeClientApp(app);

  return app;
};

const useServeClientApp = (app: Application) => {
  const CLIENT_BUILD_DIR_PATH = path.join(
    __dirname,
    "..",
    "..",
    "..",
    "client",
    "build"
  );

  app.use(express.static(CLIENT_BUILD_DIR_PATH));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(CLIENT_BUILD_DIR_PATH, "index.html"));
  });
};
