import { IImageType } from '@screenshot-service/api-interfaces';

export type IScreenshot = {
  type: IImageType;
  data: Buffer | string;
  updatedAtMs: number;
};
