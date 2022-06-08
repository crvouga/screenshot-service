import { makeDecode } from './result';
import * as Url from './url';

export type TargetUrl = Url.Url & { type: 'TargetUrl' };

export const is = (value: unknown): value is TargetUrl => {
  return Url.is(value);
};

export const decode = makeDecode(is, () => ({
  message: 'failed to decode target url',
}));
