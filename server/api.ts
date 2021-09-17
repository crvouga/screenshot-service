import { Application } from "express";
import {
  castTargetUrl,
  castTimeout,
  createGetScreenshot,
  validateTargetUrl,
  validateTimeout,
} from "../screenshot";
import { getWhitelist } from "./security";
import apicache from "apicache";

export const GET_SCREENSHOT = "/api/screenshot";

export const useAPI = async (app: Application) => {
  const getScreenshot = await createGetScreenshot();

  app.get(
    GET_SCREENSHOT,

    apicache.middleware("10 minutes"),

    async (req, res) => {
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
        whitelist: await getWhitelist(),
        timeout: castTimeout(timeout),
        targetUrl: castTargetUrl(url),
      });

      if (errors.length > 0) {
        res
          .status(400)
          .json({
            errors,
          })
          .end();

        console.error(errors);

        return;
      }

      if (!image) {
        const errors = [
          {
            message: "Failed to get screenshot",
          },
        ];
        res
          .status(400)
          .json({
            errors,
          })
          .end();

        console.error(errors);

        return;
      }

      console.log("SUCCESS", {
        "Content-Type": "image/png",
        "Content-Length": image.length,
      });

      res
        .writeHead(200, {
          "Content-Type": "image/png",
          "Content-Length": image.length,
        })
        .end(image);
    }
  );
};
