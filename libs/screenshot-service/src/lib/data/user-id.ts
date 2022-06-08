import { makeDecode } from './result';
import * as Uuid from './uuid';

export type UserId = Uuid.Uuid & { tag: 'UserId' };

export const is = (value: unknown): value is UserId => Uuid.is(value);

export const decode = makeDecode(is, () => ({
  message: 'failed to decode user id',
}));
