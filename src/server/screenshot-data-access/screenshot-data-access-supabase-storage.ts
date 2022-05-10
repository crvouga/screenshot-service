import { IImageType } from "../../shared/screenshot-data";
import { supabaseClient } from "../supabase";
import { definitions } from "../../shared/supabase-types";
import { IScreenshot } from "./types";
/**
 *
 *
 *
 *
 *
 *
 */

type IGetResult =
  | { type: "success"; screenshot: IScreenshot }
  | { type: "error"; errors: [{ message: string }] };

type IPutResult =
  | { type: "success" }
  | { type: "error"; errors: [{ message: string }] };

/**
 *
 *
 *
 *
 */

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
): Promise<IPutResult> => {
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

  const getResult = await getElseInsertRow({ filename });

  if (getResult.type === "error") {
    return { type: "error", errors: [{ message: getResult.error }] };
  }

  const updateResult = await updateRow({
    filename: getResult.filename,
    updatedAtMs: Date.now(),
  });

  if (updateResult.type === "error") {
    return { type: "error", errors: [{ message: updateResult.error }] };
  }

  return {
    type: "success",
  };
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
}): Promise<IGetResult> => {
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

  const getResult = await getElseInsertRow({ filename });

  if (getResult.type === "error") {
    return { type: "error", errors: [{ message: getResult.error }] };
  }

  return {
    type: "success",
    screenshot: {
      type: imageType,
      data: buffer,
      updatedAtMs: getResult.updatedAtMs,
    },
  };
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

const insertRow = async ({
  filename,
}: {
  filename: string;
}): Promise<{ type: "success" } | { type: "error"; error: string }> => {
  const result = await supabaseClient
    .from<definitions["screenshots"]>("screenshots")
    .insert({
      filename,
    });

  if (result.error) {
    return { type: "error", error: String(result.error) };
  }
  return { type: "success" };
};

const updateRow = async ({
  filename,
  updatedAtMs,
}: {
  filename: string;
  updatedAtMs: number;
}): Promise<{ type: "success" } | { type: "error"; error: string }> => {
  const result = await supabaseClient
    .from<definitions["screenshots"]>("screenshots")
    .update({
      updated_at: new Date(updatedAtMs).toISOString(),
    })
    .eq("filename", filename);

  if (result.error) {
    return { type: "error", error: String(result.error) };
  }
  return { type: "success" };
};

const getElseInsertRow = async ({
  filename,
}: {
  filename: string;
}): Promise<
  | {
      type: "success";
      id: string;
      filename: string;
      createdAtMs: number;
      updatedAtMs: number;
    }
  | { type: "error"; error: string }
> => {
  const got = await getRow({ filename });

  if (got) {
    return { type: "success", ...got };
  }

  await insertRow({ filename });

  const gotAfterCreated = await getRow({ filename });

  if (gotAfterCreated) {
    return { type: "success", ...gotAfterCreated };
  }

  return {
    type: "error",
    error: `Supabase is not working. Gettting a screenshot record after just creating one does not return any data.`,
  };
};
