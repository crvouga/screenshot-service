import apicache from "apicache";
import { Application } from "express";
import {
  castTargetUrl,
  castTimeout,
  createBrowser,
  getScreenshot,
  validateTargetUrl,
  validateTimeout,
} from "../screenshot";

export const SCREENSHOT_ENDPOINT = "/api/screenshot";

export const useAPI = async (app: Application) => {
  const browser = await createBrowser();

  app.get(
    SCREENSHOT_ENDPOINT,

    apicache.middleware("60 seconds"),

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
        browser,
        timeout: castTimeout(timeout),
        targetUrl: castTargetUrl(url),
      });

      console.log(
        `getScreenshot${JSON.stringify({
          timeout,
          targetUrl: url,
        })}) => ${JSON.stringify({ errors })}`
      );

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

      res
        .writeHead(200, {
          "Content-Type": "image/png",
          "Content-Length": image.length,
        })
        .end(image);
    }
  );
};
