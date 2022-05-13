export type IApiErrorBody = { message: string }[];

export const BASE_URL = 'https://crvouga-screenshot-service.herokuapp.com';

export const GET_SCREENSHOT_ENDPOINT = '/screenshot';

export const API_ENDPOINT = '/api';

export type IConfig = {
  baseUrl: string;
  signal?: AbortSignal;
};

export type IGetScreenshotQueryParams = {
  projectId: string;
  timeoutMs: string;
  imageType: string;
  targetUrl: string;
};

export const toGetScreenshotEndpoint = (
  params: IGetScreenshotQueryParams,
  config: IConfig
): string => {
  const queryParams = new URLSearchParams(params);

  const url = `${
    config.baseUrl
  }${API_ENDPOINT}${GET_SCREENSHOT_ENDPOINT}?${queryParams.toString()}`;

  return url;
};

export type IResult =
  | { type: 'success'; src: string }
  | { type: 'error'; errors: IApiErrorBody };

export const fetchScreenshot = async (
  params: IGetScreenshotQueryParams,
  config: IConfig
): Promise<IResult> => {
  const response = await fetch(toGetScreenshotEndpoint(params, config), {
    signal: config.signal,
  });

  if (response.ok) {
    const blob = await response.blob();

    const src = URL.createObjectURL(blob);

    return { type: 'success', src };
  }

  const errors: IApiErrorBody = await response.json();

  return { type: 'error', errors: errors };
};
