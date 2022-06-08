import { makeDecode } from './result';
import * as Uuid from './uuid';

export type ScreenshotId = Uuid.Uuid & { tag: 'IScreenshotId' };

export const is = (value: unknown): value is ScreenshotId => Uuid.is(value);

export const decode = makeDecode(is, () => ({
  message: 'failed to decode screenshot id',
}));
