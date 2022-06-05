import { either } from 'fp-ts';

export type Url = string & { type: 'Url' };

export const is = (value: unknown): value is Url => {
  if (typeof value !== 'string') {
    return false;
  }
  try {
    new URL(value);
    return true;
  } catch (error) {
    return false;
  }
};

export const decode = either.fromPredicate(
  is,
  () => new Error('failed to decode url')
);
