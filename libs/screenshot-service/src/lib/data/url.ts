import { makeDecode } from './result';

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

export const decode = makeDecode(is, () => ({
  message: 'failed to decode url',
}));
