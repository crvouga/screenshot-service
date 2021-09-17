import cors from "cors";
import { Application } from "express";

import env from "../dotenv";

const getWhitelist = async () => {
  return env.URL_WHITELIST_CSV?.split(", ") ?? [];
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
  app.use(
    cors({
      origin: "*",
    })
  );

  app.use(async (req, res, next) => {
    const whitelist = await getWhitelist();
    const originUrl = req.headers.origin;

    console.log({
      whitelist,
      originUrl,
    });

    if (!originUrl) {
      next();
      return;
    }

    if (isOnWhitelist(whitelist, originUrl)) {
      next();
      return;
    }

    res.status(400).json({
      errors: [
        {
          message: `request url is not on the url whitelist`,
          requestUrl: originUrl,
          whitelist,
        },
      ],
    });
  });
};
