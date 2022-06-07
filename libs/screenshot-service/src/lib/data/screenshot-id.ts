import { either } from 'fp-ts';
import * as Uuid from './uuid';

export type ScreenshotId = Uuid.Uuid & { tag: 'IScreenshotId' };

export const is = (value: unknown): value is ScreenshotId => Uuid.is(value);

export const decode = either.fromPredicate(is, () => ({
  message: 'failed to decode screenshot id',
}));
