import { IImageType } from "../../shared/screenshot-data";

export type IScreenshot = {
  type: IImageType;
  data: Buffer | string;
  updatedAtMs: number;
};
