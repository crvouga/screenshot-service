import { Application } from "express";
import morgan from "morgan";

export const useLogger = async (app: Application) => {
  app.use(morgan("tiny"));
};
