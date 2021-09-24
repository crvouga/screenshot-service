import express from "express";
import { useAPIEndpoints } from "./use-api-endpoints";
import { useClientEndpoints } from "./use-client-endpoints";
import { useLogger } from "./use-logger";
import { useSecuritry } from "./use-security";

export const createServer = async () => {
  const app = express();

  useLogger(app);

  useSecuritry(app);

  useAPIEndpoints(app);

  useClientEndpoints(app);

  return app;
};
