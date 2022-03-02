import { IImageType } from "../../shared/screenshot-data";

export type IGetScreenshotResult =
  | {
      type: "success";
      image: {
        type: IImageType;
        data: Buffer | string;
        updatedAtMs: number;
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
      image: {
        updatedAtMs: number;
      };
    }
  | {
      type: "error";
      errors: {
        message: string;
      }[];
    };
