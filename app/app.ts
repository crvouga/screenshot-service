import express from "express";
import cors from "cors";
import { createGetScreenshot } from "./screenshot";
import { castTargetUrl, validateTargetUrl } from "./target-url";
import { castTimeout, validateTimeout } from "./timeout";

export const createApp = async () => {
  const app = express();

  app.use(
    cors({
      origin: true,
    })
  );

  const getScreenshot = await createGetScreenshot();

  app.get("/screenshot", async (req, res) => {
    const { targetUrl, timeout } = req.query;

    const validationErrors = [
      ...validateTimeout(timeout, { name: "'timeout' query param" }),
      ...validateTargetUrl(targetUrl, { name: "'targetUrl' query param" }),
    ];

    if (validationErrors.length > 0) {
      res.status(400).json({ errors: validationErrors });
      return;
    }

    const { image, errors } = await getScreenshot({
      timeout: castTimeout(timeout),
      targetUrl: castTargetUrl(targetUrl),
    });

    if (errors.length > 0) {
      res.status(400).json({ errors });
      return;
    }

    if (!image) {
      res.status(400).json({ errors: [{ message: "Something went wrong" }] });
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
