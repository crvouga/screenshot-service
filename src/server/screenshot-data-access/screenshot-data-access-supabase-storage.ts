import { IImageType } from "../../shared/screenshot-data";
import { supabaseClient } from "../supabase";
import {
  IGetScreenshotResult,
  IPutScreenshotResult,
} from "./screenshot-data-access-interface";

const BUCKET_NAME = "screenshots";

export const put = async (
  {
    filename,
  }: {
    filename: string;
  },
  screenshot: Buffer | string
): Promise<IPutScreenshotResult> => {
  try {
    const uploadResponse = await supabaseClient.storage
      .from(BUCKET_NAME)
      .upload(filename, screenshot, { upsert: true });

    if (uploadResponse.error) {
      return {
        type: "error",
        errors: [
          {
            message: uploadResponse.error.message,
          },
        ],
      };
    }

    return {
      type: "success",
      image: {
        createdAt: Date.now(),
      },
    };
  } catch (error) {
    const message = String(
      (error as any)?.toString?.() ??
        "supabase threw an error while uploading file"
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
    const downloadResponse = await supabaseClient.storage
      .from(BUCKET_NAME)
      .download(filename);

    if (downloadResponse.error) {
      return {
        type: "error",
        errors: [
          {
            message: `Supbase couldn't download screenshot. ${downloadResponse.error.message}`,
          },
        ],
      };
    }

    if (!downloadResponse.data) {
      return {
        type: "error",
        errors: [
          {
            message:
              "supabase did not return any data when downloading screenshot",
          },
        ],
      };
    }

    const blob = downloadResponse.data;

    const arrayBuffer = await blob.arrayBuffer();

    const buffer = Buffer.from(arrayBuffer);

    return {
      type: "success",
      image: {
        type: imageType,
        data: buffer,
        createdAt: Date.now(),
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
