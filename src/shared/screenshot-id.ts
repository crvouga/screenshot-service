import { IImageType, ITargetUrl, ITimeoutMs } from "./screenshot-data";
import { encode as toBase64 } from "js-base64";

const _seperator = " ";

export const encode = ({
  imageType,
  timeoutMs,
  targetUrl,
}: {
  imageType: IImageType;
  timeoutMs: ITimeoutMs;
  targetUrl: ITargetUrl;
}): string => {
  return [
    "screenshot",
    toBase64([targetUrl, timeoutMs, imageType].join(_seperator)),
  ].join("-");
};
