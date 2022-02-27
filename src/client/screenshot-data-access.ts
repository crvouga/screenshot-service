import { useMutation } from "react-query";
import {
  GET_SCREENSHOT_ENDPOINT,
  API_ENDPOINT,
  IApiErrorBody,
  IGetScreenshotQueryParams,
} from "../shared/server-interface";

type IData = { src: string };
type IVariables = IGetScreenshotQueryParams;
type IContext = unknown;

export const fetchScreenshot = async (
  params: IGetScreenshotQueryParams
): Promise<IData> => {
  const queryParams = new URLSearchParams(params);

  const url = `${API_ENDPOINT}${GET_SCREENSHOT_ENDPOINT}?${queryParams.toString()}`;

  const response = await fetch(url);

  if (response.ok) {
    const blob = await response.blob();

    const src = URL.createObjectURL(blob);

    return {
      src,
    };
  }

  const errors: IApiErrorBody = await response.json();

  throw errors;
};

export const useFetchScreenshotMutation = () => {
  return useMutation<IData, IApiErrorBody, IVariables, IContext>(
    fetchScreenshot
  );
};
