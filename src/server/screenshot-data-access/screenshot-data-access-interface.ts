import { IImageType } from "../../shared/screenshot-data";

export type IGetScreenshotResult =
  | {
      type: "success";
      image: {
        type: IImageType;
        data: Buffer | string;
      };
    }
  | {
      type: "error";
      errors: {
        message: string;
      }[];
    };

export type IPutScreenshotResult =
  | {
      type: "success";
    }
  | {
      type: "error";
      errors: {
        message: string;
      }[];
    };
