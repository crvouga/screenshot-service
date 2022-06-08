import { makeDecode } from './result';
import * as Uuid from './uuid';

export type RequestId = Uuid.Uuid & { tag: 'IRequestId' };

export const is = (value: unknown): value is RequestId => Uuid.is(value);

export const decode = makeDecode(is, () => ({
  message: 'failed to decode request id',
}));

export const generate = (): RequestId => {
  const uuid = Uuid.generate();

  if (is(uuid)) {
    return uuid;
  }

  throw new Error('generating invalid uuid');
};
