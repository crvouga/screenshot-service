import express, { Application } from "express";
import path from "path";

export const useClientEndpoints = async (app: Application) => {
  app.use(express.static(path.join(__dirname + "../../../client/build")));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(__dirname + "../../../client/build/index.html"));
  });
};
