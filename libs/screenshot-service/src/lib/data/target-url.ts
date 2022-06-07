import * as Url from './url';
import { either } from 'fp-ts';

export type TargetUrl = Url.Url & { type: 'TargetUrl' };

export const is = (value: unknown): value is TargetUrl => {
  return Url.is(value);
};

export const decode = either.fromPredicate(is, () => ({
  message: 'failed to decode target url',
}));
