import {
  toGetScreenshotEndpoint,
  IGetScreenshotQueryParams,
  IApiErrorBody,
} from "../shared/server-interface";

export const getScreenshot = async (
  params: IGetScreenshotQueryParams
): Promise<
  { type: "success"; src: string } | { type: "error"; errors: IApiErrorBody }
> => {
  const response = await fetch(toGetScreenshotEndpoint(params));

  if (response.ok) {
    const blob = await response.blob();

    const src = URL.createObjectURL(blob);

    return {
      type: "success",
      src,
    };
  }

  const errors: IApiErrorBody = await response.json();

  return {
    type: "error",
    errors,
  };
};
