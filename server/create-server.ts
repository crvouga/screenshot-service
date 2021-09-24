import express, { Application } from "express";
import morgan from "morgan";
import path from "path";
import { createAPIRouter } from "./create-api-router";
import { useSecurity } from "./use-security";

const useAPIEndpoints = async (app: Application) => {
  const apiRputer = await createAPIRouter();

  app.use("/api", apiRputer);
};

const useClientEndpoints = (app: Application) => {
  app.use(express.static(path.join(__dirname + "../../../client/build")));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(__dirname + "../../../client/build/index.html"));
  });
};

const useLogger = (app: Application) => {
  app.use(morgan("tiny"));
};

export const createServer = async () => {
  const app = express();

  useLogger(app);

  useSecurity(app);

  await useAPIEndpoints(app);

  useClientEndpoints(app);

  return app;
};
