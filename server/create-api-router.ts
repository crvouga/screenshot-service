import apicache from "apicache";
import { Request, Response, Router } from "express";
import {
  castTargetUrl,
  castTimeout,
  createBrowser,
  getScreenshot,
  validateTargetUrl,
  validateTimeout,
} from "../screenshot";
import { castImageType, validateImageType } from "../screenshot/imageType";

const cache = apicache.middleware;

const onlyStatus200 = (_req: Request, res: Response) => res.statusCode === 200;

const cacheSuccesses = cache("12 hours", onlyStatus200);

export const createAPIRouter = async () => {
  const browser = await createBrowser();

  const router = Router();

  router.get("/screenshot", cacheSuccesses, async (req, res) => {
    const { url, timeout, type } = req.query;

    const validationErrors = [
      ...validateTimeout(timeout, { name: "'timeout' query param" }),
      ...validateTargetUrl(url, { name: "'url' query param" }),
      ...validateImageType(type, { name: "'type' query param" }),
    ];

    if (validationErrors.length > 0) {
      res.status(400).json({
        errors: validationErrors,
      });
      return;
    }

    const { image, errors } = await getScreenshot({
      imageType: castImageType(type),
      browser,
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

    if (!image?.data) {
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
        "Content-Type": image.type,
        "Content-Length": image.data.length,
      })
      .end(image.data);
  });

  return router;
};
