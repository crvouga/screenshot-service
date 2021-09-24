import express from "express";
import morgan from "morgan";
import path from "path";
import { createAPIRouter } from "./create-api-router";
import { useSecurity } from "./use-security";

export const createServer = async () => {
  const app = express();

  app.use(morgan("tiny"));

  useSecurity(app);

  const apiRouter = await createAPIRouter();

  app.use("/api", apiRouter);

  app.use(express.static(path.join(__dirname + "../../../client/build")));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(__dirname + "../../../client/build/index.html"));
  });

  return app;
};
