import { IImageType } from "../../shared/screenshot-data";
import { firebaseStorage } from "../firebase";
import {
  IGetScreenshotResult,
  IPutScreenshotResult,
} from "./screenshot-data-access-interface";

const screenshotBucket = firebaseStorage.bucket("screenshots");

export const put = async (
  {
    filename,
  }: {
    filename: string;
  },
  screenshot: Blob | Buffer | string
): Promise<IPutScreenshotResult> => {
  try {
    await screenshotBucket.file(filename).save(screenshot.toString());

    return {
      type: "success",
    };
  } catch (error) {
    const message = String(
      (error as any)?.toString?.() ?? "failed to upload screenshot to firebase"
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
    const fileRef = screenshotBucket.file(filename);

    const response = await fileRef.download();

    const buffer = response[0];

    return {
      type: "success",
      image: {
        type: imageType,
        data: buffer,
      },
    };
  } catch (error) {
    const message = String(
      (error as any)?.toString?.() ??
        "failed to download screenshot file from firebase"
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
