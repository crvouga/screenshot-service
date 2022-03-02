import { IImageType } from "../../shared/screenshot-data";
import { supabaseClient } from "../supabase";
import { definitions } from "../supabase-types";
import {
  IGetScreenshotResult,
  IPutScreenshotResult,
} from "./screenshot-data-access-interface";

const BUCKET_NAME = "screenshots";

/**
 *
 *
 *
 *
 *
 *
 *
 */

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

    const screenshotRow = await getElseCreateScreenshotRow({ filename });

    return {
      type: "success",
      image: {
        createdAt: screenshotRow.createdAt,
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

/**
 *
 *
 *
 *
 *
 *
 *
 */

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

    const screenshotRow = await getElseCreateScreenshotRow({ filename });

    return {
      type: "success",
      image: {
        type: imageType,
        data: buffer,
        createdAt: screenshotRow.createdAt,
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

/**
 *
 *
 *
 *
 *
 *
 *
 */

const getScreenshotRow = async ({
  filename,
}: {
  filename: string;
}): Promise<{ filename: string; createdAt: number } | null> => {
  const got = await supabaseClient
    .from<definitions["screenshots"]>("screenshots")
    .select("*")
    .eq("filename", filename)
    .single();

  if (got.data) {
    return {
      filename: got.data.filename,
      createdAt: new Date(got.data.created_at).getTime(),
    };
  }

  return null;
};

const insertScreenshotRow = async ({
  filename,
}: {
  filename: string;
}): Promise<void> => {
  await supabaseClient.from<definitions["screenshots"]>("screenshots").insert({
    filename,
  });
};

const getElseCreateScreenshotRow = async ({
  filename,
}: {
  filename: string;
}): Promise<{ filename: string; createdAt: number }> => {
  const got = await getScreenshotRow({ filename });

  if (got) {
    return got;
  }

  await insertScreenshotRow({ filename });

  const gotAfterCreated = await getScreenshotRow({ filename });

  if (gotAfterCreated) {
    return gotAfterCreated;
  }

  throw new Error(
    `Supabase is not working. Gettting a screenshot record after just creating one does not return any data.`
  );
};
