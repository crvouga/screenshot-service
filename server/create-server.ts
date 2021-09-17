import express from "express";
import { useAPI } from "./api";
import { useSecuritry } from "./security";

export const createServer = async () => {
  const app = express();

  useSecuritry(app);

  useAPI(app);

  return app;
};
