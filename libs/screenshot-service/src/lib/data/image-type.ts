import { either } from 'fp-ts';

export type ImageType = 'jpeg' | 'png';

export const imageTypes = new Set(['jpeg', 'png']);

export const is = (value: unknown): value is ImageType =>
  typeof value === 'string' && imageTypes.has(value);

export const decode = either.fromPredicate(is, () => ({
  message: 'failed to decode image type',
}));
