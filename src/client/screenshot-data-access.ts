import { useMutation } from "react-query";
import {
  IApiErrorBody,
  IGetScreenshotQueryParams,
  toGetScreenshotEndpoint,
} from "../shared/server-interface";

type IData = { src: string };
type IVariables = IGetScreenshotQueryParams;
type IContext = unknown;

export const fetchScreenshot = async (
  params: IGetScreenshotQueryParams
): Promise<IData> => {
  const response = await fetch(toGetScreenshotEndpoint(params));

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
