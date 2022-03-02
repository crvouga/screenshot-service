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

    const row = await getElseInsertRow({ filename });

    await updateRow({
      filename: row.filename,
      updatedAtMs: Date.now(),
    });

    return {
      type: "success",
      image: {
        updatedAtMs: row.updatedAtMs,
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

    const row = await getElseInsertRow({ filename });

    return {
      type: "success",
      image: {
        type: imageType,
        data: buffer,
        updatedAtMs: row.updatedAtMs,
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

const getRow = async ({
  filename,
}: {
  filename: string;
}): Promise<{
  id: string;
  filename: string;
  createdAtMs: number;
  updatedAtMs: number;
} | null> => {
  const got = await supabaseClient
    .from<definitions["screenshots"]>("screenshots")
    .select("*")
    .eq("filename", filename)
    .single();

  if (got.data) {
    return {
      id: got.data.id,
      filename: got.data.filename,
      createdAtMs: new Date(got.data.created_at).getTime(),
      updatedAtMs: new Date(got.data.created_at).getTime(),
    };
  }

  return null;
};

const insertRow = async ({ filename }: { filename: string }): Promise<void> => {
  const result = await supabaseClient
    .from<definitions["screenshots"]>("screenshots")
    .insert({
      filename,
    });

  if (result.error) {
    console.error("insert row error", result.error);
  }
};

const updateRow = async ({
  filename,
  updatedAtMs,
}: {
  filename: string;
  updatedAtMs: number;
}): Promise<void> => {
  console.log("UPDATE ROW ", {
    updated_at: new Date(updatedAtMs).toISOString(),
    updatedAtMs,
  });
  const result = await supabaseClient
    .from<definitions["screenshots"]>("screenshots")
    .update({
      updated_at: new Date(updatedAtMs).toISOString(),
    })
    .eq("filename", filename);

  if (result.error) {
    console.error("update row error", result.error);
  }
};

const getElseInsertRow = async ({
  filename,
}: {
  filename: string;
}): Promise<{
  id: string;
  filename: string;
  createdAtMs: number;
  updatedAtMs: number;
}> => {
  const got = await getRow({ filename });

  if (got) {
    return got;
  }

  await insertRow({ filename });

  const gotAfterCreated = await getRow({ filename });

  if (gotAfterCreated) {
    return gotAfterCreated;
  }

  throw new Error(
    `Supabase is not working. Gettting a screenshot record after just creating one does not return any data.`
  );
};
