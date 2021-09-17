import cors from "cors";
import { Application } from "express";

import env from "../dotenv";

export const getWhitelist = async () => {
  return env.URL_WHITELIST_CSV?.split(",").map((item) => item.trim()) ?? [];
};

const toHostname = (maybeUrl: string) => {
  try {
    return new URL(maybeUrl).hostname;
  } catch (_error) {
    return maybeUrl;
  }
};

export const isOnWhitelist = (whitelist: string[], item: string) => {
  return whitelist.some((whitelistedItem) => {
    return toHostname(whitelistedItem) === toHostname(item);
  });
};

export const useSecuritry = async (app: Application) => {
  app.use(cors());

  app.use(async (req, res, next) => {
    const whitelist = await getWhitelist();
    const originUrl = req.headers.origin;

    const log = {
      message: `checking if whitelist contains originUrl`,
      whitelist,
      originUrl,
    };

    console.log(log);

    if (!originUrl) {
      next();
      return;
    }

    if (isOnWhitelist(whitelist, originUrl)) {
      next();
      return;
    }

    res.status(400).json(log).end();
  });
};
