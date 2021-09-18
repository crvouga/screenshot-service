import express from "express";
import { useAPI } from "./api";
import { useSecuritry } from "./security";
import morgan from "morgan";

export const createServer = async () => {
  const app = express();

  app.use(morgan("tiny"));

  useSecuritry(app);

  useAPI(app);

  return app;
};
