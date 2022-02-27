import apicache from "apicache";
import { Application, Request, Response } from "express";
import {
  castImageType,
  castTargetUrl,
  castTimeout,
  validateImageType,
  validateTargetUrl,
  validateTimeout,
} from "./screenshot-data";
import { getScreenshot } from "./screenshot-data-access";
import { GET_SCREEN_SHOT_ENDPOINT, IApiErrorBody } from "./server-data";

const cache = apicache.middleware;

const cacheSuccesses = cache(
  "1 hour",
  (_req: Request, res: Response) => res.statusCode === 200
);

export const useAPI = async (app: Application) => {
  app.get(GET_SCREEN_SHOT_ENDPOINT, cacheSuccesses, async (req, res) => {
    const { url, timeout, type } = req.query;

    const validationErrors = [
      ...validateTimeout(timeout, { name: "'timeout' query param" }),
      ...validateTargetUrl(url, { name: "'url' query param" }),
      ...validateImageType(type, { name: "'type' query param" }),
    ];

    if (validationErrors.length > 0) {
      const apiErrorBody: IApiErrorBody = validationErrors;

      res.status(400).json(apiErrorBody);
      return;
    }

    const { image, errors } = await getScreenshot({
      imageType: castImageType(type),
      timeout: castTimeout(timeout),
      targetUrl: castTargetUrl(url),
    });

    if (errors.length > 0) {
      const apiErrorBody: IApiErrorBody = errors;

      res.status(400).json(apiErrorBody).end();

      return;
    }

    if (!image?.data) {
      const apiErrorBody: IApiErrorBody = [
        {
          message: "Failed to get screenshot",
        },
      ];

      res.status(400).json(apiErrorBody).end();

      return;
    }

    res
      .writeHead(200, {
        "Content-Type": image.type,
        "Content-Length": image.data.length,
      })
      .end(image.data);
  });
};
