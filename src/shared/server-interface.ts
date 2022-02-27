export type IApiErrorBody = { message: string }[];

export const GET_SCREENSHOT_ENDPOINT = "/screenshot";

export const API_ENDPOINT = "/api";

export type IGetScreenshotQueryParams = {
  timeoutMs?: string;
  imageType?: string;
  targetUrl?: string;
};
