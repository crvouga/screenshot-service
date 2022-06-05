import { either } from 'fp-ts';
import * as Uuid from './uuid';

export type RequestId = Uuid.Uuid & { tag: 'IRequestId' };

export const is = (value: unknown): value is RequestId => Uuid.is(value);

export const decode = either.fromPredicate(
  is,
  () => new Error('failed to decode request id')
);

export const generate = (): RequestId => {
  const uuid = Uuid.generate();

  if (is(uuid)) {
    return uuid;
  }

  throw new Error('generating invalid uuid');
};
