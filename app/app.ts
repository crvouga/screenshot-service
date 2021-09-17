import cors from "cors";
import express from "express";
import { createGetScreenshot } from "./screenshot";
import { castTargetUrl, validateTargetUrl } from "./target-url";
import { castTimeout, validateTimeout } from "./timeout";
import { getWhitelist, isOnWhitelist } from "./whitelist";

export const createApp = async () => {
  const app = express();

  app.use(
    cors({
      origin: async (origin, callback) => {
        const whitelist = await getWhitelist();

        console.log(`checking if ${origin} is in ${whitelist.join(", ")}`);

        if (!origin) {
          callback(null);
          return;
        }

        if (isOnWhitelist(whitelist, origin)) {
          callback(null);
          return;
        }

        callback(new Error(`Origin ${origin} is not on the whitelist`));
      },
    })
  );

  const getScreenshot = await createGetScreenshot();

  app.get("/api/screenshot", async (req, res) => {
    const { url, timeout } = req.query;

    const validationErrors = [
      ...validateTimeout(timeout, { name: "'timeout' query param" }),
      ...validateTargetUrl(url, { name: "'url' query param" }),
    ];

    if (validationErrors.length > 0) {
      res.status(400).json({
        errors: validationErrors,
      });
      return;
    }

    const { image, errors } = await getScreenshot({
      timeout: castTimeout(timeout),
      targetUrl: castTargetUrl(url),
    });

    if (errors.length > 0) {
      res.status(400).json({
        errors,
      });
      return;
    }

    if (!image) {
      res.status(400).json({
        errors: [
          {
            message: "Something went wrong",
          },
        ],
      });
      return;
    }

    res
      .writeHead(200, {
        "Content-Type": "image/png",
        "Content-Length": image.length,
      })
      .end(image);
  });

  return app;
};
