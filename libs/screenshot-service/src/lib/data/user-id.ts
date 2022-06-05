import { either } from 'fp-ts';
import * as Uuid from './uuid';

export type UserId = Uuid.Uuid & { tag: 'UserId' };

export const is = (value: unknown): value is UserId => Uuid.is(value);

export const decode = either.fromPredicate(
  is,
  () => new Error('failed to decode user id')
);
