import { IImageType } from '@screenshot-service/shared';

export type IScreenshot = {
  type: IImageType;
  data: Buffer | string;
  updatedAtMs: number;
};
