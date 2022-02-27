import { useMutation } from "react-query";

// COPYED FROM SERVER
type IApiErrorBody = { message: string }[];
//

type IData = { src: string };
type IVariables = {
  imageType: string;
  targetUrl: string;
  timeout?: number;
};
type IContext = unknown;

export const fetchScreenshot = async ({
  targetUrl,
  timeout = 0,
  imageType,
}: IVariables): Promise<IData> => {
  const url = `/api/screenshot?url=${targetUrl}&timeout=${timeout}&type=${imageType}`;

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
