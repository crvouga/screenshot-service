export interface Message {
  message: string;
}

export type IApiErrorBody = { message: string }[];

export const GET_SCREENSHOT_ENDPOINT = '/screenshot';

export const API_ENDPOINT = '/api';

export type IGetScreenshotQueryParams = {
  timeoutMs?: string;
  imageType?: string;
  targetUrl?: string;
  maxAgeMs?: string;
};

export const toGetScreenshotEndpoint = (params: IGetScreenshotQueryParams) => {
  const queryParams = new URLSearchParams(params);

  const url = `${API_ENDPOINT}${GET_SCREENSHOT_ENDPOINT}?${queryParams.toString()}`;

  return url;
};
