import fs from "fs";
import { IImageType } from "../../shared/screenshot-data";
import {
  IGetScreenshotResult,
  IPutScreenshotResult,
} from "./screenshot-data-access-interface";

export const put = async (
  {
    filename,
  }: {
    filename: string;
  },
  screenshot: Buffer | string
): Promise<IPutScreenshotResult> => {
  try {
    fs.writeFileSync(filename, screenshot);
    return {
      type: "success",
      image: {
        createdAt: Date.now(),
      },
    };
  } catch (error) {
    const message = String(
      (error as any)?.toString?.() ?? "failed to write screenshot file"
    );

    return {
      type: "error",
      errors: [
        {
          message,
        },
      ],
    };
  }
};
export const get = async ({
  filename,
  imageType,
}: {
  filename: string;
  imageType: IImageType;
}): Promise<IGetScreenshotResult> => {
  try {
    const file = fs.readFileSync(filename);
    return {
      type: "success",
      image: {
        type: imageType,
        data: file,
        createdAt: Date.now(),
      },
    };
  } catch (error) {
    const message = String(
      (error as any)?.toString?.() ?? "failed to read screenshot file"
    );

    return {
      type: "error",
      errors: [
        {
          message,
        },
      ],
    };
  }
};
